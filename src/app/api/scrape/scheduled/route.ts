import { NextRequest, NextResponse } from 'next/server';
import { WebScraper } from '@/lib/scraper';
import { getWebsitesNeedingUpdate, updateWebsiteLastRun, getEnabledWebsites } from '@/lib/scraping-config';
import { addScrapedProducts } from '@/app/_data/products';

// GET /api/scrape/scheduled - Run scheduled scraping for all websites that need updating
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const forceAll = searchParams.get('force') === 'true';

        console.log('Starting scheduled scraping...');

        // Get websites that need updating (or all if forced)
        const websitesToUpdate = forceAll
            ? getEnabledWebsites()
            : getWebsitesNeedingUpdate();

        if (websitesToUpdate.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No websites need updating at this time',
                websitesChecked: 0,
                productsScraped: 0,
            });
        }

        console.log(`Updating ${websitesToUpdate.length} websites:`, websitesToUpdate.map(w => w.name));

        const scraper = new WebScraper();
        let totalProductsScraped = 0;
        const results = [];

        for (const website of websitesToUpdate) {
            try {
                console.log(`Scraping ${website.name} from ${website.url}...`);

                // Create scraping config with website URL
                const scrapingConfig = {
                    ...website.scrapingConfig,
                    url: website.url,
                };

                // Scrape products from this website
                const products = await scraper.scrapeProducts(scrapingConfig);

                if (products.length > 0) {
                    // Transform products to match our Product type
                    const transformedProducts = products.map((product, index) => ({
                        id: `scheduled_${website.name}_${Date.now()}_${index}`,
                        title: product.title,
                        price: product.price,
                        compareAt: product.originalPrice,
                        brand: product.brand || website.name,
                        type: product.category || 'General',
                        availability: product.availability,
                        labels: product.labels || [],
                        condition: product.condition,
                        isSoldOut: product.isSoldOut,
                        sourceUrl: website.url,
                    }));

                    // Store the products
                    await addScrapedProducts(transformedProducts);

                    totalProductsScraped += transformedProducts.length;

                    results.push({
                        website: website.name,
                        success: true,
                        productsScraped: transformedProducts.length,
                        url: website.url,
                    });

                    console.log(`✅ Successfully scraped ${transformedProducts.length} products from ${website.name}`);
                } else {
                    results.push({
                        website: website.name,
                        success: true,
                        productsScraped: 0,
                        url: website.url,
                        message: 'No products found',
                    });

                    console.log(`⚠️ No products found on ${website.name}`);
                }

                // Update last run time
                updateWebsiteLastRun(website.name);

            } catch (error) {
                console.error(`❌ Error scraping ${website.name}:`, error);

                results.push({
                    website: website.name,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    url: website.url,
                });
            }

            // Small delay between websites to be respectful
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const successfulScrapes = results.filter(r => r.success).length;
        const failedScrapes = results.filter(r => !r.success).length;

        console.log(`Scheduled scraping completed: ${successfulScrapes} successful, ${failedScrapes} failed, ${totalProductsScraped} total products`);

        return NextResponse.json({
            success: true,
            message: `Scraped ${totalProductsScraped} products from ${successfulScrapes} websites`,
            websitesUpdated: successfulScrapes,
            websitesFailed: failedScrapes,
            totalProducts: totalProductsScraped,
            results,
        });

    } catch (error) {
        console.error('Scheduled scraping error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to run scheduled scraping',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// POST /api/scrape/scheduled - Manual trigger for scheduled scraping
export async function POST(request: NextRequest) {
    // Same logic as GET but can be triggered manually
    const response = await GET(request);
    return response;
}
