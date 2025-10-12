/**
 * Test script to validate scraper performance locally
 * Run this with: node test-scraper.js
 */

// Since we're using ES modules in TypeScript, we need to use dynamic imports
async function testScraper() {
    console.log('🧪 Starting scraper test...\n');
    
    const startTime = Date.now();
    
    try {
        // Dynamic import of the scraper
        const { WebScraper, scrapingConfigs } = await import('./src/lib/scraper.ts');
        
        const scraper = new WebScraper();
        
        // Configuration
        const baseUrl = 'https://amnibus.com/products/list';
        const startPage = 1;
        const endPage = 15; // Test with 15 pages
        
        console.log(`📋 Test Configuration:`);
        console.log(`   Base URL: ${baseUrl}`);
        console.log(`   Start Page: ${startPage}`);
        console.log(`   End Page: ${endPage}`);
        console.log(`   Total Pages: ${endPage - startPage + 1}`);
        console.log(`\n${'='.repeat(60)}\n`);
        
        // Get the scraping configuration
        const config = scrapingConfigs.amnibus(baseUrl);
        
        // Start batch scraping
        console.log(`🚀 Starting batch scraping...\n`);
        const products = await scraper.scrapePageBatch(config, startPage, endPage);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`\n${'='.repeat(60)}\n`);
        console.log(`✅ Scraping completed successfully!`);
        console.log(`\n📊 Results:`);
        console.log(`   Total Products: ${products.length}`);
        console.log(`   Products per page (avg): ${(products.length / (endPage - startPage + 1)).toFixed(1)}`);
        console.log(`   Total Duration: ${duration}s`);
        console.log(`   Average per page: ${(duration / (endPage - startPage + 1)).toFixed(2)}s`);
        
        // Show sample products
        console.log(`\n📦 Sample Products (first 3):`);
        products.slice(0, 3).forEach((product, index) => {
            console.log(`\n   ${index + 1}. ${product.title}`);
            console.log(`      Price: $${product.price}`);
            console.log(`      Image: ${product.imageUrl ? '✓' : '✗'}`);
            console.log(`      Availability: ${product.availability}`);
        });
        
        // Products without images
        const noImages = products.filter(p => !p.imageUrl).length;
        if (noImages > 0) {
            console.log(`\n⚠️  Warning: ${noImages} products without images`);
        }
        
        console.log(`\n${'='.repeat(60)}\n`);
        
    } catch (error) {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.error(`\n${'='.repeat(60)}\n`);
        console.error(`❌ Scraping failed after ${duration}s`);
        console.error(`\nError details:`);
        console.error(error);
        console.log(`\n${'='.repeat(60)}\n`);
        process.exit(1);
    }
}

// Run the test
testScraper();
