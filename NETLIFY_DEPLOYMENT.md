# 🚀 Netlify Deployment Guide - Firebase Integration

This guide will help you deploy the Firebase-integrated product scraping to Netlify.

## ✅ Prerequisites

Your Firebase credentials should already be in Netlify environment variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 📋 Step 1: Create Firestore Database

1. **Go to Firebase Console**: https://console.firebase.google.com/project/japanihaul/firestore
2. **Click "Firestore Database"** in the left sidebar (under "Build" section)
3. **If database doesn't exist**:
   - Click **"Create database"**
   - Choose **"Start in production mode"**
   - Select region: **asia-northeast1** (Tokyo) or **us-central1**
   - Click **"Enable"**

4. **Set Security Rules** (important!):
   - Go to the "Rules" tab in Firestore
   - Replace with these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow server-side writes (from API routes)
    match /scrapedProducts/{productId} {
      allow read: if true;  // Anyone can read products
      allow write: if false;  // Only server can write (API routes)
    }
    
    match /scrapingJobs/{jobId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## 📦 Step 2: Deploy to Netlify

Run these commands in your terminal:

```bash
# Make sure you're in the frontend directory
cd /home/priyansh/japan-haul/frontend

# Add all changes
git add -A

# Commit with a descriptive message
git commit -m "Add Firebase database integration for product scraping"

# Push to trigger Netlify deployment
git push origin main
```

## ⏳ Step 3: Wait for Deployment

1. Go to: https://app.netlify.com (your dashboard)
2. Watch the deployment progress (should take 2-3 minutes)
3. Wait until you see **"Published"** status

## 🎯 Step 4: Trigger Manual Scraping

Once deployed, scrape products by simply visiting this URL in your browser:

```
https://japanihaul.netlify.app/api/scrape/manual
```

**Or use curl:**

```bash
curl https://japanihaul.netlify.app/api/scrape/manual
```

**Expected response:**
```json
{
  "success": true,
  "message": "✅ Manual scraping completed successfully!",
  "data": {
    "jobId": "abc123",
    "productsScraped": 100,
    "site": "animeStore",
    "pages": 5,
    "duration": "45.23s"
  }
}
```

## 🎉 Step 5: Verify Products on Site

Visit your products page:
```
https://japanihaul.netlify.app/en/products
```

You should now see the scraped products from anime-store.jp instead of the static products!

## 🔍 Verify in Firebase Console

Check that products were saved:
1. Go to: https://console.firebase.google.com/project/japanihaul/firestore
2. You should see two collections:
   - **scrapedProducts** - Contains all your products
   - **scrapingJobs** - Contains job tracking data

## ⚠️ Troubleshooting

### If scraping times out (504 error):
The endpoint has 60 seconds max. If it times out, the scraping might have partially completed. Check Firebase Console to see if some products were saved.

### If no products appear:
1. Check Netlify function logs: https://app.netlify.com → Your site → Functions
2. Verify Firebase credentials are correctly set in environment variables
3. Check that Firestore security rules allow reads

### If you see old static products:
The frontend will show database products first, then fall back to static products if database is empty. Make sure scraping completed successfully.

## 📊 How It Works

1. **Frontend** (`/en/products`):
   - Calls `getAllProducts()` from `src/app/_data/products.ts`
   - Fetches from `/api/products/db` (Firestore)
   - Falls back to static products if database is empty

2. **Database API** (`/api/products/db`):
   - Queries Firestore `scrapedProducts` collection
   - Supports filters: `?source=animeStore`, `?limit=50`
   - Returns products in frontend-compatible format

3. **Manual Scraping** (`/api/scrape/manual`):
   - Scrapes 5 pages from anime-store.jp
   - Saves ~100-150 products to Firestore
   - No authentication needed (for now)

## 🔄 Re-scraping

To refresh products, simply visit `/api/scrape/manual` again. It will update existing products and add new ones.

---

**Need help?** Check the Netlify function logs or Firebase Console for detailed error messages.
