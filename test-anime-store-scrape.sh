#!/bin/bash

echo "🧪 Scraping 5 pages from Anime Store JP and saving to Firebase..."
echo "=================================================================="
echo ""

# First, make sure you've set up CRON_SECRET in .env.local
# If not set, generate one:
if [ -z "$CRON_SECRET" ]; then
  echo "⚠️  CRON_SECRET not found in environment"
  echo "📝 Using a test secret for local development..."
  CRON_SECRET="test-secret-for-local-development"
fi

echo "🔄 Starting scrape job..."
echo ""

curl -X POST http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "sites": ["animeStore"],
    "pagesPerSite": 5
  }' \
  -w "\n\n⏱️  Time taken: %{time_total}s\nHTTP Status: %{http_code}\n" \
  | jq '.' 2>/dev/null || cat

echo ""
echo "=================================================================="
echo "✅ Scraping complete!"
echo ""
echo "📊 Check your results:"
echo "   1. Firestore Console: https://console.firebase.google.com"
echo "   2. Admin Dashboard: http://localhost:3000/en/admin/scraping"
echo "   3. Products API: http://localhost:3000/api/products/db"
echo ""
