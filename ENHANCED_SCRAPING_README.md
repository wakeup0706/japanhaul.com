# 🚀 Enhanced Scraping System - Complete Setup Guide

This enhanced scraping system automatically scrapes products from multiple websites every 30 minutes, detects sold-out items and used products, and displays them with appropriate labels.

## ✨ New Features

### 🔄 **Automated Scheduling**
- Scrapes all configured websites every 30 minutes
- Automatic detection of which websites need updates
- Cron job setup for hands-free operation

### 🏷️ **Smart Product Detection**
- **"Sold" labels** for sold-out products
- **"Used" labels** for second-hand/pre-owned items
- Enhanced condition detection (new/used/refurbished)
- Visual indicators in product listings and detail pages

### 📊 **JSON-LD Structured Data Support**
- **Primary scraping method** - Uses schema.org JSON-LD data when available
- **Highly reliable** - Structured data provides accurate product information
- **Automatic parsing** - Extracts name, price, images, descriptions from JSON-LD
- **Fallback to HTML** - Uses CSS selectors if JSON-LD isn't available

### 🌐 **Multi-Website Support**
- Configure multiple websites to scrape
- Individual website management and scheduling
- Separate scraping configurations per website

## 🛠️ Setup Instructions

### 1. **Install Dependencies**
```bash
npm install cheerio axios @types/cheerio
```

### 2. **Configure Your Websites**
Edit `src/lib/scraping-config.ts` and add your target websites:

```typescript
export const WEBSITE_CONFIGS: WebsiteConfig[] = [
    {
        name: "Japanese Sweets Store",
        url: "https://your-target-site.com/products",
        enabled: true,
        scrapingConfig: {
            selectors: {
                productList: ".products, .product-grid",
                productCard: ".product, .item",
                title: "h1, h2, .title",
                price: ".price, .amount",
                // ... other selectors
            }
        },
        schedule: {
            enabled: true,
            intervalMinutes: 30
        }
    }
    // Add more websites...
];
```

### 3. **Set Up Automated Scraping**
Run the cron job setup script:
```bash
node scripts/setup-cron.js
```

This will:
- Create the automated scraping script
- Set up a cron job to run every 30 minutes
- Create log files for monitoring

### 4. **Manual Testing**
Test your configuration by visiting:
- `/admin/scraping/websites` - Manage website configurations
- `/admin/scraping` - Manual scraping interface

## 🎯 How It Works

### **Automated Detection Features**

#### 🔍 **Sold Out Detection**
The scraper looks for these indicators:
- Text: "sold out", "out of stock", "unavailable", "discontinued"
- CSS classes: `out-of-stock`, `sold-out`, `unavailable`
- HTML attributes with stock information

#### 🏷️ **Used Item Detection**
The scraper identifies:
- Text: "used", "second hand", "pre-owned", "refurbished"
- CSS classes indicating condition
- Product descriptions mentioning used status

#### 📅 **Scheduling System**
- Each website has its own update schedule (default: 30 minutes)
- System tracks last update time for each website
- Only scrapes websites that need updating
- Logs all scraping activity

### **Product Labels**
Products now display:
- **🔴 "Sold"** - Gray label for sold-out items
- **🟠 "Used"** - Orange label for second-hand items
- **💰 "Sale %"** - Red label for discount percentage

## 📁 File Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── scraper.ts              # Enhanced scraper with detection
│   │   ├── scraping-config.ts      # Multi-website configuration
│   │   └── scraper-example.ts      # Usage examples
│   ├── app/
│   │   ├── api/
│   │   │   ├── scrape/
│   │   │   │   └── scheduled/route.ts    # Automated scraping endpoint
│   │   │   └── products/scraped/route.ts # Product management
│   │   ├── _data/products.ts       # Enhanced with new fields
│   │   └── [lang]/admin/scraping/
│   │       ├── page.tsx            # Manual scraping interface
│   │       └── websites/page.tsx   # Website management
│   └── ENHANCED_SCRAPING_README.md # This guide
├── scripts/
│   ├── setup-cron.js               # Cron job setup
│   └── scrape-scheduled.js         # Automated scraping script
└── logs/
    └── scraping.log                # Scraping activity logs
