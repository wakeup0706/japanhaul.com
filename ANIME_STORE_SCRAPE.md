# 🎌 Quick Start: Scrape Anime Store Products

## What This Does

This will scrape **5 pages** of products from **anime-store.jp** and save them to your **Firebase Firestore** database. Your frontend will automatically display these products.

---

## ✅ Prerequisites

Make sure your development server is running:

```bash
cd /home/priyansh/japan-haul/frontend
npm run dev
```

Keep this running in one terminal, then open a new terminal for the commands below.

---

## 🚀 Quick Command (Copy & Paste)

### Option 1: Using the script

```bash
cd /home/priyansh/japan-haul/frontend
chmod +x scrape-anime-store.sh
./scrape-anime-store.sh
```

### Option 2: Direct curl command

```bash
curl -X POST http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer test-secret-for-local-development-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"sites": ["animeStore"], "pagesPerSite": 5}'
```

---

## 📊 What Happens

1. **Scrapes 5 pages** from anime-store.jp/collections/newitems
2. **Saves ~100-150 products** to Firebase Firestore
3. **Creates a job record** to track the scraping
4. **Takes ~40-60 seconds** to complete

---

## ✅ Verify It Worked

### 1. Check Firebase Console

Visit: https://console.firebase.google.com/project/ec-animetourism-b5c25/firestore

You should see:
- **scrapedProducts** collection with ~100-150 products
- **scrapingJobs** collection with your job status

### 2. Check Your Frontend

Visit: http://localhost:3000/en/products

You should see the scraped products displayed!

### 3. Check Admin Dashboard

Visit: http://localhost:3000/en/admin/scraping

You'll see:
- Statistics (total products, in stock, etc.)
- Recent scraping jobs
- Product grid with images

---

## 🔧 Customize

### Scrape More/Fewer Pages

Change the `pagesPerSite` number:

```bash
curl -X POST http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer test-secret-for-local-development-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"sites": ["animeStore"], "pagesPerSite": 10}'  # Change this number
```

### Scrape Different Site

Available sites:
- `animeStore` - anime-store.jp
- `amnibus` - amnibus.com

```bash
curl -X POST http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer test-secret-for-local-development-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"sites": ["amnibus"], "pagesPerSite": 5}'
```

### Scrape Multiple Sites

```bash
curl -X POST http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer test-secret-for-local-development-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"sites": ["animeStore", "amnibus"], "pagesPerSite": 3}'
```

---

## 🐛 Troubleshooting

### "401 Unauthorized"

The secret doesn't match. Make sure `.env.local` has:
```bash
CRON_SECRET=test-secret-for-local-development-change-in-production
```

### "Connection refused"

Your dev server isn't running. Start it with:
```bash
npm run dev
```

### "Firebase error"

Check your Firebase credentials in `.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ec-animetourism-b5c25
# etc.
```

### Products not showing on frontend

1. Hard refresh the browser (Ctrl+Shift+R)
2. Check browser console for errors
3. Verify products exist in Firestore console

---

## 📝 What Changed in Your Code

### Products now come from Firebase Database

Before:
```typescript
// Hardcoded products
const products = [...];
```

After:
```typescript
// Products from Firebase Firestore
getAllProducts() // Fetches from /api/products/db
```

### Files Modified

1. `src/app/_data/products.ts` - Now fetches from database
2. `src/app/api/cron/scrape/route.ts` - Support 5+ pages for anime store
3. `.env.local` - Added CRON_SECRET

### New Files

1. `scrape-anime-store.sh` - Quick scraping script
2. Firebase database integration

---

## 🎯 Next Steps

1. **Run the scrape command** (see above)
2. **Check Firebase** for your products
3. **View your frontend** to see them displayed
4. **Set up automated cron** (see CRON_SETUP.md)
5. **Deploy to production** (see QUICKSTART.md)

---

## 💡 Tips

- **First time**: Scrape 1-2 pages to test
- **Production**: Use 3 pages max (Netlify limits)
- **Local testing**: You can scrape as many pages as you want
- **Cache**: Products are cached for 5 minutes

---

## Success! 🎉

If you see products in:
- ✅ Firebase Console
- ✅ Your frontend at /en/products
- ✅ Admin dashboard

**You're all set!** Your products are now stored in Firebase and displayed dynamically on your frontend!

---

## Questions?

See the full documentation:
- `QUICKSTART.md` - Complete setup guide
- `CRON_SETUP.md` - Automated scraping
- `README_SCRAPING.md` - System overview
