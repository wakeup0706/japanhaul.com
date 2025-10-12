/**
 * Test script to validate scraper performance locally
 * Run this with: node test-scraper.mjs
 * 
 * This tests the scraper directly without going through the API
 */

import axios from 'axios';

async function testScraperViaAPI() {
    console.log('🧪 Starting scraper API test...\n');
    
    const startTime = Date.now();
    
    try {
        // Test configuration
        const testConfig = {
            url: 'https://amnibus.com/products/list',
            config: 'amnibus',
            startPage: 1,
            endPage: 15,
            batchSize: 1
        };
        
        console.log(`📋 Test Configuration:`);
        console.log(`   Base URL: ${testConfig.url}`);
        console.log(`   Start Page: ${testConfig.startPage}`);
        console.log(`   End Page: ${testConfig.endPage}`);
        console.log(`   Total Pages: ${testConfig.endPage - testConfig.startPage + 1}`);
        console.log(`   Batch Size: ${testConfig.batchSize}`);
        console.log(`\n${'='.repeat(60)}\n`);
        
        // Make request to local API
        console.log(`🚀 Making request to API...\n`);
        
        const response = await axios.post('http://localhost:3000/api/scrape/scheduled', testConfig, {
            timeout: 300000, // 5 minutes timeout for local testing
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`\n${'='.repeat(60)}\n`);
        console.log(`✅ API request completed successfully!`);
        console.log(`\n📊 Results:`);
        console.log(`   Total Products: ${response.data.products?.length || 0}`);
        console.log(`   Total Duration: ${duration}s`);
        
        if (response.data.products && response.data.products.length > 0) {
            const products = response.data.products;
            console.log(`   Products per page (avg): ${(products.length / (testConfig.endPage - testConfig.startPage + 1)).toFixed(1)}`);
            console.log(`   Average per page: ${(duration / (testConfig.endPage - testConfig.startPage + 1)).toFixed(2)}s`);
            
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
        }
        
        console.log(`\n${'='.repeat(60)}\n`);
        
    } catch (error) {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.error(`\n${'='.repeat(60)}\n`);
        console.error(`❌ API request failed after ${duration}s`);
        console.error(`\nError details:`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data?.error || error.message}`);
        } else {
            console.error(`   ${error.message}`);
        }
        console.log(`\n${'='.repeat(60)}\n`);
        process.exit(1);
    }
}

// Run the test
testScraperViaAPI();
