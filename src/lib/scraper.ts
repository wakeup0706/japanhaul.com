// Web scraping utilities for extracting product data from websites
// Note: You'll need to install cheerio and axios first: npm install cheerio axios

// Type definitions for cheerio and axios since proper types aren't available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioAPI = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioStatic = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AxiosInstance = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Element = any;

export interface ScrapedProduct {
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    brand?: string;
    category?: string;
    imageUrl?: string;
    description?: string;
    availability: 'in' | 'out';
    sourceUrl: string;
    condition?: "new" | "used" | "refurbished";
    isSoldOut?: boolean;
    labels?: string[];
}

interface JsonLdProduct {
    '@type'?: string;
    '@context'?: string;
    name?: string;
    description?: string;
    image?: string | string[];
    offers?: {
        price?: string;
        priceCurrency?: string;
        availability?: string;
    } | Array<{
        price?: string;
        priceCurrency?: string;
        availability?: string;
    }>;
    brand?: {
        name?: string;
    };
    category?: string;
}

export interface ScrapingConfig {
    url: string;
    selectors: {
        productList?: string;
        productCard?: string;
        title?: string;
        price?: string;
        originalPrice?: string;
        image?: string;
        description?: string;
        availability?: string;
    };
    pagination?: {
        nextPageSelector?: string;
        maxPages?: number;
    };
}

export class WebScraper {
    private axios: AxiosInstance;
    private cheerio: CheerioStatic;

    constructor() {
        // Dynamic imports to avoid issues if dependencies aren't installed yet
        this.loadDependencies();
    }

    private async loadDependencies() {
        try {
            // Use require for CommonJS compatibility in API routes
            const axios = await import('axios');
            const cheerio = await import('cheerio');
            this.axios = axios.default || axios;
            this.cheerio = cheerio;
        } catch {
            console.error('Scraping dependencies not installed. Run: npm install cheerio axios');
            throw new Error('Missing scraping dependencies. Please install cheerio and axios.');
        }
    }

