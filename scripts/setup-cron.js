#!/usr/bin/env node

// Script to set up cron job for automated scraping every 30 minutes
// Run with: node scripts/setup-cron.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CRON_SCHEDULE = '*/30 * * * *'; // Every 30 minutes
const SCRIPT_PATH = path.join(__dirname, 'scrape-scheduled.js');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'scraping.log');

console.log('Setting up automated scraping cron job...');

// Create logs directory if it doesn't exist
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create the scraping script
const scrapeScript = `#!/usr/bin/env node

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
`;

fs.writeFileSync(SCRIPT_PATH, scrapeScript);
fs.chmodSync(SCRIPT_PATH, '755');

console.log('✅ Created scraping script:', SCRIPT_PATH);

// Check if cron is available and set up the job
try {
    // Check current crontab
    const currentCrontab = execSync('crontab -l 2>/dev/null || echo ""', { encoding: 'utf8' });

    // Check if our job already exists
    if (currentCrontab.includes('scrape-scheduled.js')) {
        console.log('✅ Cron job already exists');
    } else {
        // Add new cron job
        const newCrontab = currentCrontab + '\\n' + CRON_SCHEDULE + ' ' + SCRIPT_PATH + ' >> ' + LOG_FILE + ' 2>&1\\n';

        // Write to temporary file and install
        const tempCrontab = '/tmp/crontab-temp';
        fs.writeFileSync(tempCrontab, newCrontab);

        execSync('crontab ' + tempCrontab);
        fs.unlinkSync(tempCrontab);

        console.log('✅ Cron job installed successfully');
        console.log('📅 Schedule:', CRON_SCHEDULE, '(every 30 minutes)');
        console.log('📝 Logs:', LOG_FILE);
    }

} catch (error) {
    console.log('⚠️ Could not set up cron job automatically');
    console.log('To set up manually, run:');
    console.log('crontab -e');
    console.log('Then add this line:');
    console.log(CRON_SCHEDULE, SCRIPT_PATH, '>>', LOG_FILE, '2>&1');
}

console.log('\\n🚀 Automated scraping is now set up!');
console.log('Your products will be updated every 30 minutes.');
console.log('Check the logs at:', LOG_FILE);
