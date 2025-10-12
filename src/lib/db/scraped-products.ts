/**
 * Firestore Database Service for Scraped Products
 * 
 * Collections Structure:
 * - scrapedProducts/{productId} - Individual scraped products
 * - scrapingJobs/{jobId} - Scraping job history and status
 */

import { db } from '@/lib/firebase';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    deleteDoc,
    updateDoc,
    writeBatch,
    Timestamp,
    QueryConstraint
} from 'firebase/firestore';

// TypeScript interfaces
export interface ScrapedProductDB {
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    brand: string;
    category: string;
    imageUrl?: string;
    description?: string;
    availability: 'in' | 'out';
    sourceUrl: string;
    sourceSite: string; // e.g., "Amnibus", "Anime Store JP"
    condition?: "new" | "used" | "refurbished";
    isSoldOut?: boolean;
    labels?: string[];
    
    // Metadata
    scrapedAt: Timestamp;
    lastUpdated: Timestamp;
    scrapingJobId?: string;
    isActive: boolean; // False if product no longer exists on source site
}

export interface ScrapingJob {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    sourceSite: string;
    sourceUrl: string;
    startPage: number;
    endPage: number;
    
    // Results
    productsScraped: number;
    productsAdded: number;
    productsUpdated: number;
    errorMessage?: string;
    
    // Timestamps
    startedAt: Timestamp;
    completedAt?: Timestamp;
    
    // Metadata
    triggeredBy: 'cron' | 'manual' | 'api';
    duration?: number; // in seconds
}

// Collection names
const SCRAPED_PRODUCTS_COLLECTION = 'scrapedProducts';
const SCRAPING_JOBS_COLLECTION = 'scrapingJobs';

/**
 * Save a single scraped product to Firestore
 */
export async function saveScrapedProduct(product: Omit<ScrapedProductDB, 'id' | 'scrapedAt' | 'lastUpdated' | 'isActive'>): Promise<string> {
    try {
        // Generate a unique ID based on source URL and title
        const productId = generateProductId(product.sourceUrl, product.title);
        
        const productData: ScrapedProductDB = {
            ...product,
            id: productId,
            scrapedAt: Timestamp.now(),
            lastUpdated: Timestamp.now(),
            isActive: true,
        };

        await setDoc(doc(db, SCRAPED_PRODUCTS_COLLECTION, productId), productData, { merge: true });
        
        console.log(`✅ Saved product to Firestore: ${productId}`);
        return productId;
    } catch (error) {
        console.error('Error saving product to Firestore:', error);
        throw error;
    }
}

/**
 * Save multiple scraped products in a batch
 */
export async function saveScrapedProductsBatch(
    products: Omit<ScrapedProductDB, 'id' | 'scrapedAt' | 'lastUpdated' | 'isActive'>[],
    jobId?: string
): Promise<{ added: number; updated: number }> {
    try {
        const batch = writeBatch(db);
        let added = 0;
        let updated = 0;

        for (const product of products) {
            const productId = generateProductId(product.sourceUrl, product.title);
            const productRef = doc(db, SCRAPED_PRODUCTS_COLLECTION, productId);
            
            // Check if product already exists
            const existingProduct = await getDoc(productRef);
            
            const productData: ScrapedProductDB = {
                ...product,
                id: productId,
                scrapedAt: existingProduct.exists() ? existingProduct.data().scrapedAt : Timestamp.now(),
                lastUpdated: Timestamp.now(),
                isActive: true,
                scrapingJobId: jobId,
            };

            batch.set(productRef, productData, { merge: true });
            
            if (existingProduct.exists()) {
                updated++;
            } else {
                added++;
            }
        }

        await batch.commit();
        console.log(`✅ Batch saved ${products.length} products to Firestore (${added} new, ${updated} updated)`);
        
        return { added, updated };
    } catch (error) {
        console.error('Error saving products batch to Firestore:', error);
        throw error;
    }
}

/**
 * Get all scraped products
 */
export async function getAllScrapedProducts(
    filters?: {
        sourceSite?: string;
        availability?: 'in' | 'out';
        isActive?: boolean;
        limit?: number;
    }
): Promise<ScrapedProductDB[]> {
    try {
        const constraints: QueryConstraint[] = [];
        
        if (filters?.sourceSite) {
            constraints.push(where('sourceSite', '==', filters.sourceSite));
        }
        
        if (filters?.availability) {
            constraints.push(where('availability', '==', filters.availability));
        }
        
        if (filters?.isActive !== undefined) {
            constraints.push(where('isActive', '==', filters.isActive));
        }
        
        constraints.push(orderBy('scrapedAt', 'desc'));
        
        if (filters?.limit) {
            constraints.push(limit(filters.limit));
        }
        
        const q = query(collection(db, SCRAPED_PRODUCTS_COLLECTION), ...constraints);
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => doc.data() as ScrapedProductDB);
    } catch (error) {
        console.error('Error getting scraped products from Firestore:', error);
        throw error;
    }
}

