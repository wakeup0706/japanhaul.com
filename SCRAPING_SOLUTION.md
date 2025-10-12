# Scraping Solution - Netlify Timeout Issue

## 🎯 Problem Identified

Your scraper **works perfectly** locally:
- ✅ Successfully scraped **870 products** from **15 pages**
- ✅ Took **129.88 seconds** (~2.16 minutes)
- ✅ Average: **~8.66 seconds per page**
- ✅ No errors, no memory issues, no rate limiting

**BUT** Netlify has strict timeout limits:
- ❌ Free tier: **10 seconds max**
- ❌ Pro tier: **26 seconds max**
- ⚠️ Your 15-page scrape: **130 seconds** (5x over limit!)

## 📊 Solutions Ranked by Difficulty

### Solution 1: **Limit Batch Size** (EASIEST - Do This Now!)

**On Netlify Free Tier:**
- Maximum pages per batch: **1 page**
- Estimated time: ~8.66 seconds ✅

**On Netlify Pro Tier ($19/mo):**
- Maximum pages per batch: **3 pages**
- Estimated time: ~26 seconds ✅

**Implementation:**
1. In your admin UI, set max `endPage - startPage ≤ 3`
2. Run multiple batches: Pages 1-3, then 4-6, then 7-9, etc.
3. Combine results in the UI

**Quick Fix for UI:**
```tsx
// In your admin scraping page component
const maxPagesPerBatch = 3; // Or 1 for free tier

// Validation
if (endPage - startPage + 1 > maxPagesPerBatch) {
  alert(`Maximum ${maxPagesPerBatch} pages per batch on Netlify. Please reduce your range.`);
  return;
}
```

---

### Solution 2: **Use a Queue System** (MEDIUM)

Use a service like:
- **Upstash QStash** (Free tier available)
- **BullMQ** with Redis
- **AWS SQS**

**How it works:**
1. User clicks "Scrape 15 pages"
2. API creates 15 separate queue jobs (1 page each)
3. Each job runs independently (under 10 seconds)
4. Results are stored in database as they complete
5. UI polls for updates

**Pros:**
- ✅ Works on Netlify free tier
- ✅ Can scrape unlimited pages
- ✅ Resilient to failures

**Cons:**
- ⚠️ More complex setup
- ⚠️ Need external service (Upstash/Redis)
- ⚠️ Takes longer overall (sequential)

---

### Solution 3: **Switch Hosting** (MEDIUM-HARD)

Move to a platform with longer timeouts:

| Platform | Max Timeout | Cost |
|----------|-------------|------|
| **Railway** | 500 seconds | Free tier, then $5/mo |
| **Render** | 300 seconds | Free tier, then $7/mo |
| **Vercel** | 300 seconds (Pro) | Free tier: 10s, Pro: $20/mo |
| **Fly.io** | Unlimited | Pay as you go (~$5/mo) |
| **Digital Ocean** | Unlimited | $4/mo |

**Best Options:**
1. **Railway.app** - Easy migration, generous free tier, 500s timeout
2. **Render.com** - Simple setup, good free tier, 300s timeout
3. **Fly.io** - Full control, unlimited timeout, cheap

**Migration Steps:**
1. Export your code
2. Connect to new platform's Git integration
3. Set environment variables
4. Deploy
5. Update DNS

---

### Solution 4: **Cron Job Approach** (RECOMMENDED FOR PRODUCTION)

Instead of on-demand scraping, use scheduled background jobs:

**Setup:**
1. Create a cron job API route (you already have `/api/scrape/scheduled`)
2. Use external cron service:
   - **Cron-job.org** (Free)
   - **EasyCron** (Free)
   - **GitHub Actions** (Free)
   - **Netlify Scheduled Functions** (Pro tier)

**How it works:**
```
Every 6 hours:
  → Trigger: https://yoursite.com/api/scrape/scheduled
  → Scrapes 3 pages at a time
  → Stores in database
  → Repeats until all pages scraped
```

**Pros:**
- ✅ Works within Netlify limits
- ✅ No user waiting
- ✅ Products always up to date
- ✅ Can use free tier

**Cons:**
- ⚠️ Not instant (scheduled)
- ⚠️ Need external cron service

---

### Solution 5: **Hybrid Approach** (BEST)

Combine multiple solutions:

**For small scrapes (1-3 pages):**
- Use direct API call
- Instant results
- Works on Netlify

**For large scrapes (4+ pages):**
- Use cron job or queue
- Show "Scraping in progress..."
- Poll for completion
- Email when done

**Implementation:**
```tsx
async function handleScrape(startPage, endPage) {
  const pageCount = endPage - startPage + 1;
  
  if (pageCount <= 3) {
    // Direct scraping (instant)
    const result = await fetch('/api/scrape', {
      method: 'POST',
      body: JSON.stringify({ startPage, endPage, ... })
    });
    // Show results immediately
  } else {
    // Queue-based scraping (async)
    await fetch('/api/scrape/queue', {
      method: 'POST',
      body: JSON.stringify({ startPage, endPage, ... })
    });
    // Show "Processing... Check back in 5 minutes"
    // Or implement polling/websockets
  }
}
```

---

## 🚀 Recommended Action Plan

### Immediate (Today):

1. **Limit batch size to 3 pages max** in your UI
2. Add warning message: "Maximum 3 pages per batch on Netlify"
3. Users can run multiple batches manually

### Short-term (This Week):

1. **Set up external cron job** using cron-job.org
2. Configure it to hit `/api/scrape/scheduled` every 6 hours
3. Gradually builds up product database automatically

### Long-term (Next Month):

1. **Evaluate migration to Railway or Render**
2. If you need instant large scrapes, move hosting
3. Or implement queue system (Upstash QStash)

---

## 📝 Code Changes for Immediate Fix

### Update the API route to enforce limits:

```typescript
// In /api/scrape/route.ts
const MAX_PAGES_PER_BATCH = process.env.VERCEL_ENV === 'production' ? 3 : 50;

if (startPage !== undefined && endPage !== undefined) {
  const pageCount = endPage - startPage + 1;
  
  if (pageCount > MAX_PAGES_PER_BATCH) {
    return NextResponse.json({
      error: 'Batch size too large for Netlify',
      details: `Maximum ${MAX_PAGES_PER_BATCH} pages per batch. Please reduce your range or upgrade hosting.`,
      suggestion: 'Run multiple smaller batches (e.g., pages 1-3, then 4-6, etc.)'
    }, { status: 400 });
  }
}
```

### Update UI to warn users:

```tsx
// In admin scraping page
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
  <p className="text-sm text-yellow-800">
    ⚠️ <strong>Netlify Limitation:</strong> Maximum 3 pages per batch.
    For larger scrapes, run multiple batches or use the scheduled scraping feature.
  </p>
</div>
```

---

## 🎯 Summary

**Your scraper is perfect!** The only issue is hosting limitations.

**Best immediate solution:** Limit to 3 pages per batch
**Best long-term solution:** Switch to Railway or Render for unlimited timeout
**Best production solution:** Use scheduled cron jobs to keep products updated automatically

Let me know which approach you want to implement! 🚀
