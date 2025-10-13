import { NextRequest, NextResponse } from 'next/server';
import { WebScraper, scrapingConfigs } from '@/lib/scraper';
import { 
    createScrapingJob, 
    updateScrapingJob, 
    saveScrapedProductsBatch,
    ScrapedProductDB 
} from '@/lib/db/scraped-products';
import { Timestamp } from 'firebase/firestore';

// Configure for longer execution
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Security: Cron job secret key (set this in environment variables)
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-change-this';

/**
 * POST /api/cron/scrape
 * 
 * This endpoint is called by external cron services (cron-job.org, GitHub Actions, etc.)
 * to automatically scrape products and store them in Firestore.
 * 
 * Security: Requires CRON_SECRET in Authorization header
 */
export async function POST(request: NextRequest) {
    try {
        // Security check
        const authHeader = request.headers.get('authorization');
        const providedSecret = authHeader?.replace('Bearer ', '');
        
        if (providedSecret !== CRON_SECRET) {
            console.error('Unauthorized cron job attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('🕐 [CRON] Starting scheduled scraping job...');
        const startTime = Date.now();

        // Get parameters from request body (optional customization)
        const body = await request.json().catch(() => ({}));
        const {
            sites = ['amnibus'], // Default sites to scrape
            pagesPerSite = 3,     // Pages per site (safe for Netlify timeout)
        } = body;

        const scraper = new WebScraper();
        const results: {
            site: string;
            success: boolean;
            productsScraped: number;
            jobId?: string;
            error?: string;
        }[] = [];

        // Configuration for sites to scrape
        const siteConfigs = {
            amnibus: {
                name: 'Amnibus',
                url: 'https://amnibus.com/products/list',
                configType: 'amnibus' as const,
                pages: pagesPerSite,
            },
            animeStore: {
                name: 'Anime Store JP',
                url: 'https://anime-store.jp/collections/newitems',
                configType: 'animeStore' as const,
                pages: pagesPerSite, // Use the pagesPerSite parameter
            },
        };

        // Scrape each site
        for (const siteName of sites) {
            const siteConfig = siteConfigs[siteName as keyof typeof siteConfigs];
            
            if (!siteConfig) {
                console.warn(`Unknown site: ${siteName}`);
                continue;
            }

            console.log(`\n📍 [CRON] Scraping ${siteConfig.name}...`);

            // Create a job record in Firestore
            const jobId = await createScrapingJob({
                sourceSite: siteConfig.name,
                sourceUrl: siteConfig.url,
                startPage: 1,
                endPage: siteConfig.pages,
                triggeredBy: 'cron',
            });

            try {
                // Update job status to running
                await updateScrapingJob(jobId, { status: 'running' });

                // Get scraping configuration
                const configFunction = scrapingConfigs[siteConfig.configType];
                if (!configFunction) {
                    throw new Error(`No scraping config found for ${siteConfig.configType}`);
                }

                const scrapingConfig = configFunction(siteConfig.url);

                // Scrape products (batch for multiple pages)
                console.log(`🔄 [CRON] Scraping pages 1-${siteConfig.pages} from ${siteConfig.name}`);
                const products = await scraper.scrapePageBatch(
                    scrapingConfig,
                    1,
                    siteConfig.pages
                );

                console.log(`✅ [CRON] Scraped ${products.length} products from ${siteConfig.name}`);

                // Transform products to database format (filter out undefined values)
                const dbProducts: Omit<ScrapedProductDB, 'id' | 'scrapedAt' | 'lastUpdated' | 'isActive'>[] = products.map(product => {
                    const dbProduct: any = {
                        title: product.title,
                        price: product.price || 0,
                        brand: product.brand || siteConfig.name,
                        category: product.category || 'General',
                        availability: product.availability,
                        sourceUrl: product.sourceUrl,
                        sourceSite: siteConfig.name,
                    };

                    // Only add optional fields if they have values
                    if (product.originalPrice !== undefined && product.originalPrice !== null) {
                        dbProduct.originalPrice = product.originalPrice;
                    }
                    if (product.imageUrl) {
                        dbProduct.imageUrl = product.imageUrl;
                    }
                    if (product.description) {
                        dbProduct.description = product.description;
                    }
                    if (product.condition) {
                        dbProduct.condition = product.condition;
                    }
                    if (product.isSoldOut !== undefined) {
                        dbProduct.isSoldOut = product.isSoldOut;
                    }
                    if (product.labels && product.labels.length > 0) {
                        dbProduct.labels = product.labels;
                    }

                    return dbProduct;
                });

                // Save to Firestore
                const { added, updated } = await saveScrapedProductsBatch(dbProducts, jobId);

                // Update job status to completed
                await updateScrapingJob(jobId, {
                    status: 'completed',
                    productsScraped: products.length,
                    productsAdded: added,
                    productsUpdated: updated,
                    completedAt: Timestamp.now(),
                    duration: Math.round((Date.now() - startTime) / 1000),
                });

                results.push({
                    site: siteConfig.name,
                    success: true,
                    productsScraped: products.length,
                    jobId,
                });

                console.log(`✅ [CRON] ${siteConfig.name} completed: ${products.length} products (${added} new, ${updated} updated)`);

            } catch (error) {
                console.error(`❌ [CRON] Error scraping ${siteConfig.name}:`, error);

                // Update job status to failed
                await updateScrapingJob(jobId, {
                    status: 'failed',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    completedAt: Timestamp.now(),
                    duration: Math.round((Date.now() - startTime) / 1000),
                });

                results.push({
                    site: siteConfig.name,
                    success: false,
                    productsScraped: 0,
                    jobId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }

            // Delay between sites to avoid rate limiting
            if (sites.indexOf(siteName) < sites.length - 1) {
                console.log('⏱️  [CRON] Waiting 2 seconds before next site...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        const totalDuration = Math.round((Date.now() - startTime) / 1000);
        const successfulScrapes = results.filter(r => r.success).length;
        const totalProducts = results.reduce((sum, r) => sum + r.productsScraped, 0);

        console.log(`\n✅ [CRON] Job completed in ${totalDuration}s`);
        console.log(`📊 [CRON] Results: ${successfulScrapes}/${results.length} sites successful, ${totalProducts} total products`);

        return NextResponse.json({
            success: true,
            message: `Scraped ${totalProducts} products from ${successfulScrapes} sites`,
            duration: totalDuration,
            results,
        });

    } catch (error) {
        console.error('❌ [CRON] Fatal error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to run cron job',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/cron/scrape
 * 
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        message: 'Cron scraping endpoint',
        status: 'ready',
        usage: 'POST with Authorization: Bearer <CRON_SECRET>',
        documentation: 'See CRON_SETUP.md for setup instructions'
    });
}
