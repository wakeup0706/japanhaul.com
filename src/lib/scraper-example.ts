// Example usage of the web scraping functionality
// This file demonstrates how to use the scraper programmatically

import { WebScraper, scrapingConfigs } from './scraper';
import { addScrapedProducts } from '@/app/_data/products';

export async function scrapeExampleWebsite() {
    const scraper = new WebScraper();

    try {
        // Example 1: Use generic configuration
        console.log('Starting generic scraping...');
        const genericProducts = await scraper.scrapeProducts({
            url: 'https://example-shop.com/products', // Replace with actual URL
            selectors: scrapingConfigs.generic('https://example-shop.com/products').selectors,
        });

        console.log(`Found ${genericProducts.length} products with generic config`);

        // Example 2: Use custom configuration for a specific site
        console.log('Starting custom scraping...');
        const customProducts = await scraper.scrapeProducts({
            url: 'https://special-store.com/items',
            selectors: {
                productList: '.item-grid',
                productCard: '.product-card',
                title: '.product-title',
                price: '.current-price',
                originalPrice: '.original-price',
                image: '.product-image img',
                availability: '.stock-status',
            },
        });

        console.log(`Found ${customProducts.length} products with custom config`);

        // Example 3: Scrape multiple pages
        console.log('Starting multi-page scraping...');
        const allProducts = await scraper.scrapeMultiplePages({
            url: 'https://store.com/products',
            selectors: scrapingConfigs.amazon('https://store.com/products').selectors,
            pagination: {
                nextPageSelector: '.next-page, a[rel="next"]',
                maxPages: 3,
            },
        });

        console.log(`Found ${allProducts.length} total products across multiple pages`);

        // Example 4: Store scraped products
        if (allProducts.length > 0) {
            console.log('Storing scraped products...');
            await addScrapedProducts(allProducts.map(p => ({
                title: p.title,
                price: p.price,
                originalPrice: p.originalPrice,
                brand: p.brand || 'Scraped',
                type: p.category || 'General',
                availability: p.availability,
                imageUrl: p.imageUrl,
                description: p.description,
                sourceUrl: p.sourceUrl,
            })));

            console.log('Products stored successfully!');
        }

    } catch (error) {
        console.error('Scraping failed:', error);
    }
}

// Example of how to test scraping configurations
export async function testScrapingConfiguration() {
    const scraper = new WebScraper();

    const testConfigs = [
        scrapingConfigs.generic('https://example.com'),
        scrapingConfigs.amazon('https://amazon-like-site.com'),
        scrapingConfigs.ebay('https://ebay-like-site.com'),
    ];

    for (const config of testConfigs) {
        try {
            console.log(`Testing configuration: ${JSON.stringify(config)}`);
            const testResult = await scraper.scrapeProducts({
                ...config,
                url: config.url, // This would be replaced with actual URLs
            });
            console.log(`Configuration test successful: ${testResult.length} products found`);
        } catch (error) {
            console.error(`Configuration test failed:`, error);
        }
    }
}

// Utility function to validate URLs before scraping
export function isValidScrapingUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);

        // Basic validation - add more rules as needed
        const validDomains = [
            '.com', '.net', '.org', '.co.uk', '.de', '.fr', '.it', '.es',
            // Add more domains as needed
        ];

        const isValidDomain = validDomains.some(domain =>
            parsedUrl.hostname.endsWith(domain)
        );

        return parsedUrl.protocol === 'https:' && isValidDomain;
    } catch {
        return false;
    }
}
