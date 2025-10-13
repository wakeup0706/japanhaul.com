// Minimal, safe stub for production builds. Real scraping is disabled.
// Local developers can create `src/lib/scraper.local.ts` (gitignored)
// and swap it in via conditional import inside API routes if needed.

export type ScrapedProduct = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  description?: string;
  sourceUrl: string;
  sourceSite: string;
  availability?: 'in' | 'out' | 'unknown';
  category?: string;
};

export type ScrapingConfig = {
  name?: string;
  url?: string;
  baseUrl?: string;
  selectors?: Record<string, any>;
  pagination?: { nextPageSelector?: string; maxPages?: number };
};

export const scrapingConfigs: Record<string, ScrapingConfig> = {};

export class WebScraper {
  constructor(public config?: ScrapingConfig) {}
  async scrapeProducts(_config: ScrapingConfig): Promise<ScrapedProduct[]> { return []; }
  async scrapeMultiplePages(_config: ScrapingConfig): Promise<ScrapedProduct[]> { return []; }
}

export async function testScrapingConfig(_config: ScrapingConfig): Promise<{ success: boolean; error?: string; sampleProducts?: ScrapedProduct[] }> {
  return { success: false, error: 'Scraping disabled in this environment' };
}

    /**
     * Scrape multiple pages if pagination is configured
     */
    async scrapeMultiplePages(config: ScrapingConfig): Promise<ScrapedProduct[]> {
        console.log('🔍 [DEBUG] Starting pagination scraping...');
        console.log('🔍 [DEBUG] Base URL:', config.url);
        console.log('🔍 [DEBUG] Next page selector:', config.pagination?.nextPageSelector);
        console.log('🔍 [DEBUG] Max pages:', config.pagination?.maxPages);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (this.axios as any).get(config.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
            timeout: 8000,
        });

            console.log('🔍 [DEBUG] HTTP request completed, status:', response.status);
            console.log('🔍 [DEBUG] Response data length:', response.data?.length || 'unknown');
            console.log('🔍 [DEBUG] HTTP request took:', new Date().toISOString());

            const $ = this.cheerio.load(response.data);
            console.log('🔍 [DEBUG] HTML loaded, length:', response.data.length);

            // Debug: Check what elements are available on the page
            const bodyText = $('body').text();
            console.log('🔍 [DEBUG] Body text length:', bodyText.length);

            const products: ScrapedProduct[] = [];

            // First, try to extract products from JSON-LD structured data
            const jsonLdProducts = this.extractFromJsonLd($, config.url, response.data);
            products.push(...jsonLdProducts);

            // If we didn't get products from JSON-LD, fall back to HTML parsing
            if (products.length === 0) {
                console.log('No products found in JSON-LD, falling back to HTML parsing...');

                // If productList selector is provided, find products within that container
                let productElements;
                if (config.selectors.productList) {
                    const productListElement = $(config.selectors.productList);
                    console.log('🔍 [DEBUG] Found', productListElement.length, 'elements with productList selector:', config.selectors.productList);
                    productElements = config.selectors.productCard
                        ? productListElement.find(config.selectors.productCard)
                        : productListElement.children();
                    console.log('🔍 [DEBUG] Found', productElements.length, 'product elements within productList');
                } else {
                    // Otherwise, look for product cards directly
                    productElements = $(config.selectors.productCard || '.product, [class*="product"], article');
                    console.log('🔍 [DEBUG] Found', productElements.length, 'product elements with selector:', config.selectors.productCard);
                }

                productElements.each((index: number, element: cheerio.Element) => {
                    const product = this.extractProductData($, element, config, index);
                    if (product) {
                        products.push(product);
                        console.log('✅ [DEBUG] Successfully extracted product:', product.title?.substring(0, 50) + '...');
                    } else {
                        console.log('❌ [DEBUG] Failed to extract product from element', index);
                    }
                });

                // If still no products found, try a more generic approach
                if (products.length === 0) {
                    console.log('🔄 [DEBUG] No products found with specific selectors, trying generic approach...');

                    // Try to find any elements that might be products
                    const genericProductElements = $(
                        'div[class*="product"], div[class*="item"], article, ' +
                        'a[href*="product"], a[href*="item"], ' +
                        '[class*="card"], [class*="grid"] > *'
                    );

                    console.log('🔍 [DEBUG] Found', genericProductElements.length, 'elements with generic selectors');

                    // Limit to first 20 elements to avoid performance issues
                    genericProductElements.slice(0, 20).each((index: number, element: cheerio.Element) => {
                        const product = this.extractProductData($, element, { ...config, selectors: {
                            ...config.selectors,
                            title: 'h1, h2, h3, h4, h5, h6, .title, [class*="title"], .name, [class*="name"]',
                            price: '.price, [class*="price"], .amount, [class*="amount"], .cost, [class*="cost"]',
                            image: 'img, [class*="image"] img, [data-src], [data-lazy]',
                        }}, index);

                        if (product && product.title && product.title.length > 0) {
                            products.push(product);
                            console.log('✅ [DEBUG] Found product with generic extraction:', product.title?.substring(0, 50) + '...');
                            if (products.length >= 5) { // Limit to 5 products from generic search
                            // No further implementation; this file exists only to satisfy imports.
        if (lowerText.includes('refurbished') || lowerText.includes('renewed')) {
            return 'refurbished';
        }

        return 'new'; // Default assumption
    }

    /**
     * Extract image URL from HTML element
     */
    private extractImageFromHtml($: CheerioAPI, element: any, config: ScrapingConfig): string | undefined {  // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            // Try different image selectors with priority order
            const imageSelectors = [
                config.selectors.image,
                '.product-collection__image img',
                '.rimage__img', // Lazy loaded images (highest priority)
                '[data-master]', // Images with data-master attribute (anime store specific)
                '[data-srcset]', // Images with data-srcset attribute
                '[srcset]', // Images with srcset attribute
                '.product-image img',
                '.product-image',
                'img',
                '[class*="image"] img',
                '.featured-image img',
                '.product-photo img',
                '[data-src]' // Images with data-src attribute
            ].filter(Boolean);

            for (const selector of imageSelectors) {
                const imgElements = $(element).find(selector);
                if (imgElements.length > 0) {
                    // Check each found element
                    for (let i = 0; i < imgElements.length; i++) {
                        const imgElement = $(imgElements[i]);

                        // Try multiple attributes for lazy-loaded images (in priority order)
                        const possibleUrls = [
                            imgElement.attr('data-master'), // Primary for anime store
                            imgElement.attr('data-src'),
                            imgElement.attr('data-original'),
                            imgElement.attr('srcset'), // Try srcset first (contains multiple URLs)
                            imgElement.attr('data-srcset'), // Then data-srcset
                            imgElement.attr('src')
                        ];

                        for (const imageUrl of possibleUrls) {
                            if (imageUrl && imageUrl !== 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=') {
                                let finalUrl = imageUrl;

                                // Handle srcset attribute (contains multiple URLs separated by commas)
                                if (imageUrl && imageUrl.includes(',')) {
                                    // Extract the first URL from srcset (usually the largest/highest quality)
                                    const srcsetUrls = imageUrl.split(',').map((url: string) => url.trim().split(' ')[0]);
                                    finalUrl = srcsetUrls[0]; // Use the first (usually largest) image

                                    // Handle Shopify {width} placeholder in srcset URLs
                                    if (finalUrl && finalUrl.includes('{width}')) {
                                        finalUrl = finalUrl.replace('{width}', '800');
                                        console.log('Replaced {width} placeholder in srcset:', finalUrl);
                                    }
                                }

                                // Handle Shopify {width} placeholder in URLs
                                if (finalUrl.includes('{width}')) {
                                    // Replace {width} with a reasonable default size (like 800)
                                    finalUrl = finalUrl.replace('{width}', '800');
                                    console.log('Replaced {width} placeholder:', finalUrl);
                                }

                                // Convert relative URLs to absolute
                                if (!finalUrl.startsWith('http')) {
                                    try {
                                        const sourceUrlObj = new URL(config.url);
                                        const absoluteUrl = new URL(finalUrl, sourceUrlObj.origin).href;
                                        console.log('Found image URL:', absoluteUrl);
                                        return absoluteUrl;
                                    } catch {
                                        console.warn('Failed to convert relative image URL:', finalUrl);
                                    }
                                } else {
                                    console.log('Found absolute image URL:', finalUrl);
                                    return finalUrl;
                                }
                            }
                        }
                    }
                }
            }

            console.log('No image found in element:', $(element).html().substring(0, 200) + '...');
            return undefined;
                        } catch {
            console.warn('Error extracting image from HTML');
            return undefined;
        }
    }

    /**
     * Extract product data from a single product element
     */
    private extractProductData($: CheerioAPI, element: any, config: ScrapingConfig, index: number): ScrapedProduct | null {  // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const titleElement = $(element).find(config.selectors.title || 'h1, h2, h3, .title, [class*="title"]');
            const title = titleElement.first().text().trim();

            if (!title) return null;

            // Extract price
            let price = 0;
            let originalPrice: number | undefined;

            if (config.selectors.price) {
                const priceText = $(element).find(config.selectors.price).first().text().trim();
                price = this.parsePrice(priceText);
            }

            if (config.selectors.originalPrice) {
                const originalPriceText = $(element).find(config.selectors.originalPrice).first().text().trim();
                originalPrice = this.parsePrice(originalPriceText);
            }

            // Extract image URL
            let imageUrl: string | undefined;
            if (config.selectors.image) {
                const imgElement = $(element).find(config.selectors.image).first();
                let imgUrl: string | undefined = imgElement.attr('data-master') ||
                            imgElement.attr('data-src') ||
                            imgElement.attr('data-original') ||
                            imgElement.attr('src');

                // Handle srcset attribute
                if (!imgUrl || imgUrl === 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=') {
                    const srcset = imgElement.attr('srcset') || imgElement.attr('data-srcset');
                    if (srcset) {
                        // Extract the first URL from srcset (usually the largest/highest quality)
                        const srcsetUrls = srcset.split(',').map((url: string) => url.trim().split(' ')[0]);
                        imgUrl = srcsetUrls[0];
                    }
                }

                imageUrl = imgUrl;

                // Skip placeholder data URLs
                if (imageUrl === 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=') {
                    imageUrl = undefined;
                }

                // Handle Shopify {width} placeholder in URLs
                if (imageUrl && imageUrl.includes('{width}')) {
                    imageUrl = imageUrl.replace('{width}', '800');
                    console.log('Replaced {width} placeholder in extractProductData:', imageUrl);
                }

                // Convert relative URLs to absolute
                if (imageUrl && !imageUrl.startsWith('http')) {
                    try {
                        imageUrl = new URL(imageUrl, config.url).href;
                    } catch {
                        console.warn('Failed to convert relative image URL:', imageUrl);
                    }
                }
            }

            // If no image found with specific selector, try common patterns
            if (!imageUrl) {
                imageUrl = this.extractImageFromHtml($, element, config);
            }

            // Extract description
            let description: string | undefined;
            if (config.selectors.description) {
                description = $(element).find(config.selectors.description).first().text().trim();
            }

            // Enhanced detection for sold out and used items
            const { availability, condition, isSoldOut, labels } = this.detectProductCondition($, element, title, description);

            // Generate unique ID
            const id = `scraped_${Date.now()}_${index}`;

            return {
                id,
                title,
                price,
                originalPrice,
                imageUrl,
                description,
                availability,
                sourceUrl: config.url,
                condition,
                isSoldOut,
                labels,
            };
                        } catch {
            console.error('Error extracting product data');
            return null;
        }
    }

    /**
     * Detect product condition, sold out status, and used items
     */
    private detectProductCondition($: CheerioAPI, element: any, title: string, description?: string): {  // eslint-disable-line @typescript-eslint/no-explicit-any
        availability: 'in' | 'out';
        condition?: "new" | "used" | "refurbished";
        isSoldOut?: boolean;
        labels: string[];
    } {
        const labels: string[] = [];
        let availability: 'in' | 'out' = 'in';
        let condition: "new" | "used" | "refurbished" | undefined;
        let isSoldOut = false;

        // Get all text content from the product element for analysis
        const productText = $(element).text().toLowerCase() + ' ' + (title.toLowerCase() || '') + ' ' + (description ? description.toLowerCase() : '');

        // Check for sold out indicators
        const soldOutIndicators = [
            'sold out', 'out of stock', 'unavailable', 'not available',
            'discontinued', 'no longer available', 'currently unavailable',
            'out-of-stock', 'oos', 'sold', 'agotado', 'épuisé'
        ];

        const hasSoldOutText = soldOutIndicators.some(indicator => productText.includes(indicator));
        if (hasSoldOutText) {
            availability = 'out';
            isSoldOut = true;
            labels.push('Sold');
        }

        // Check for used/second-hand indicators
        const usedIndicators = [
            'used', 'second hand', 'second-hand', 'pre-owned', 'preowned',
            'refurbished', 'renewed', 'reconditioned', 'usado', 'd\'occasion',
            'gebraucht', 'usagé', 'de segunda mano'
        ];

        const hasUsedText = usedIndicators.some(indicator => productText.includes(indicator));
        if (hasUsedText) {
            condition = 'used';
            labels.push('Used');
        }

        // Check for specific availability text if selector is provided
        // (This would need access to config parameter - simplified for now)
        // You can enhance this by passing config to detectProductCondition

        // Check for visual indicators in class names or data attributes
        const elementHtml = $(element).html() || '';
        if (elementHtml.includes('out-of-stock') || elementHtml.includes('sold-out') || elementHtml.includes('unavailable')) {
            availability = 'out';
            isSoldOut = true;
            labels.push('Sold');
        }

        if (elementHtml.includes('used') || elementHtml.includes('second-hand') || elementHtml.includes('pre-owned')) {
            condition = 'used';
            labels.push('Used');
        }

        return {
            availability,
            condition,
            isSoldOut,
            labels,
        };
    }

    /**
     * Parse price string to number
     */
    private parsePrice(priceText: string): number {
        if (!priceText) return 0;

        // Remove currency symbols and extra text
        const cleaned = priceText
            .replace(/[$€£¥₹,]/g, '')
            .replace(/[^\d.-]/g, '')
            .trim();

        const price = parseFloat(cleaned);
        return isNaN(price) ? 0 : price;
    }


    /**
     * Scrape products from a specific range of pages (batch processing)
     */
    async scrapePageBatch(config: ScrapingConfig, startPage: number, endPage: number): Promise<ScrapedProduct[]> {
        console.log(`🔄 [BATCH] Starting batch scrape: pages ${startPage} to ${endPage}`);
        console.log('🔄 [BATCH] Current time:', new Date().toISOString());

        const allProducts: ScrapedProduct[] = [];
        const totalPages = endPage - startPage + 1;

        for (let page = startPage; page <= endPage; page++) {
            const pageUrl = page === 1 ? config.url : `${config.url}?page=${page}`;
            console.log(`📄 [BATCH] Scraping page ${page}/${totalPages}: ${pageUrl}`);

            try {
                const products = await this.scrapeProducts({ ...config, url: pageUrl });
                console.log(`✅ [BATCH] Page ${page}: Found ${products.length} products`);
                allProducts.push(...products);

                // Add delay between pages to avoid overwhelming the server
                if (page < endPage) {
                    console.log(`⏱️ [BATCH] Waiting 1 second before next page...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error: unknown) {
                console.error(`❌ [BATCH] Failed to scrape page ${page}:`, error instanceof Error ? error.message : String(error));

                // If a page fails, we can either:
                // 1. Continue with next pages (more resilient)
                // 2. Stop and return what we have (safer)
                // For now, let's continue but log the error
                console.error(`❌ [BATCH] Continuing with next pages despite error on page ${page}`);
            }
        }

        console.log(`🎉 [BATCH] Batch completed! Total products: ${allProducts.length} from ${totalPages} pages`);
        console.log('🔄 [BATCH] Total time:', new Date().toISOString());

        return allProducts;
    }
}

// Predefined scraping configurations for popular e-commerce sites
// These are just starting points - you'll need to customize them for specific sites
export const scrapingConfigs = {
    // Example configuration for a generic e-commerce site
    generic: (baseUrl: string): ScrapingConfig => ({
        url: baseUrl,
        selectors: {
            productList: '.products, .product-list, [class*="product"]',
            productCard: '.product, article, [class*="product"]',
            title: 'h1, h2, h3, .title, [class*="title"]',
            price: '.price, [class*="price"]',
            originalPrice: '.original-price, .compare-price, [class*="compare"]',
            image: 'img, [class*="image"]',
            description: '.description, [class*="description"]',
            availability: '.availability, .stock, [class*="stock"]',
        },
        pagination: {
            nextPageSelector: '.next, [rel="next"], .pagination a:last-child',
            maxPages: 3,
        },
    }),

    // Configuration for Anime Store JP
    animeStore: (baseUrl: string): ScrapingConfig => ({
        url: baseUrl,
        selectors: {
            productList: '.collection-products, .product-collection',
            productCard: '.product-collection',
            title: '.product-collection__title',
            price: '.product-collection__price',
            image: '.product-collection__image img, .rimage__img, [data-master], [srcset]',
            description: '.product-collection__content',
        },
    }),

    // Configuration for Amnibus
    amnibus: (baseUrl: string): ScrapingConfig => ({
        url: baseUrl,
        selectors: {
            productList: '.product-list, .list-container, main, .products, .items, [class*="product"]',
            productCard: 'a[href*="/products/detail/"], .product-item, .item, [class*="product"], article',
            title: '.list-name, .product-title, .title, h1, h2, h3, [class*="title"]',
            price: '.list-price, .price, .amount, [class*="price"]',
            image: '.list-image img, .product-image img, img, [class*="image"]',
            description: '.list-description, .description, .summary, [class*="description"]',
        },
        pagination: {
            nextPageSelector: 'a[href*="pageno="], .pagination a, .next, [rel="next"]',
            maxPages: 3
        }
    }),

    // Configuration for Amazon-style sites
    amazon: (baseUrl: string): ScrapingConfig => ({
        url: baseUrl,
        selectors: {
            productList: '#search .s-main-slot, .s-results',
            productCard: '.s-result-item, .a-section',
            title: 'h2 a span, .a-text-normal',
            price: '.a-price .a-offscreen, .a-color-price',
            originalPrice: '.a-price .a-text-price',
            image: '.a-dynamic-image, img',
            description: '.a-text-normal',
        },
    }),

    // Configuration for eBay-style sites
    ebay: (baseUrl: string): ScrapingConfig => ({
        url: baseUrl,
        selectors: {
            productList: '.s-item',
            productCard: '.s-item',
            title: '.s-item__title',
            price: '.s-item__price',
            image: '.s-item__image img',
        },
    }),

    // Template for creating custom configurations
    customTemplate: (baseUrl: string): ScrapingConfig => ({
        url: baseUrl,
        selectors: {
            // You'll need to replace these with actual selectors from your target site
            productList: '', // e.g., '.product-grid, .items'
            productCard: '', // e.g., '.product, .item, article'
            title: '', // e.g., 'h1, h2, .title, .product-title'
            price: '', // e.g., '.price, .amount, .cost'
            originalPrice: '', // e.g., '.original-price, .was-price'
            image: '', // e.g., 'img, .product-image img'
            description: '', // e.g., '.description, .summary'
            availability: '', // e.g., '.stock, .availability'
        },
        pagination: {
            nextPageSelector: '', // e.g., '.next, a[rel="next"], .pagination .next'
            maxPages: 2,
        },
    }),
};

// Utility function to test scraping configuration
export async function testScrapingConfig(config: ScrapingConfig): Promise<{ success: boolean; error?: string; sampleProducts?: ScrapedProduct[] }> {
    try {
        const scraper = new WebScraper();
        const products = await scraper.scrapeProducts(config);

        return {
            success: true,
            sampleProducts: products.slice(0, 3), // Return first 3 products as sample
        };
    } catch {
        return {
            success: false,
            error: 'Unknown error occurred',
        };
    }
}

/**
 * Guide: How to Find CSS Selectors for Any Website
 *
 * STEP-BY-STEP PROCESS:
 *
 * 1. Open the target website in your browser
 * 2. Right-click on a product and select "Inspect Element"
 * 3. Use these common selectors as starting points:
 *
 *    Common Product List Selectors:
 *    - .products, .product-list, .items, .grid
 *    - [class*="product"], [class*="item"]
 *    - .catalog, .gallery, .collection
 *
 *    Common Product Card Selectors:
 *    - .product, .item, article, .card
 *    - [class*="product"], [class*="item"]
 *    - .product-card, .item-card
 *
 *    Common Title Selectors:
 *    - h1, h2, h3, .title, .name
 *    - [class*="title"], [class*="name"]
 *    - .product-title, .item-title
 *
 *    Common Price Selectors:
 *    - .price, .amount, .cost, .value
 *    - [class*="price"], [class*="amount"]
 *    - .current-price, .sale-price
 *
 * 4. Test your selectors in browser console:
 *    document.querySelectorAll('.your-selector')
 *
 * 5. Start with broad selectors, then narrow down
 * 6. Use multiple selectors separated by commas: '.price, .amount, .cost'
 * 7. Test with a small sample first
 */
