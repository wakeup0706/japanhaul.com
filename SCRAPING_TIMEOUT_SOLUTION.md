# Scraping Timeout Solution

## Problem
When scraping 15 pages, the operation takes too long and Netlify returns a 504 Gateway Timeout error.

## Root Cause
- Netlify Free tier has a **26-second timeout** for serverless functions
- Scraping 15 pages with 1-3 second delays between pages takes ~45-60 seconds
- This exceeds the Netlify timeout limit

## Solutions Implemented

### 1. **Batch Size Limitation** ✅
- Added validation to limit batch scraping to **maximum 50 pages per request**
- Recommended batch size: **3-5 pages** for Netlify free tier
- For 15 pages, split into **3 batches** of 5 pages each

### 2. **Improved Error Handling** ✅
- Added exponential backoff between requests
- Consecutive failure detection (stops after 3 consecutive failures)
- Better error messages with partial success information

### 3. **Timeout Configuration** ✅
- Increased Next.js route timeout to 300 seconds (maxDuration)
- Added netlify.toml with function timeout configuration
- Individual HTTP request timeout: 10 seconds

### 4. **Progress Tracking** ✅
- Added progress callbacks to monitor scraping status
- Console logging for each page scraped
- Total products count in real-time

## How to Use for 15 Pages

### Option A: Split into Multiple Batches (Recommended)
Instead of scraping pages 1-15 at once, do:

1. **Batch 1**: Pages 1-5
   - Start Page: 1
   - End Page: 5
   - Click "Start Batch Scraping"

2. **Batch 2**: Pages 6-10
   - Start Page: 6
   - End Page: 10
   - Click "Start Batch Scraping"

3. **Batch 3**: Pages 11-15
   - Start Page: 11
   - End Page: 15
   - Click "Start Batch Scraping"

All products will be accumulated in the "Scraped Products" section.

### Option B: Upgrade Netlify Plan
- **Netlify Pro**: 300-second timeout (supports up to 30 pages in one batch)
- **Netlify Business**: 900-second timeout (supports 100+ pages in one batch)

### Option C: Use Background Jobs (Advanced)
For very large scraping tasks (50+ pages), consider:
1. Implementing a queue system (e.g., Bull, Agenda)
2. Using a separate worker service (not serverless)
3. Storing progress in a database
4. Polling for completion status

## Technical Details

### Delays Between Requests
```javascript
// Standard delay: 1000ms
// After failure: 2000-5000ms (exponential backoff)
// Rate limiting protection: Automatic delay adjustment
```

### Timeout Hierarchy
1. **Individual HTTP request**: 10 seconds
2. **Netlify Function**: 26 seconds (free) / 300 seconds (pro)
3. **Next.js Route**: 300 seconds (maxDuration)
4. **Total batch operation**: Depends on page count × (10s + delay)

### Estimated Times
- **1 page**: ~2-5 seconds
- **5 pages**: ~15-25 seconds ✅ Works on free tier
- **10 pages**: ~30-50 seconds ⚠️ May timeout on free tier
- **15 pages**: ~45-75 seconds ❌ Will timeout on free tier

## Best Practices

1. **Start Small**: Test with 1-3 pages first
2. **Monitor Progress**: Watch the console logs in the scraping admin
3. **Handle Failures**: Some pages may fail due to network issues - that's normal
4. **Batch Wisely**: 3-5 pages per batch is optimal for free tier
5. **Wait Between Batches**: Give the server 10-15 seconds between batch requests

## Error Messages

### "504 Gateway Timeout"
- **Cause**: Request took longer than 26 seconds
- **Solution**: Reduce batch size to 3-5 pages

### "Page range too large"
- **Cause**: Trying to scrape more than 50 pages at once
- **Solution**: Split into smaller batches

### "Too many consecutive failures"
- **Cause**: 3+ pages in a row failed to scrape
- **Solution**: Check URL, internet connection, or website availability

## Future Improvements

- [ ] Implement streaming responses for real-time progress
- [ ] Add resume capability for interrupted scrapes
- [ ] Implement caching to avoid re-scraping same pages
- [ ] Add scheduled background jobs for large scrapes
- [ ] Implement rate limiting per website
- [ ] Add webhook notifications when scraping completes

## Questions?

If you continue to experience timeout issues:
1. Check Netlify function logs
2. Verify your tier limits
3. Consider upgrading to Netlify Pro
4. Use smaller batch sizes (3-5 pages maximum)
