import { NextRequest, NextResponse } from 'next/server';
import { WebScraper, scrapingConfigs } from '@/lib/scraper';
import { 
  saveScrapedProductsBatch, 
  createScrapingJob, 
  updateScrapingJob,
  ScrapedProductDB 
} from '@/lib/db/scraped-products';
import { Timestamp } from 'firebase/firestore';

export const maxDuration = 60; // Allow 60 seconds for scraping
export const dynamic = 'force-dynamic';

/**
 * Manual scraping endpoint - no authentication required
 * Simply visit this URL or curl it to scrape anime-store.jp
 * 
 * Usage: GET https://japanihaul.netlify.app/api/scrape/manual
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Manual scraping started...');
    
    // Configuration for anime-store.jp
    const siteConfig = {
      name: 'Anime Store JP',
      url: 'https://anime-store.jp/collections/newitems',
      configType: 'animeStore' as const,
      pages: 5 // Scrape 5 pages as requested
    };

    // Create a scraping job to track progress
    const jobId = await createScrapingJob({
      sourceSite: siteConfig.name,
      sourceUrl: siteConfig.url,
      startPage: 1,
      endPage: siteConfig.pages,
      triggeredBy: 'manual',
    });

    console.log(`📝 Created scraping job: ${jobId}`);

    // Update job status to running
    await updateScrapingJob(jobId, { status: 'running' });

    // Initialize scraper
    const scraper = new WebScraper();
    
    // Get scraping configuration
    const configFunction = scrapingConfigs[siteConfig.configType];
    if (!configFunction) {
      throw new Error(`No scraping config found for ${siteConfig.configType}`);
    }

    const scrapingConfig = configFunction(siteConfig.url);
    
    // Scrape the pages
    console.log(`🔍 Scraping ${siteConfig.pages} pages from ${siteConfig.name}...`);
    const products = await scraper.scrapePageBatch(
      scrapingConfig,
      1, // start page
      siteConfig.pages // end page
    );

    console.log(`✅ Scraped ${products.length} products`);

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
    if (dbProducts.length > 0) {
      console.log('💾 Saving products to Firebase...');
      const { added, updated } = await saveScrapedProductsBatch(dbProducts, jobId);
      console.log(`✅ Products saved to Firestore (${added} new, ${updated} updated)`);

      // Update job status
      await updateScrapingJob(jobId, {
        status: 'completed',
        productsScraped: products.length,
        productsAdded: added,
        productsUpdated: updated,
        completedAt: Timestamp.now(),
        duration: Math.round((Date.now() - startTime) / 1000),
      });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      message: '✅ Manual scraping completed successfully!',
      data: {
        jobId,
        productsScraped: products.length,
        site: siteConfig.name,
        pages: siteConfig.pages,
        duration: `${duration}s`
      }
    });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      duration: `${duration}s`
    }, { status: 500 });
  }
}