    /**
     * Scrape products from a single page
     */
    async scrapeProducts(config: ScrapingConfig): Promise<ScrapedProduct[]> {
        console.log('🔍 [DEBUG] scrapeProducts called with config:', config.url);
        console.log('🔍 [DEBUG] Starting at:', new Date().toISOString());
        await this.loadDependencies();

        try {
            console.log('🔍 [DEBUG] Making HTTP request to:', config.url);
            console.log('🔍 [DEBUG] Using selectors:', config.selectors);

            // Randomize headers to avoid detection
            const userAgents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
            ];

            const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await (this.axios as any).get(config.url, {
                headers: {
                    'User-Agent': randomUserAgent,
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
                                console.log('🔍 [DEBUG] Reached limit of 5 products from generic search');
                                return false; // Break out of the loop
                            }
                        }
                    });
                }
            }

            // If we got products from JSON-LD but they don't have images, try to extract from HTML
            if (products.length > 0 && products.every(p => !p.imageUrl)) {
                console.log('Products found but no images in JSON-LD, trying HTML extraction...');

                // If productList selector is provided, find products within that container
                let productElements;
                if (config.selectors.productList) {
                    const productListElement = $(config.selectors.productList);
                    productElements = config.selectors.productCard
                        ? productListElement.find(config.selectors.productCard)
                        : productListElement.children();
                } else {
                    // Otherwise, look for product cards directly
                    productElements = $(config.selectors.productCard || '.product, [class*="product"], article');
                }

                console.log('Found', productElements.length, 'product elements for image extraction');

                productElements.each((index: number, element: cheerio.Element) => {
                    if (index < products.length) {
                        const imageUrl = this.extractImageFromHtml($, element, config);
                        if (imageUrl) {
                            products[index].imageUrl = imageUrl;
                            console.log('✅ [DEBUG] Added image URL for product', index, ':', imageUrl);
                        } else {
                            console.log('❌ [DEBUG] No image found for product', index);
                        }
                    }
                });
            }

            // Final fallback: if still no images, try to find any image on the page
            if (products.length > 0 && products.every(p => !p.imageUrl)) {
                console.log('Still no images found, trying page-wide image search...');

                // Look for any image with data-master attribute (lazy loaded)
                const allLazyImages = $('[data-master]');
                console.log('Found', allLazyImages.length, 'elements with data-master attribute');

                if (allLazyImages.length > 0) {
                    for (let i = 0; i < Math.min(5, allLazyImages.length); i++) {
                        const img = $(allLazyImages[i]);
                        let imgUrl: string | undefined = img.attr('data-master');
                        console.log('Checking image', i, 'data-master:', imgUrl);

                        if (imgUrl && !imgUrl.startsWith('data:image')) {
                            // Handle Shopify {width} placeholder in URLs
                            if (imgUrl.includes('{width}')) {
                                imgUrl = imgUrl.replace('{width}', '800');
                                console.log('🔄 [DEBUG] Replaced {width} placeholder in fallback image:', imgUrl);
                            }

                            // Use the first available image for all products as fallback
                            products.forEach(product => {
                                if (!product.imageUrl) {
                                    product.imageUrl = imgUrl && imgUrl.startsWith('http') ? imgUrl : `https://anime-store.jp${imgUrl || ''}`;
                                }
                            });
                            console.log('✅ [DEBUG] Applied fallback image to all products:', imgUrl);
                            break;
                        }
                    }
                } else {
                    console.log('No elements with data-master found, checking for srcset...');
                    // Try srcset attributes as well
                    const srcsetImages = $('[srcset], [data-srcset]');
                    console.log('Found', srcsetImages.length, 'elements with srcset attributes');
                }
            }

            // Log final results
            const productsWithImages = products.filter(p => p.imageUrl).length;
            const productsWithoutImages = products.filter(p => !p.imageUrl).length;
            console.log(`Scraping completed: ${products.length} products, ${productsWithImages} with images, ${productsWithoutImages} without images`);
            console.log('🔍 [DEBUG] Total scraping time:', new Date().toISOString());

            return products;
                        } catch {
            console.error(`Error scraping ${config.url}`);
            throw new Error(`Failed to scrape products from ${config.url}`);
        }
    }

    /**
     * Extract products from JSON-LD structured data
     */
    private extractFromJsonLd($: CheerioAPI, sourceUrl: string, htmlContent: string): ScrapedProduct[] {
        const products: ScrapedProduct[] = [];

        try {
            // Find all JSON-LD script tags
            $('script[type="application/ld+json"]').each((index: number, element: Element) => {
                try {
                    const jsonText = $(element).html();
                    if (!jsonText) return;

                    const data = JSON.parse(jsonText);

                    // Handle both single objects and arrays
                    const jsonLdItems = Array.isArray(data) ? data : [data];

                    jsonLdItems.forEach((item: JsonLdProduct) => {
                        // Check if this is a Product schema
                        if (item['@type'] === 'Product' && item.name) {
                            const product = this.parseJsonLdProduct(item, sourceUrl, htmlContent);
                            if (product) {
                                products.push(product);
                            }
                        }
                    });
                } catch (parseError) {
                    // Skip invalid JSON
                    console.warn('Failed to parse JSON-LD:', parseError);
                }
            });
                        } catch {
            console.warn('Error extracting from JSON-LD');
        }

        return products;
    }

    /**
     * Parse a single JSON-LD Product object into our ScrapedProduct format
     */
    private parseJsonLdProduct(jsonLdItem: JsonLdProduct, sourceUrl: string, htmlContent: string): ScrapedProduct | null {
        try {
            // Extract basic product information
            const name = jsonLdItem.name || '';
            // const sku = jsonLdItem.sku || ''; // Not used in ScrapedProduct interface
            const description = jsonLdItem.description || '';

            // Extract price from offers
            let price = 0;
            let originalPrice: number | undefined;

            if (jsonLdItem.offers && Array.isArray(jsonLdItem.offers)) {
                const offer = jsonLdItem.offers[0];
                if (offer && offer.price) {
                    price = parseFloat(offer.price) || 0;
                    if (offer.priceCurrency) {
                        // You might want to handle currency conversion here
                        // For now, we'll assume JPY and convert to USD
                        price = this.convertJpyToUsd(price);
                    }
                }
            }

            // Extract image
            let imageUrl: string | undefined;
            if (jsonLdItem.image) {
                if (Array.isArray(jsonLdItem.image)) {
                    imageUrl = jsonLdItem.image[0];
                } else {
                    imageUrl = jsonLdItem.image;
                }

                // Handle Shopify {width} placeholder in URLs
                if (imageUrl && imageUrl.includes('{width}')) {
                    imageUrl = imageUrl.replace('{width}', '800');
                    console.log('Replaced {width} placeholder in JSON-LD:', imageUrl);
                }

                // Convert relative URLs to absolute URLs
                if (imageUrl && !imageUrl.startsWith('http')) {
                    // Try to construct absolute URL using the source URL
                    try {
                        const sourceUrlObj = new URL(sourceUrl);
                        imageUrl = new URL(imageUrl, sourceUrlObj.origin).href;
                    } catch {
                        console.warn('Failed to convert relative image URL:', imageUrl);
                    }
                }
            }

            // If no image in JSON-LD, try to find it in HTML
            if (!imageUrl) {
                console.log('No image in JSON-LD for:', name.substring(0, 50) + '...');
                // Look for lazy-loaded images in the page
                const html$ = this.cheerio.load(htmlContent);

                // Find images that might correspond to this product
                // We'll look for images near text that matches the product name
                const productName = name.toLowerCase();
                const allImages = html$('img');

                console.log('Searching through', allImages.length, 'images for product match');

                for (let i = 0; i < allImages.length; i++) {
                    const img = html$(allImages[i]);
                    const altText = img.attr('alt') || '';
                    const parentText = img.parent().text().toLowerCase();

                    // Check if this image is related to our product
                    if (altText.toLowerCase().includes(productName.slice(0, 20)) ||
                        parentText.includes(productName.slice(0, 20))) {

                        let imgUrl: string | undefined = img.attr('data-master') ||
                                     img.attr('data-src') ||
                                     img.attr('data-original') ||
                                     img.attr('src');

                        // Handle srcset attribute
                        if (!imgUrl || imgUrl === 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=') {
                            const srcset = img.attr('srcset') || img.attr('data-srcset');
                            if (srcset) {
                                // Extract the first URL from srcset (usually the largest/highest quality)
                                const srcsetUrls = srcset.split(',').map((url: string) => url.trim().split(' ')[0]);
                                imgUrl = srcsetUrls[0];
                            }
                        }

                        if (imgUrl && imgUrl !== 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=') {
                            // Handle Shopify {width} placeholder in URLs
                            if (imgUrl.includes('{width}')) {
                                imgUrl = imgUrl.replace('{width}', '800');
                                console.log('Replaced {width} placeholder in fallback image:', imgUrl);
                            }

                            imageUrl = imgUrl;
                            if (!imageUrl.startsWith('http')) {
                                try {
                                    const sourceUrlObj = new URL(sourceUrl);
                                    imageUrl = new URL(imageUrl, sourceUrlObj.origin).href;
                                } catch {
                                    console.warn('Failed to convert relative image URL:', imageUrl);
                                }
                            }
                            console.log('Found matching image:', imageUrl);
                            break;
                        }
                    }
                }

                if (!imageUrl) {
                    console.log('No matching image found, trying first available image');
                    // If no match found, try the first available image as fallback
                    for (let i = 0; i < Math.min(10, allImages.length); i++) {
                        const img = html$(allImages[i]);
                        let imgUrl: string | undefined = img.attr('data-master') ||
                                     img.attr('data-src') ||
                                     img.attr('data-original') ||
                                     img.attr('src');

                        // Handle srcset attribute
                        if (!imgUrl || imgUrl === 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=') {
                            const srcset = img.attr('srcset') || img.attr('data-srcset');
                            if (srcset) {
                                // Extract the first URL from srcset (usually the largest/highest quality)
                                const srcsetUrls = srcset.split(',').map((url: string) => url.trim().split(' ')[0]);
                                imgUrl = srcsetUrls[0];
                            }
                        }

                        if (imgUrl && imgUrl !== 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=') {
                            // Handle Shopify {width} placeholder in URLs
                            if (imgUrl.includes('{width}')) {
                                imgUrl = imgUrl.replace('{width}', '800');
                                console.log('Replaced {width} placeholder in fallback image:', imgUrl);
                            }

                            imageUrl = imgUrl;
                            if (!imageUrl.startsWith('http')) {
                                try {
                                    const sourceUrlObj = new URL(sourceUrl);
                                    imageUrl = new URL(imageUrl, sourceUrlObj.origin).href;
                                } catch {
                                    console.warn('Failed to convert relative image URL:', imageUrl);
                                }
                            }
                            console.log('Using fallback image:', imageUrl);
                            break;
                        }
                    }
                }
            }

            // Extract brand
            let brand = 'Anime Store';
            if (jsonLdItem.brand && jsonLdItem.brand.name) {
                brand = jsonLdItem.brand.name;
            }

            // Determine availability
            let availability: 'in' | 'out' = 'in';
            if (jsonLdItem.offers) {
                const offers = Array.isArray(jsonLdItem.offers) ? jsonLdItem.offers : [jsonLdItem.offers];
                const offer = offers[0];
                if (offer && (offer.availability === 'http://schema.org/OutOfStock' || offer.availability === 'OutOfStock')) {
                    availability = 'out';
                }
            }

            // Generate unique ID using name and URL hash
            const id = `jsonld_${Buffer.from(name + sourceUrl).toString('base64').slice(0, 16)}`;

            return {
                id,
                title: name,
                price,
                originalPrice,
                brand,
                category: 'Anime Merchandise',
                imageUrl,
                description,
                availability,
                sourceUrl,
                condition: this.detectConditionFromText(name + ' ' + description),
            };
                        } catch {
            console.warn('Error parsing JSON-LD product');
            return null;
        }
    }

    /**
     * Convert JPY to USD (approximate rate)
     */
    private convertJpyToUsd(jpyAmount: number): number {
        const exchangeRate = 0.0067; // 1 JPY ≈ 0.0067 USD
        return Math.round(jpyAmount * exchangeRate * 100) / 100;
    }

    /**
     * Detect condition from product text
     */
    private detectConditionFromText(text: string): "new" | "used" | "refurbished" | undefined {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('used') || lowerText.includes('pre-owned') || lowerText.includes('second hand')) {
            return 'used';
        }

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
     * Scrape multiple pages if pagination is configured
     */
    async scrapeMultiplePages(config: ScrapingConfig): Promise<ScrapedProduct[]> {
        console.log('🔍 [DEBUG] Starting pagination scraping...');
        console.log('🔍 [DEBUG] Base URL:', config.url);
        console.log('🔍 [DEBUG] Next page selector:', config.pagination ? config.pagination.nextPageSelector : 'none');
        console.log('🔍 [DEBUG] Max pages:', config.pagination ? config.pagination.maxPages : 'none');

        const allProducts: ScrapedProduct[] = [];
        let currentUrl = config.url;
        let pageCount = 0;
        const maxPages = config.pagination ? config.pagination.maxPages || 5 : 5;

        while (currentUrl && pageCount < maxPages) {
            console.log(`\n📄 [DEBUG] Scraping page ${pageCount + 1}/${maxPages}`);
            console.log('📄 [DEBUG] Current URL:', currentUrl);

            try {
                const products = await this.scrapeProducts({ ...config, url: currentUrl });
                console.log(`✅ [DEBUG] Found ${products.length} products on page ${pageCount + 1}`);
                allProducts.push(...products);

                console.log(`📊 [DEBUG] Total products so far: ${allProducts.length}`);

                // Find next page URL
                if (config.pagination && config.pagination.nextPageSelector) {
                    console.log('🔗 [DEBUG] Looking for next page URL...');
                    // Randomize headers for pagination requests too
                    const paginationUserAgents = [
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
                    ];

                    const randomPaginationUserAgent = paginationUserAgents[Math.floor(Math.random() * paginationUserAgents.length)];

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const response = await (this.axios as { get: (url: string, config: { timeout: number; headers: Record<string, string> }) => Promise<any> }).get(currentUrl, {
                        timeout: 8000,
                        headers: {
                            'User-Agent': randomPaginationUserAgent,
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5',
                            'Accept-Encoding': 'gzip, deflate',
                            'Connection': 'keep-alive',
                            'Upgrade-Insecure-Requests': '1',
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache',
                        }
                    });
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const $ = (this.cheerio as any).load(response.data);

                    console.log('🔗 [DEBUG] Searching for elements with selector:', config.pagination.nextPageSelector);
                    const nextPageElement = $(config.pagination.nextPageSelector);
                    console.log('🔗 [DEBUG] Found', nextPageElement.length, 'elements matching selector');

                    // Debug: List all found elements and their hrefs
                    nextPageElement.each((i: number, elem: Element) => {
                        const href = $(elem).attr('href');
                        console.log(`🔗 [DEBUG] Element ${i} href:`, href);
                    });

                    const nextPageUrl = nextPageElement.first().attr('href');
                    console.log('🔗 [DEBUG] First element href attribute:', nextPageUrl);

                    if (nextPageUrl && nextPageUrl !== currentUrl) {
                        currentUrl = nextPageUrl.startsWith('http') ? nextPageUrl : new URL(nextPageUrl, currentUrl).href;
                        console.log('🔗 [DEBUG] Constructed next page URL:', currentUrl);
                    } else {
                        console.log('🔗 [DEBUG] No valid next page URL found, ending pagination');
                        currentUrl = ''; // No more pages
                    }
                } else {
                    console.log('🔗 [DEBUG] No pagination selector configured, ending pagination');
                    currentUrl = ''; // No pagination configured
                }

                pageCount++;
                console.log(`📊 [DEBUG] Completed page ${pageCount}/${maxPages}`);

                // Add delay between requests to avoid overwhelming the server
                if (pageCount < maxPages && currentUrl) {
                    console.log(`⏱️ [DEBUG] Waiting 3 seconds before next page...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            } catch (error: unknown) {
                console.error(`❌ [DEBUG] Error scraping page ${pageCount + 1}/${maxPages} (${currentUrl}):`, error);

                // Type guard to check if error has expected properties
                const isErrorWithCode = (err: unknown): err is { code?: string; message?: string; response?: { status?: number } } => {
                    return typeof err === 'object' && err !== null;
                };

                // Check if it's a timeout error
                if (isErrorWithCode(error) && (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout')))) {
                    console.error(`⏱️ [DEBUG] TIMEOUT ERROR: Page ${pageCount + 1} timed out after 8 seconds`);
                    console.error(`⏱️ [DEBUG] This suggests the page is extremely slow to respond`);
                } else if (isErrorWithCode(error) && error.response && error.response.status === 403) {
                    console.error(`🚫 [DEBUG] BLOCKED: Page ${pageCount + 1} returned 403 Forbidden`);
                    console.error(`🚫 [DEBUG] This suggests server-side blocking`);
                } else if (isErrorWithCode(error) && error.response && error.response.status === 429) {
                    console.error(`🚦 [DEBUG] RATE LIMITED: Page ${pageCount + 1} returned 429 Too Many Requests`);
                    console.error(`🚦 [DEBUG] This suggests rate limiting`);
                } else {
                    console.error(`❓ [DEBUG] UNKNOWN ERROR: Page ${pageCount + 1} failed with:`, isErrorWithCode(error) ? (error as { message?: string }).message || String(error) : String(error));
                }

                console.error(`❌ [DEBUG] Previous pages worked, this specific page failed`);
                break;
            }
        }

        console.log(`\n🎉 [DEBUG] Pagination completed! Total pages scraped: ${pageCount}, Total products: ${allProducts.length}`);
        return allProducts;
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
