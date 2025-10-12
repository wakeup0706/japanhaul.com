# Testing the Scraper Locally

This guide explains how to test the scraper locally in VS Code to see if it can handle 15+ pages without timing out.

## Prerequisites

Make sure your local dev server is running:
```bash
npm run dev
```

## Method 1: Using curl (Recommended for Quick Tests)

### Basic Test (4 pages)
```bash
curl -X POST http://localhost:3000/api/scrape/scheduled \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://amnibus.com/products/list",
    "config": "amnibus",
    "startPage": 1,
    "endPage": 4,
    "batchSize": 1
  }'
```

### Extended Test (15 pages)
```bash
curl -X POST http://localhost:3000/api/scrape/scheduled \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://amnibus.com/products/list",
    "config": "amnibus",
    "startPage": 1,
    "endPage": 15,
    "batchSize": 1
  }'
```

### Save output to file
```bash
curl -X POST http://localhost:3000/api/scrape/scheduled \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://amnibus.com/products/list",
    "config": "amnibus",
    "startPage": 1,
    "endPage": 15,
    "batchSize": 1
  }' \
  -o scrape_results.json
```

## Method 2: Using the Test Script

We've created a test script that makes it easy to test the scraper with detailed output.

### Run the test:
```bash
node test-scraper.mjs
```

### Modify test parameters:
Edit `test-scraper.mjs` and change these values:
```javascript
const testConfig = {
    url: 'https://amnibus.com/products/list',
    config: 'amnibus',
    startPage: 1,
    endPage: 15,    // Change this to test more/fewer pages
    batchSize: 1
};
```

## Method 3: Using Postman or Insomnia

1. Create a new POST request
2. URL: `http://localhost:3000/api/scrape/scheduled`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "url": "https://amnibus.com/products/list",
  "config": "amnibus",
  "startPage": 1,
  "endPage": 15,
  "batchSize": 1
}
```

## Method 4: Using Browser Console

Open your browser console on `http://localhost:3000` and run:

```javascript
fetch('http://localhost:3000/api/scrape/scheduled', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://amnibus.com/products/list',
    config: 'amnibus',
    startPage: 1,
    endPage: 15,
    batchSize: 1
  })
})
.then(res => res.json())
.then(data => {
  console.log(`✅ Scraped ${data.products?.length || 0} products`);
  console.log(data);
})
.catch(err => console.error('❌ Error:', err));
```

## Understanding the Results

### Success Indicators:
- ✅ Status 200
- ✅ Products array populated
- ✅ Reasonable response time (< 2 minutes for 15 pages)

### Failure Indicators:
- ❌ Status 504 (Gateway Timeout)
- ❌ Status 500 (Server Error)
- ❌ Empty products array
- ❌ Response time > 5 minutes

## Expected Performance

With the current optimizations:
- **Per page**: ~3-5 seconds
- **4 pages**: ~15-25 seconds
- **15 pages**: ~60-90 seconds

## Troubleshooting

### Issue: "ECONNREFUSED" or "Cannot connect"
**Solution**: Make sure your dev server is running (`npm run dev`)

### Issue: Request takes too long
**Solution**: 
1. Check your internet connection
2. Try reducing the number of pages
3. Increase batch size to process multiple pages in parallel

### Issue: Getting 504 errors locally
**Solution**: This shouldn't happen locally. Check:
1. Is the website blocking your requests?
2. Are you behind a proxy/VPN?
3. Check the console for error messages

## Next Steps

If local testing works fine but Netlify times out:
1. ✅ The scraper code is working correctly
2. ❌ Netlify's timeout limits are the issue
3. 💡 Solutions:
   - Use a different hosting provider (Vercel, Railway, Render)
   - Implement a queue system with background jobs
   - Scrape fewer pages per request
   - Use scheduled cron jobs to scrape incrementally
