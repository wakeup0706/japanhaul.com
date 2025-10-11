#!/usr/bin/env node

// Automated scraping script - runs every 30 minutes
const { execSync } = require('child_process');

try {
    console.log('[' + new Date().toISOString() + '] Starting scheduled scraping...');

    // Call the Next.js API endpoint for scheduled scraping
    const response = execSync('curl -s http://localhost:3000/api/scrape/scheduled', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
    });

    const result = JSON.parse(response);
    console.log('[' + new Date().toISOString() + '] Scraping completed:', result.message);

    if (result.results) {
        result.results.forEach(r => {
            console.log('[' + new Date().toISOString() + '] ' + r.website + ': ' +
                       (r.success ? '✅ ' + r.productsScraped + ' products' : '❌ ' + r.error));
        });
    }

} catch (error) {
    console.error('[' + new Date().toISOString() + '] Scraping failed:', error.message);
    process.exit(1);
}
