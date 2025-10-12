# Environment Variables Setup

## Required Environment Variables

### 1. CRON_SECRET (Required for cron jobs)

**Purpose**: Secures the cron endpoint to prevent unauthorized access

**Generate a secret**:
```bash
# Method 1: Using openssl
openssl rand -base64 32

# Method 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Online generator
# Visit: https://www.random.org/strings/
```

**Add to Netlify**:
1. Go to Netlify Dashboard → Your Site
2. Site settings → Environment variables
3. Add variable:
   - Key: `CRON_SECRET`
   - Value: (your generated secret)
   - Scopes: All scopes
4. Click "Save"
5. **Important**: Redeploy your site!

**Add to `.env.local`** (for local testing):
```bash
CRON_SECRET=your_generated_secret_here
```

---

## GitHub Actions Secrets (If using GitHub Actions for cron)

Go to: Repository Settings → Secrets and variables → Actions

### Add these secrets:

1. **CRON_SECRET**
   - Same value as above
   
2. **SITE_URL**
   - Value: `https://your-site.netlify.app`
   - (Your production site URL without trailing slash)

---

## Firebase Environment Variables (Should already be set)

Make sure these are configured in Netlify:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## Verification

### Test locally:
```bash
# In project root
cat .env.local

# Should show:
# CRON_SECRET=...
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# etc.
```

### Test production:
```bash
curl https://your-site.netlify.app/api/cron/scrape
# Should return: {"message":"Cron scraping endpoint","status":"ready"...}
```

### Test with authentication:
```bash
curl -X POST https://your-site.netlify.app/api/cron/scrape \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"sites": ["amnibus"], "pagesPerSite": 1}'
  
# Should return: {"success":true,"message":"Scraped X products..."...}
```

---

## Security Checklist

- [ ] Never commit `.env.local` to Git
- [ ] Use strong, random secrets (32+ characters)
- [ ] Same secret in Netlify and cron service
- [ ] Redeploy after adding Netlify env vars
- [ ] Test endpoint before setting up cron
- [ ] Monitor logs for unauthorized access attempts

---

## Troubleshooting

**"Unauthorized" error**:
- Secret doesn't match between Netlify and cron service
- Missing `Bearer` prefix in Authorization header
- Environment variable not deployed (redeploy needed)

**"Missing scraping dependencies" error**:
- Cheerio/axios not installed
- Run: `npm install cheerio axios`

**Cron job not running**:
- Check cron service is active
- Verify cron expression is correct
- Check cron service logs for errors

**No products in Firestore**:
- Check Firebase credentials
- Verify Firestore rules allow writes
- Check Netlify function logs for errors
