import { NextRequest, NextResponse } from 'next/server';
import { WebScraper, ScrapingConfig, ScrapedProduct, scrapingConfigs } from '@/lib/scraper';

// POST /api/scrape - Scrape products from a website
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, configType = 'generic', customConfig, startPage, endPage, batchSize } = body;

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        const scraper = new WebScraper();

        // Use custom config if provided, otherwise use predefined config
        let scrapingConfig: ScrapingConfig;
        if (customConfig) {
            scrapingConfig = customConfig;
        } else {
            const configFunction = scrapingConfigs[configType as keyof typeof scrapingConfigs];
            if (!configFunction) {
                return NextResponse.json(
                    { error: `Invalid configuration type: ${configType}` },
                    { status: 400 }
                );
            }
            scrapingConfig = configFunction(url);
        }

        // Override URL in config
        scrapingConfig.url = url;

        console.log('Starting scraping for:', url);
        console.log('Pagination config:', scrapingConfig.pagination);
        console.log('Batch params:', { startPage, endPage, batchSize });

        let products: ScrapedProduct[] = [];

        // Handle batch processing if parameters are provided
        if (startPage !== undefined && endPage !== undefined) {
            console.log(`🔄 [BATCH] Processing pages ${startPage} to ${endPage}`);
            products = await scraper.scrapePageBatch(scrapingConfig, startPage, endPage);
        } else {
            // Use scrapeProducts for single page or existing logic
            products = await scraper.scrapeProducts(scrapingConfig);
        }

        // Transform scraped products to match our Product type
        const transformedProducts = products.map((product, index) => ({
            id: `scraped_${Date.now()}_${index}`,
            title: product.title,
            price: product.price || 0,
            compareAt: product.originalPrice,
            brand: product.brand || 'Unknown',
            type: product.category || 'General',
            availability: product.availability,
            labels: product.labels,
            condition: product.condition,
            isSoldOut: product.isSoldOut,
            sourceUrl: product.sourceUrl,
            imageUrl: product.imageUrl,
            description: product.description,
        }));

        console.log(`Successfully scraped ${transformedProducts.length} products`);

        return NextResponse.json({
            success: true,
            products: transformedProducts,
            count: transformedProducts.length,
        });

    } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json(
            {
                error: 'Failed to scrape products',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// GET /api/scrape - Get scraping configurations and test endpoint
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'configs') {
        return NextResponse.json({
            configs: Object.keys(scrapingConfigs),
            sampleConfig: scrapingConfigs.generic('https://example.com'),
        });
    }

    return NextResponse.json({
        message: 'Scraping API endpoint',
        endpoints: {
            'POST /api/scrape': 'Scrape products from a website',
            'GET /api/scrape?action=configs': 'Get available scraping configurations',
        },
    });
}
