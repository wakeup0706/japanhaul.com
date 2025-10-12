# 🚀 Quick Start: Automated Product Scraping

## What You Have Now

✅ **Firestore database** for storing scraped products  
✅ **Cron job API** endpoint (`/api/cron/scrape`)  
✅ **Admin dashboard** to view products  
✅ **GitHub Actions workflow** (optional)  
✅ **Complete documentation**  

---

## 5-Minute Setup

### Step 1: Generate a Secret Key

```bash
# Run this command:
openssl rand -base64 32

# Copy the output (something like: XyZ123abc...)
```

### Step 2: Add to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add:
   - Key: `CRON_SECRET`
   - Value: (paste your generated secret from Step 1)
6. Click **Save**
7. **Deploy site** (trigger a new deploy)

### Step 3: Set Up Cron Job

**Option A: cron-job.org (Recommended)**

1. Sign up at [cron-job.org](https://cron-job.org/en/signup.php)
2. Create new cronjob:
   - URL: `https://YOUR-SITE.netlify.app/api/cron/scrape`
   - Schedule: Every 6 hours (`0 */6 * * *`)
   - Method: POST
   - Add header:
     - Name: `Authorization`
     - Value: `Bearer YOUR_SECRET_FROM_STEP_1`
   - Request body:
     ```json
     {"sites": ["amnibus"], "pagesPerSite": 3}
     ```
3. Save and test!

**Option B: GitHub Actions**

1. Go to your repository settings
2. **Secrets and variables** → **Actions**
3. Add two secrets:
   - `CRON_SECRET`: (your secret from Step 1)
   - `SITE_URL`: `https://YOUR-SITE.netlify.app`
4. The workflow is already in `.github/workflows/scrape-cron.yml`
5. It will run automatically every 6 hours!

### Step 4: Test It!

```bash
# Test the endpoint:
curl -X POST https://YOUR-SITE.netlify.app/api/cron/scrape \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"sites": ["amnibus"], "pagesPerSite": 1}'

# You should see:
# {"success":true,"message":"Scraped X products..."}
```

### Step 5: Check Your Database

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database**
4. You should see:
   - `scrapedProducts` collection (your products!)
   - `scrapingJobs` collection (job history)

---

## View Your Products

### Admin Dashboard:
Visit: `https://YOUR-SITE.netlify.app/en/admin/scraping`

You can also add the database view component to your admin page:

```tsx
import { DatabaseProductsView } from './_components/DatabaseProductsView';

// In your component:
<DatabaseProductsView />
```

---

## What Happens Next?

1. ⏰ **Every 6 hours**, the cron service calls your API
2. 🤖 **Your API** scrapes products from configured websites
3. 💾 **Products are saved** to Firestore
4. 📊 **Admin dashboard** shows updated products
5. 📈 **Job history** tracks all scraping runs

---

## Troubleshooting

**"Unauthorized" error?**
- Make sure `CRON_SECRET` matches in Netlify and cron service
- Check the `Authorization` header format: `Bearer YOUR_SECRET`

**No products in Firestore?**
- Check Netlify function logs
- Verify Firebase credentials in environment variables
- Make sure Firestore is enabled in Firebase console

**Cron not running?**
- Verify cron service is active
- Check cron service logs
- Test endpoint manually with curl

---

## Documentation

- 📖 **CRON_SETUP.md** - Complete setup guide
- 🔑 **ENV_SETUP.md** - Environment variables reference
- 🧪 **TESTING_SCRAPER.md** - Testing guide
- 💡 **SCRAPING_SOLUTION.md** - Architecture overview

---

## Next Steps

1. ✅ Set up the cron job
2. Wait for first run (or trigger manually)
3. Check Firestore for products
4. Customize scraping sites in `/api/cron/scrape/route.ts`
5. Adjust schedule if needed
6. Set up email notifications (optional)

---

## Support

If you have issues:
1. Check Netlify function logs
2. Check Firebase console logs
3. Test endpoint manually
4. Review documentation files

---

## That's It! 🎉

Your product scraping is now fully automated. Products will be scraped and updated every 6 hours without any manual intervention!
