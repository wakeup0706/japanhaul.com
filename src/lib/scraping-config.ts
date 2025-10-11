// Configuration for multiple websites to scrape
// Add your target websites here with their scraping configurations

import type { ScrapingConfig } from './scraper';

export interface WebsiteConfig {
    name: string;
    url: string;
    enabled: boolean;
    scrapingConfig: ScrapingConfig;
    schedule?: {
        enabled: boolean;
        intervalMinutes: number;
        lastRun?: Date;
        nextRun?: Date;
    };
}

export const WEBSITE_CONFIGS: WebsiteConfig[] = [
    // Anime Store JP - New Arrivals scraping configuration (uses JSON-LD primarily)
    {
        name: "Anime Store JP",
        url: "https://anime-store.jp/collections/newitems",
        enabled: true,
        scrapingConfig: {
            url: "https://anime-store.jp/collections/newitems",
            selectors: {
                productList: '.collection-products, .product-collection',
                productCard: '.product-collection',
                title: '.product-collection__title',
                price: '.product-collection__price',
                image: '.product-collection__image img, .rimage__img, [data-master], [srcset]',
                description: '.product-collection__content',
            },
            pagination: {
                nextPageSelector: '.pagination a[href*="?page="], .next[href*="?page="], a[href*="?page="]:last-child',
                maxPages: 2
            }
        },
        schedule: {
            enabled: true,
            intervalMinutes: 30
        }
    },
    {
        name: "Anime Merchandise",
        url: "https://example-anime-store.com/collectibles", // Replace with actual URL
        enabled: true,
        scrapingConfig: {
            url: "https://example-anime-store.com/collectibles",
            selectors: {
                productList: ".products, .collection, .items",
                productCard: ".product, .item, .collectible",
                title: ".title, h2, .product-name",
                price: ".price, .cost, .amount",
                image: "img, .product-image img",
                description: ".description, .details"
            },
            pagination: {
                nextPageSelector: ".next-page, .pagination a:last-child",
                maxPages: 2
            }
        },
        schedule: {
            enabled: true,
            intervalMinutes: 30
        }
    },
    {
        name: "Kitchenware Store",
        url: "https://example-kitchenware.jp/items", // Replace with actual URL
        enabled: true,
        scrapingConfig: {
            url: "https://example-kitchenware.jp/items",
            selectors: {
                productList: ".items, .products, .catalog",
                productCard: ".item, .product, article",
                title: ".item-title, h3, .name",
                price: ".price, .cost",
                image: ".item-image img, img",
                description: ".description"
            }
        },
        schedule: {
            enabled: true,
            intervalMinutes: 30
        }
    }
    // Add more websites as needed
];

// Helper function to get enabled websites for scraping
export function getEnabledWebsites(): WebsiteConfig[] {
    return WEBSITE_CONFIGS.filter(website => website.enabled);
}

// Helper function to get websites that need updating
export function getWebsitesNeedingUpdate(): WebsiteConfig[] {
    const now = new Date();
    return getEnabledWebsites().filter(website => {
        if (!website.schedule?.enabled) return false;

        const lastRun = website.schedule.lastRun;
        if (!lastRun) return true; // Never run before

        const nextRun = new Date(lastRun.getTime() + (website.schedule.intervalMinutes * 60 * 1000));
        return now >= nextRun;
    });
}

// Helper function to update last run time for a website
export function updateWebsiteLastRun(websiteName: string): void {
    const website = WEBSITE_CONFIGS.find(w => w.name === websiteName);
    if (website && website.schedule) {
        website.schedule.lastRun = new Date();
        website.schedule.nextRun = new Date(website.schedule.lastRun.getTime() + (website.schedule.intervalMinutes * 60 * 1000));
    }
}

// Helper function to add a new website configuration
export function addWebsite(website: WebsiteConfig): void {
    WEBSITE_CONFIGS.push(website);
}

// Helper function to remove a website configuration
export function removeWebsite(name: string): void {
    const index = WEBSITE_CONFIGS.findIndex(w => w.name === name);
    if (index !== -1) {
        WEBSITE_CONFIGS.splice(index, 1);
    }
}
