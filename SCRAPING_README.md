# Web Scraping Integration Guide

This guide explains how to use the web scraping functionality to replace hardcoded products with real data from external websites.

## 🚀 Quick Start

### 1. Install Dependencies

First, install the required scraping dependencies:

```bash
npm install cheerio axios @types/cheerio
```

### 2. Access the Admin Interface

Navigate to `/admin/scraping` in your application to access the scraping management interface.

## 📋 How It Works

The scraping system consists of several components:

### Core Components

1. **Scraper Utility** (`src/lib/scraper.ts`)
   - Main scraping logic using Cheerio for HTML parsing
   - Configurable selectors for different website structures
   - Support for pagination and multiple pages

2. **API Routes**
   - `/api/scrape` - Scrapes products from a given URL
   - `/api/products/scraped` - Manages stored scraped products

3. **Admin Interface** (`src/app/[lang]/admin/scraping/page.tsx`)
   - Web UI for configuring and running scraping operations
   - View and manage scraped products

4. **Dynamic Product Loading**
   - Products page automatically loads scraped products alongside hardcoded ones
   - Caching system for performance

## 🔧 Scraping Configuration

### Predefined Configurations

The system includes predefined configurations for common e-commerce patterns:

- **Generic**: Basic e-commerce site structure
- **Amazon Style**: Amazon-like product listings
- **eBay Style**: eBay-like product listings

### Custom Configuration

For websites that don't match predefined patterns, you need to provide custom CSS selectors. Here's how:

#### Step 1: Inspect the Target Website

1. **Open the website** you want to scrape in your browser
2. **Right-click on a product** and select "Inspect Element" or "Inspect"
3. **Look at the HTML structure** - you'll see classes, IDs, and element types

#### Step 2: Identify Key Elements

**Product Container:**
- Look for the element that wraps all products (usually a grid or list)
- Common classes: `.products`, `.product-list`, `.items`, `.grid`, `.catalog`

**Individual Product Cards:**
- Look for elements that represent each product
- Common classes: `.product`, `.item`, `article`, `.card`, `.product-card`

**Product Details:**
- **Title**: Look for headings or title elements: `h1`, `h2`, `h3`, `.title`, `.name`
- **Price**: Look for price elements: `.price`, `.amount`, `.cost`, `.value`
- **Original Price**: For sales: `.original-price`, `.was-price`, `.compare-price`
- **Image**: Usually just `img` or `.product-image img`
- **Description**: `.description`, `.summary`, `.details`
- **Availability**: `.stock`, `.availability`, `.in-stock`

#### Step 3: Create Your Configuration

```json
{
  "selectors": {
    "productList": ".products, .product-grid, .items",
    "productCard": ".product, .item, article",
    "title": "h1, h2, .title, .product-title",
    "price": ".price, .amount, .cost",
    "originalPrice": ".original-price, .was-price",
    "image": "img, .product-image img",
    "description": ".description, .summary",
    "availability": ".stock, .availability"
  },
  "pagination": {
    "nextPageSelector": ".next, a[rel='next'], .pagination .next",
    "maxPages": 2
  }
}
```

#### Step 4: Test Your Selectors

In the browser console, test your selectors:

```javascript
// Test if your product card selector finds products
document.querySelectorAll('.product, .item').length

// Test if your title selector finds titles within a product
document.querySelector('.product .title')

// Test if your price selector finds prices
document.querySelectorAll('.price, .amount')
```

#### Step 5: Common Patterns by Site Type

**E-commerce Sites:**
- Product containers: `.products`, `.product-list`, `.catalog`
- Product cards: `.product`, `.item`, `.product-card`
- Prices: `.price`, `.current-price`, `.sale-price`

**Marketplace Sites:**
- Product containers: `.listings`, `.items`, `.search-results`
- Product cards: `.listing`, `.item`, `.result`
- Prices: `.price`, `.amount`, `.value`

**Store Sites:**
- Product containers: `.product-grid`, `.items`, `.collection`
- Product cards: `.product`, `.card`, `.item-card`
- Prices: `.price`, `.cost`, `.amount`

## 🎯 Usage Examples