/**
 * Get a single product by ID
 */
export async function getScrapedProductById(productId: string): Promise<ScrapedProductDB | null> {
    try {
        const docRef = doc(db, SCRAPED_PRODUCTS_COLLECTION, productId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as ScrapedProductDB;
        }
        
        return null;
    } catch (error) {
        console.error('Error getting product from Firestore:', error);
        throw error;
    }
}

/**
 * Delete a product
 */
export async function deleteScrapedProduct(productId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, SCRAPED_PRODUCTS_COLLECTION, productId));
        console.log(`✅ Deleted product: ${productId}`);
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
}

/**
 * Mark products as inactive (soft delete)
 */
export async function markProductsInactive(productIds: string[]): Promise<void> {
    try {
        const batch = writeBatch(db);
        
        for (const productId of productIds) {
            const productRef = doc(db, SCRAPED_PRODUCTS_COLLECTION, productId);
            batch.update(productRef, { isActive: false, lastUpdated: Timestamp.now() });
        }
        
        await batch.commit();
        console.log(`✅ Marked ${productIds.length} products as inactive`);
    } catch (error) {
        console.error('Error marking products inactive:', error);
        throw error;
    }
}

/**
 * Clear all scraped products (use with caution!)
 */
export async function clearAllScrapedProducts(): Promise<number> {
    try {
        const querySnapshot = await getDocs(collection(db, SCRAPED_PRODUCTS_COLLECTION));
        const batch = writeBatch(db);
        
        querySnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`✅ Cleared ${querySnapshot.size} products from Firestore`);
        
        return querySnapshot.size;
    } catch (error) {
        console.error('Error clearing products:', error);
        throw error;
    }
}

// ============================================================
// SCRAPING JOBS FUNCTIONS
// ============================================================

/**
 * Create a new scraping job
 */
export async function createScrapingJob(job: Omit<ScrapingJob, 'id' | 'startedAt' | 'status' | 'productsScraped' | 'productsAdded' | 'productsUpdated'>): Promise<string> {
    try {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const jobData: ScrapingJob = {
            ...job,
            id: jobId,
            status: 'pending',
            startedAt: Timestamp.now(),
            productsScraped: 0,
            productsAdded: 0,
            productsUpdated: 0,
        };

        await setDoc(doc(db, SCRAPING_JOBS_COLLECTION, jobId), jobData);
        console.log(`✅ Created scraping job: ${jobId}`);
        
        return jobId;
    } catch (error) {
        console.error('Error creating scraping job:', error);
        throw error;
    }
}

/**
 * Update scraping job status
 */
export async function updateScrapingJob(
    jobId: string, 
    updates: Partial<ScrapingJob>
): Promise<void> {
    try {
        const jobRef = doc(db, SCRAPING_JOBS_COLLECTION, jobId);
        await updateDoc(jobRef, updates as Record<string, unknown>);
        console.log(`✅ Updated scraping job: ${jobId}`);
    } catch (error) {
        console.error('Error updating scraping job:', error);
        throw error;
    }
}

/**
 * Get recent scraping jobs
 */
export async function getRecentScrapingJobs(limitCount: number = 10): Promise<ScrapingJob[]> {
    try {
        const q = query(
            collection(db, SCRAPING_JOBS_COLLECTION),
            orderBy('startedAt', 'desc'),
            limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as ScrapingJob);
    } catch (error) {
        console.error('Error getting scraping jobs:', error);
        throw error;
    }
}

/**
 * Get a scraping job by ID
 */
export async function getScrapingJobById(jobId: string): Promise<ScrapingJob | null> {
    try {
        const docRef = doc(db, SCRAPING_JOBS_COLLECTION, jobId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as ScrapingJob;
        }
        
        return null;
    } catch (error) {
        console.error('Error getting scraping job:', error);
        throw error;
    }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Generate a consistent product ID from URL and title
 */
function generateProductId(sourceUrl: string, title: string): string {
    // Create a hash-like ID from URL and title
    const combined = `${sourceUrl}_${title}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
    // Truncate to reasonable length and add timestamp suffix for uniqueness
    return combined.substring(0, 50) + '_' + Date.now().toString(36);
}

/**
 * Get statistics about scraped products
 */
export async function getScrapingStats(): Promise<{
    totalProducts: number;
    activeProducts: number;
    inStockProducts: number;
    outOfStockProducts: number;
    lastScrapedAt?: Date;
}> {
    try {
        const allProducts = await getAllScrapedProducts();
        const activeProducts = allProducts.filter(p => p.isActive);
        
        return {
            totalProducts: allProducts.length,
            activeProducts: activeProducts.length,
            inStockProducts: activeProducts.filter(p => p.availability === 'in').length,
            outOfStockProducts: activeProducts.filter(p => p.availability === 'out').length,
            lastScrapedAt: allProducts.length > 0 ? allProducts[0].scrapedAt.toDate() : undefined,
        };
    } catch (error) {
        console.error('Error getting scraping stats:', error);
        throw error;
    }
}
