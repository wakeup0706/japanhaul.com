import { NextRequest, NextResponse } from 'next/server';
import { 
    getAllScrapedProducts, 
    getScrapedProductById,
    deleteScrapedProduct,
    clearAllScrapedProducts,
    getScrapingStats,
    getRecentScrapingJobs
} from '@/lib/db/scraped-products';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/db
 * Get scraped products from Firestore
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const productId = searchParams.get('id');
        const sourceSite = searchParams.get('source');
        const availability = searchParams.get('availability') as 'in' | 'out' | null;
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam) : undefined;

        // Get single product by ID
        if (action === 'get' && productId) {
            const product = await getScrapedProductById(productId);
            
            if (!product) {
                return NextResponse.json(
                    { error: 'Product not found' },
                    { status: 404 }
                );
            }
            
            return NextResponse.json({ product });
        }

        // Get statistics
        if (action === 'stats') {
            const stats = await getScrapingStats();
            return NextResponse.json({ stats });
        }

        // Get recent scraping jobs
        if (action === 'jobs') {
            const jobLimit = limitParam ? parseInt(limitParam) : 10;
            const jobs = await getRecentScrapingJobs(jobLimit);
            return NextResponse.json({ jobs });
        }

        // Get all products with filters
        const products = await getAllScrapedProducts({
            sourceSite: sourceSite || undefined,
            availability: availability || undefined,
            isActive: true,
            limit,
        });

        return NextResponse.json({
            success: true,
            products,
            count: products.length,
        });

    } catch (error) {
        console.error('Error fetching products from database:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch products',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/products/db
 * Delete products from Firestore
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const productId = searchParams.get('id');

        // Delete single product
        if (productId) {
            await deleteScrapedProduct(productId);
            return NextResponse.json({
                success: true,
                message: 'Product deleted successfully',
            });
        }

        // Clear all products (requires confirmation)
        if (action === 'clear') {
            const count = await clearAllScrapedProducts();
            return NextResponse.json({
                success: true,
                message: `Cleared ${count} products`,
                count,
            });
        }

        return NextResponse.json(
            { error: 'Product ID or action required' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Error deleting products:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete products',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
