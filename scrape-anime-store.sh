#!/bin/bash

echo "🎌 Testing Anime Store Scraping (5 pages)"
echo "=========================================="
echo ""
echo "📝 This will:"
echo "   1. Scrape 5 pages from anime-store.jp"
echo "   2. Save products to Firebase Firestore"
echo "   3. Display results"
echo ""
echo "🔄 Starting scrape..."
echo ""

curl -X POST http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer test-secret-for-local-development-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"sites": ["animeStore"], "pagesPerSite": 5}'

echo ""
echo ""
echo "=========================================="
echo "✅ Done!"
echo ""
echo "📊 View your products:"
echo "   • Firestore: https://console.firebase.google.com/project/ec-animetourism-b5c25/firestore"
echo "   • Frontend: http://localhost:3000/en/products"
echo "   • Admin: http://localhost:3000/en/admin/scraping"
echo ""