### Basic Scraping

1. Go to `/admin/scraping`
2. Enter the website URL you want to scrape
3. Select a configuration type (or use custom)
4. Click "Start Scraping"

### Real-World Example: Scraping a Japanese Sweets Store

Let's say you want to scrape products from a Japanese sweets website. Here's the process:

**Step 1: Inspect the Website**
- Open the target website
- Right-click on a product → Inspect Element
- You see the HTML structure

**Step 2: Identify Key Elements**
From inspecting, you find:
- Product container: `.product-grid` or `.items`
- Product cards: `.product-item` or `.card`
- Titles: `.product-title` or `h3`
- Prices: `.price` or `.yen-price`
- Images: `.product-image img`

**Step 3: Create Configuration**
```json
{
  "selectors": {
    "productList": ".product-grid, .items",
    "productCard": ".product-item, .card",
    "title": ".product-title, h3",
    "price": ".price, .yen-price",
    "image": ".product-image img",
    "description": ".description"
  }
}
```

**Step 4: Test and Refine**
- Test selectors in browser console
- Adjust if needed (e.g., if titles are in `.name` instead of `.product-title`)
- Try scraping with 1-2 pages first

### Example URLs to Test With

```bash
# E-commerce sites (modify selectors as needed)
https://example-shop.com/products
https://store.example.com/catalog

# Note: Replace with actual working e-commerce sites
# Make sure to comply with the website's terms of service
```

### Managing Scraped Products

- **View Products**: See all scraped products in the admin interface
- **Delete Products**: Remove individual products or clear all
- **Update Products**: Modify product details after scraping

## ⚙️ Technical Details

### Product Data Structure

```typescript
interface Product {
    id: string;
    title: string;
    price: number;
    compareAt?: number; // Original price for sales
    brand: string;
    type: string;
    availability: "in" | "out";
    imageUrl?: string;
    description?: string;
    sourceUrl: string;
}
```

### Caching

- Scraped products are cached for 5 minutes
- Automatic cache invalidation when new products are added
- Reduces API calls and improves performance

### Error Handling

- Graceful fallback to hardcoded products if scraping fails
- Detailed error messages in the admin interface
- Network timeout and parsing error handling

## 🛠️ Customization

### Adding New Scraping Configurations

1. Edit `src/lib/scraper.ts`
2. Add new configuration to `scrapingConfigs` object
3. Update the admin interface dropdown if needed

### Custom Scraping Logic

For complex websites, you can extend the `WebScraper` class:

```typescript
class CustomScraper extends WebScraper {
    async scrapeCustomSite(url: string) {
        // Custom scraping logic
        return await this.scrapeProducts(customConfig);
    }
}
```

## 🔒 Security & Best Practices

### Rate Limiting
- Implement delays between requests to avoid being blocked
- Respect `robots.txt` files
- Check website terms of service

### Data Storage
- Currently uses in-memory storage (for development)
- Consider database integration for production
- Implement data validation and sanitization

### Legal Considerations
- Ensure compliance with website terms of service
- Respect copyright and intellectual property
- Only scrape publicly available data

## 🚨 Troubleshooting

### Common Issues

1. **Scraping fails with timeout**
   - Increase timeout in API routes
   - Check if website blocks automated requests

2. **No products found**
   - Verify CSS selectors match the target website
   - Check if website uses JavaScript rendering (may need different approach)

3. **Products not displaying**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Clear cache and refresh

### Debug Mode

Enable debug logging by setting:
```javascript
console.log('Scraping debug:', response.data);
```

## 🔄 Next Steps

1. **Database Integration**: Replace in-memory storage with a proper database
2. **Image Proxying**: Handle external image URLs securely
3. **Scheduled Scraping**: Set up cron jobs for automatic updates
4. **Advanced Parsing**: Add support for JavaScript-rendered content
5. **Data Validation**: Implement comprehensive data cleaning and validation

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify all dependencies are installed
3. Test with simple example websites first
4. Review the scraping configuration for the target site

---

**Note**: This scraping functionality is for educational and development purposes. Always ensure compliance with website terms of service and respect data usage policies.
