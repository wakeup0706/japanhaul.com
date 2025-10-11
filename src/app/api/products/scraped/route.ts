import { NextRequest, NextResponse } from 'next/server';
import type { Product } from '@/app/_data/products';
import type { ScrapedProduct } from '@/lib/scraper';

// In-memory storage for scraped products (in production, use a database)
let scrapedProducts: Product[] = [];
let nextId = 1;

// GET /api/products/scraped - Get all scraped products
export async function GET() {
    return NextResponse.json({
        products: scrapedProducts,
        count: scrapedProducts.length,
    });
}

// POST /api/products/scraped - Add scraped products to the store
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { products, replace = false } = body;

        if (!Array.isArray(products)) {
            return NextResponse.json(
                { error: 'Products array is required' },
                { status: 400 }
            );
        }

        // Transform scraped products to match our Product type
        const transformedProducts: Product[] = products.map((product: ScrapedProduct) => ({
            id: `scraped_${nextId++}_${Date.now()}`,
            title: product.title,
            price: product.price || 0,
            compareAt: product.originalPrice || product.compareAt,
            brand: product.brand || 'Scraped Product',
            type: product.category || product.type || 'General',
            availability: product.availability || 'in',
            labels: product.labels || [],
            condition: product.condition,
            isSoldOut: product.isSoldOut,
            sourceUrl: product.sourceUrl,
            imageUrl: product.imageUrl,
            description: product.description,
        }));

        if (replace) {
            // Replace all existing products
            scrapedProducts = transformedProducts;
        } else {
            // Add to existing products
            scrapedProducts.push(...transformedProducts);
        }

        return NextResponse.json({
            success: true,
            products: transformedProducts,
            totalCount: scrapedProducts.length,
        });

    } catch (error) {
        console.error('Error storing scraped products:', error);
        return NextResponse.json(
            { error: 'Failed to store scraped products' },
            { status: 500 }
        );
    }
}

// DELETE /api/products/scraped - Clear all scraped products
export async function DELETE() {
    try {
        scrapedProducts = [];
        nextId = 1;

        return NextResponse.json({
            success: true,
            message: 'All scraped products cleared',
        });
    } catch (error) {
        console.error('Error clearing scraped products:', error);
        return NextResponse.json(
            { error: 'Failed to clear scraped products' },
            { status: 500 }
        );
    }
}

// PUT /api/products/scraped - Update a specific scraped product
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, updates } = body;

        if (!id || !updates) {
            return NextResponse.json(
                { error: 'Product ID and updates are required' },
                { status: 400 }
            );
        }

        const productIndex = scrapedProducts.findIndex(p => p.id === id);
        if (productIndex === -1) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Update the product
        scrapedProducts[productIndex] = { ...scrapedProducts[productIndex], ...updates };

        return NextResponse.json({
            success: true,
            product: scrapedProducts[productIndex],
        });

    } catch (error) {
        console.error('Error updating scraped product:', error);
        return NextResponse.json(
            { error: 'Failed to update scraped product' },
            { status: 500 }
        );
    }
}
