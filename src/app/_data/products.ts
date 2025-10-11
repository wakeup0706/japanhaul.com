export type Product = {
    id: string;
    title: string;
    price: number;
    compareAt?: number;
    brand: string;
    type: string;
    availability: "in" | "out";
    labels?: string[]; // For "Sold", "Used", etc.
    condition?: "new" | "used" | "refurbished";
    isSoldOut?: boolean;
    sourceUrl: string;
    imageUrl?: string; // URL to product image
    description?: string; // Product description
};

export const brands = ["Adele", "Apex heart", "Disney", "Calbee", "Bloom"] as const;

export const types = [
    "Anime Snacks",
    "Chocolate",
    "Mochi",
    "Kitchenware",
    "Candy, Gummy & Jelly",
] as const;

export const products: Product[] = Array.from({ length: 48 }).map((_, i) => {
    const base = (i + 1) * 3;
    const onSale = i % 3 === 0;
    return {
        id: `p${i + 1}`,
        title: `Product ${i + 1}`,
        price: onSale ? Math.round(base * 0.7 * 100) / 100 : base,
        compareAt: onSale ? base : undefined,
        brand: brands[i % brands.length],
        type: types[i % types.length],
        availability: i % 7 === 0 ? "out" : "in",
        sourceUrl: `/products/p${i + 1}`,
    };
});

// Global cache for scraped products
let scrapedProductsCache: Product[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch scraped products from the API
 */
export async function getScrapedProducts(): Promise<Product[]> {
    // Return cached products if they're still fresh
    if (scrapedProductsCache && (Date.now() - lastFetchTime) < CACHE_DURATION) {
        return scrapedProductsCache;
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/scraped`);

        if (!response.ok) {
            console.warn('Failed to fetch scraped products:', response.statusText);
            return [];
        }

        const data = await response.json();
        scrapedProductsCache = data.products || [];
        lastFetchTime = Date.now();

        return scrapedProductsCache;
    } catch (error) {
        console.error('Error fetching scraped products:', error);
        return [];
    }
}

/**
 * Get all products (hardcoded + scraped)
 */
export async function getAllProducts(): Promise<Product[]> {
    const scrapedProducts = await getScrapedProducts();
    return [...products, ...scrapedProducts];
}

/**
 * Add scraped products to the store
 */
export async function addScrapedProducts(newProducts: Omit<Product, 'id'>[]): Promise<Product[]> {
    try {
        const productsToAdd = newProducts.map(product => ({
            id: `scraped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...product,
        }));

        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/scraped`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                products: productsToAdd,
                replace: false,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to store scraped products');
        }

        const data = await response.json();

        // Clear cache to force refresh
        scrapedProductsCache = null;

        return data.products;
    } catch (error) {
        console.error('Error adding scraped products:', error);
        throw error;
    }
}

/**
 * Clear all scraped products
 */
export async function clearScrapedProducts(): Promise<void> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/scraped`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to clear scraped products');
        }

        // Clear cache
        scrapedProductsCache = null;
    } catch (error) {
        console.error('Error clearing scraped products:', error);
        throw error;
    }
}