```

## ⚙️ Configuration Examples

### **Website Configuration Template**
```typescript
{
    name: "Your Store Name",
    url: "https://your-store.com/products",
    enabled: true,
    scrapingConfig: {
        selectors: {
            productList: ".products, .product-grid, .items",
            productCard: ".product, .item, article",
            title: ".product-title, h3, .title",
            price: ".price, .amount, .cost",
            originalPrice: ".original-price, .was-price",
            image: ".product-image img, img",
            description: ".description, .summary",
            availability: ".stock, .availability"
        },
        pagination: {
            nextPageSelector: ".next, a[rel='next']",
            maxPages: 3
        }
    },
    schedule: {
        enabled: true,
        intervalMinutes: 30
    }
}
```

### **Common Selector Patterns**

#### **E-commerce Sites**
```json
{
  "productList": ".products, .product-list, .catalog",
  "productCard": ".product, .item, .product-card",
  "title": ".product-title, h3, .name",
  "price": ".price, .current-price, .sale-price"
}
```

#### **Japanese Sites (Common Patterns)**
```json
{
  "productList": ".商品一覧, .items, .product-grid",
  "productCard": ".商品, .item, .card",
  "title": ".商品名, .title, h3",
  "price": ".価格, .price, .金額"
}
```

## 🔧 Management Interfaces

### **Website Management** (`/admin/scraping/websites`)
- Enable/disable websites
- View update schedules and last run times
- Manual "Scrape All Now" button
- Real-time scraping results

### **Manual Scraping** (`/admin/scraping`)
- Test individual website configurations
- Custom selector configuration
- Immediate scraping for testing

## 📊 Monitoring

### **Log Files**
- Location: `logs/scraping.log`
- Contains timestamped entries for all scraping activity
- Shows success/failure for each website
- Tracks product counts and errors

### **Cron Job Status**
Check if the automated scraping is running:
```bash
crontab -l  # View current cron jobs
tail -f logs/scraping.log  # Monitor live logs
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Cron job not running**
   ```bash
   # Check if cron is installed
   which cron

   # Check cron service status
   sudo systemctl status cron

   # View cron logs
   sudo tail -f /var/log/cron.log
   ```

2. **Scraping failing for specific sites**
   - Check the website's HTML structure changed
   - Update CSS selectors in configuration
   - Test with manual scraping first

3. **Products not showing labels**
   - Verify the scraper is detecting conditions correctly
   - Check browser console for errors
   - Test with known sold-out or used items

### **Debug Mode**
Enable detailed logging by modifying the scraping script:
```javascript
console.log('Debug: Scraping element:', $(element).html());
```

## 🎯 Usage Examples

### **Adding a New Website**
1. Edit `src/lib/scraping-config.ts`
2. Add new website configuration
3. Test with manual scraping
4. Enable in admin interface

### **Monitoring Scraping Activity**
```bash
# View recent logs
tail -20 logs/scraping.log

# Check specific website status
grep "Japanese Sweets" logs/scraping.log
```

### **Manual Override**
If you need immediate updates:
1. Go to `/admin/scraping/websites`
2. Click "Scrape All Now"
3. Monitor results in real-time

## 🔒 Best Practices

### **Rate Limiting**
- Built-in delays between website requests
- Respectful scraping intervals (30+ minutes)
- Monitor for anti-bot measures

### **Error Handling**
- Graceful fallback if websites are down
- Detailed error logging for troubleshooting
- Automatic retry for temporary failures

### **Data Management**
- Labels are automatically applied based on content analysis
- Manual override possible through admin interface
- Historical data preserved in logs

## 🚀 Advanced Features

### **Custom Detection Rules**
Extend the detection system in `src/lib/scraper.ts`:
```typescript
// Add new sold out indicators
const customSoldOutIndicators = [
    '品切れ', '売り切れ', '在庫なし'  // Japanese terms
];
```

### **Website-Specific Logic**
Add special handling for specific websites:
```typescript
if (website.name === 'Special Store') {
    // Custom logic for this website
}
```

---

## 🎉 **Ready to Use!**

Your enhanced scraping system is now ready! It will:

✅ **Automatically scrape** all configured websites every 30 minutes
✅ **Detect and label** sold-out products with "Sold" badges
✅ **Identify and label** used items with "Used" badges
✅ **Display labels** prominently in product listings and detail pages
✅ **Log all activity** for monitoring and troubleshooting

**Next Steps:**
1. Configure your target websites in `scraping-config.ts`
2. Run `node scripts/setup-cron.js` to enable automation
3. Test with manual scraping in the admin interface
4. Monitor logs for any issues

The system will start working immediately and continue running in the background, keeping your product catalog fresh and accurately labeled!
