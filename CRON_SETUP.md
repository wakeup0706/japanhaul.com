# Automated Cron Job Setup Guide

This guide will help you set up automated product scraping that runs every 6 hours and stores results in Firestore.

## 🎯 What This Does

- **Automatically scrapes** products from configured websites every 6 hours
- **Stores** all products in Firestore database
- **Tracks** scraping jobs with status and metrics
- **No timeout issues** - processes sites in batches within limits
- **Zero maintenance** - runs completely automated

---

## 📋 Prerequisites

1. ✅ Firebase project set up
2. ✅ Firestore database enabled
3. ✅ Environment variables configured
4. ⬜ Cron secret key (we'll create this)

---

## 🔧 Step 1: Set Up Environment Variables

### Add to `.env.local` (for local testing):

```bash
# Cron Job Security
CRON_SECRET=your-super-secret-key-change-this-to-something-random
```

### Add to Netlify Environment Variables:

1. Go to your Netlify dashboard
2. Navigate to: **Site settings** → **Environment variables**
3. Add new variable:
   - **Key**: `CRON_SECRET`
   - **Value**: `your-super-secret-key-change-this-to-something-random`
   - **Scopes**: All scopes
4. Click **Save**
5. **Redeploy** your site for changes to take effect

> 💡 **Generate a strong secret**: Run `openssl rand -base64 32` or use a password generator

---

## 🌐 Step 2: Choose Your Cron Service

We'll use **cron-job.org** (free, reliable, easy to set up).

### Option A: cron-job.org (Recommended - Free)

1. **Sign up**: Go to [https://cron-job.org](https://cron-job.org/en/signup.php)
2. **Verify email** and log in
3. **Create new cron job**:
   - Click **"Cronjobs"** → **"Create cronjob"**
   
4. **Configure the job**:
   
   **Title**: `JapanHaul Product Scraping`
   
   **URL**: `https://your-site.netlify.app/api/cron/scrape`
   (Replace with your actual Netlify URL)
   
   **Schedule**: 
   - Every **6 hours**
   - Or use cron expression: `0 */6 * * *`
   
   **Request method**: `POST`
   
   **Custom Headers**:
   - Click "Add header"
   - Header name: `Authorization`
   - Header value: `Bearer your-super-secret-key-change-this-to-something-random`
   (Use the same secret from Step 1)
   
   **Request body** (optional):
   ```json
   {
     "sites": ["amnibus"],
     "pagesPerSite": 3
   }
   ```
   
   **Content-Type**: `application/json`
   
5. **Save** the cron job

6. **Test it**: Click "Run now" to test immediately

---

### Option B: GitHub Actions (Free, More Control)

Create `.github/workflows/scrape-cron.yml`:

```yaml
name: Scheduled Product Scraping

on:
  schedule:
    # Runs every 6 hours
    - cron: '0 */6 * * *'
  workflow_dispatch: # Allows manual triggering

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Scraping API
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{"sites": ["amnibus"], "pagesPerSite": 3}' \
            https://your-site.netlify.app/api/cron/scrape
```

**Setup**:
1. Add `CRON_SECRET` to GitHub Secrets:
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `CRON_SECRET`
   - Value: Your secret key
2. Commit the workflow file
3. GitHub will run it automatically

---

### Option C: EasyCron (Free tier available)

1. Sign up at [https://www.easycron.com](https://www.easycron.com)
2. Create new cron job:
   - URL: `https://your-site.netlify.app/api/cron/scrape`
   - Cron expression: `0 */6 * * *`
   - HTTP Method: POST
   - Custom Headers: `Authorization: Bearer YOUR_SECRET`
   - POST Data: `{"sites": ["amnibus"], "pagesPerSite": 3}`

---

## 🧪 Step 3: Test the Cron Endpoint

### Test locally:

```bash
# Start your dev server
npm run dev

# In another terminal, test the endpoint:
curl -X POST http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer your-super-secret-key-change-this-to-something-random" \
  -H "Content-Type: application/json" \
  -d '{"sites": ["amnibus"], "pagesPerSite": 3}'
```

### Test on production:

```bash
curl -X POST https://your-site.netlify.app/api/cron/scrape \
  -H "Authorization: Bearer your-super-secret-key-change-this-to-something-random" \
  -H "Content-Type: application/json" \
  -d '{"sites": ["amnibus"], "pagesPerSite": 3}'
```

You should see a response like:
```json
{
  "success": true,
  "message": "Scraped 174 products from 1 sites",
  "duration": 26,
  "results": [...]
}
```

---

## 📊 Step 4: Monitor Your Scraping

### View in Firestore:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. You'll see two collections:
   - `scrapedProducts` - All scraped products
   - `scrapingJobs` - Job history and status

### Check the admin dashboard:

Visit: `https://your-site.netlify.app/en/admin/scraping`

You'll see:
- All scraped products
- Job history
- Statistics
- Ability to manually trigger scraping

---

## ⚙️ Customization

### Scrape multiple sites:

```json
{
  "sites": ["amnibus", "animeStore"],
  "pagesPerSite": 3
}
```

### Adjust pages per site:

```json
{
  "sites": ["amnibus"],
  "pagesPerSite": 5
}
```

> ⚠️ **Warning**: Keep `pagesPerSite ≤ 3` to avoid Netlify timeouts

### Add more sites:

Edit `/src/app/api/cron/scrape/route.ts` and add to `siteConfigs`:

```typescript
const siteConfigs = {
  amnibus: { ... },
  animeStore: { ... },
  yourNewSite: {
    name: 'Your New Site',
    url: 'https://example.com/products',
    configType: 'generic',
    pages: 3,
  },
};
```

---

## 🔒 Security Best Practices

1. **Never commit your CRON_SECRET** to Git
2. **Use a strong, random secret** (32+ characters)
3. **Rotate the secret** periodically
4. **Monitor logs** for unauthorized attempts
5. **Use HTTPS** only (never HTTP)

---

## 📈 Expected Performance

With current settings:
- **Per site**: ~25-30 seconds
- **Per job**: ~30-60 seconds (1-2 sites)
- **Products per run**: 150-300+
- **Firestore writes**: 150-300+ per run
- **Cost**: Free tier should handle this easily

**Firestore free tier limits:**
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

Running 4 times per day (every 6 hours) with 300 products = 1,200 writes/day ✅

---

## 🐛 Troubleshooting

### Cron job fails with 401 Unauthorized:
- Check that CRON_SECRET matches in both Netlify and cron service
- Verify the `Authorization` header format: `Bearer YOUR_SECRET`

### Cron job times out:
- Reduce `pagesPerSite` to 2 or 1
- Scrape fewer sites per job
- Split into multiple cron jobs

### No products being saved:
- Check Firestore rules allow writes
- Verify Firebase credentials are correct in environment variables
- Check Netlify deploy logs for errors

### Products duplicating:
- This is normal - products are updated based on their ID
- Duplicates only occur if the `generateProductId` function changes

---

## 📝 Firestore Rules

Make sure your Firestore rules allow the server to write:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Scraped Products - Server writes, authenticated reads
    match /scrapedProducts/{productId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server-side writes via Admin SDK
    }
    
    // Scraping Jobs - Server writes, admin reads
    match /scrapingJobs/{jobId} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow write: if false; // Only server-side writes
    }
  }
}
```

---

## ✅ Checklist

- [ ] Set `CRON_SECRET` in `.env.local`
- [ ] Set `CRON_SECRET` in Netlify environment variables
- [ ] Deploy to Netlify
- [ ] Create cron job on cron-job.org (or GitHub Actions)
- [ ] Test the endpoint manually
- [ ] Wait for first automated run
- [ ] Check Firestore for new products
- [ ] Verify in admin dashboard

---

## 🎉 You're Done!

Your products will now be automatically scraped and updated every 6 hours!

**Next steps:**
- Set up email notifications for failed jobs
- Create a public products page
- Add product search functionality
- Implement price tracking

---

## 📞 Support

If you encounter issues:
1. Check Netlify function logs
2. Check Firebase console logs
3. Verify all environment variables are set
4. Test the endpoint manually with curl

For more help, see:
- `SCRAPING_SOLUTION.md` - Architecture overview
- `TESTING_SCRAPER.md` - Testing guide
- Firebase documentation
- Netlify documentation
