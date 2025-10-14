import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collectionGroup,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  collection,
  writeBatch,
} from 'firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * Ensure a product document exists given a product id (p_*) by promoting a related item.
 * If a document already exists, returns success.
 * If not, searches collection group `related` for a matching id and seeds a minimal product doc.
 *
 * GET /api/products/ensure?id=p_xxxxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    // Allow either Firestore docId (p_*) or numeric code
    const isDocId = id.startsWith('p_');
    
    // Extract numeric part if format is p_XXXXX
    let numericId: string | null = null;
    if (isDocId) {
      const match = id.match(/^p_(\d+)$/);
      numericId = match ? match[1] : null;
    } else if (id.match(/^\d+$/)) {
      numericId = id;
    }

    if (isDocId) {
      // If product already exists, check if it has related subcollection
      const productRef = doc(db, 'scrapedProducts', id);
      const existing = await getDoc(productRef);
      if (existing.exists()) {
        // Check if related subcollection is empty
        const relatedRef = collection(db, `scrapedProducts/${id}/related`);
        const relatedSnap = await getDocs(relatedRef);
        
        if (relatedSnap.empty) {
          // Product exists but has no related items - try to populate them
          console.log(`Product ${id} exists but has no related items, attempting to populate...`);
          
          // Find this product as a related item in other products to get parent's related items
          let seedSnap = await getDocs(query(collectionGroup(db, 'related'), where('id', '==', id)));
          
          // Also try numeric ID if available
          if (seedSnap.empty && numericId) {
            seedSnap = await getDocs(query(collectionGroup(db, 'related'), where('id', '==', numericId)));
          }
          
          if (!seedSnap.empty) {
            // Found this product in someone's related subcollection
            const parentPath = seedSnap.docs[0].ref.parent.parent;
            if (parentPath) {
              const parentRelatedRef = collection(db, `scrapedProducts/${parentPath.id}/related`);
              const parentRelatedSnap = await getDocs(parentRelatedRef);
              
              if (!parentRelatedSnap.empty) {
                // Copy related items from parent
                const batch = writeBatch(db);
                parentRelatedSnap.docs.forEach((relDoc) => {
                  const relData = relDoc.data();
                  const newRelRef = doc(db, `scrapedProducts/${id}/related`, relDoc.id);
                  batch.set(newRelRef, relData, { merge: true });
                });
                await batch.commit();
                console.log(`✅ Populated ${parentRelatedSnap.size} related items for ${id}`);
              }
            }
          }
        }
        
        return NextResponse.json({ success: true, ensured: true, existed: true, docId: id });
      }
    }

    // Try to find a seed related record
    // 1) Match by related.id == provided id (works if id is numeric or p_numeric)
    // 2) Or parse numeric and match by sourceUrl ending with /detail/{num}
    let seedSnap = await getDocs(query(collectionGroup(db, 'related'), where('id', '==', numericId || id)));
    if (seedSnap.empty && numericId) {
      // Try matching the numeric portion directly
      seedSnap = await getDocs(query(collectionGroup(db, 'related'), where('id', '==', numericId)));
    }
    if (seedSnap.empty && numericId) {
      // Fetch all related (bounded) and filter locally by sourceUrl
      const allRelated = await getDocs(collectionGroup(db, 'related'));
      const matches = allRelated.docs.find(d => {
        const url = (d.data() as any).sourceUrl as string | undefined;
        return url ? /\/detail\/(\d+)/.test(url) && url.endsWith(`/${numericId}`) : false;
      });
      if (matches) seedSnap = { docs: [matches] } as any;
    }
    if (seedSnap.empty) {
      return NextResponse.json({ error: 'Related seed not found' }, { status: 404 });
    }

    // Use the first match
    const rel = seedSnap.docs[0].data() as any;
    const sourceUrl: string | undefined = rel.sourceUrl;

    // Seed a minimal product record
    const priceJpy = typeof rel.priceJpy === 'number' ? rel.priceJpy : undefined;
    const usd = priceJpy ? Math.round((priceJpy / 150) * 100) / 100 : 0; // rough JPY->USD

    const seed = {
      id, // keep field id aligned with document id
      title: rel.title || 'Untitled Product',
      price: usd,
      originalPrice: undefined,
      brand: 'Amnibus',
      category: 'General',
      imageUrl: rel.imageUrl || undefined,
      description: '',
      availability: 'unknown' as const,
      sourceUrl: sourceUrl || '',
      sourceSite: 'Amnibus',
      condition: 'new' as const,
      isSoldOut: false,
      labels: rel.priceJpy ? ['Preorder'] : undefined,
      scrapedAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
      isActive: true,
    };

    // Remove undefined fields
    Object.keys(seed).forEach((k) => (seed as any)[k] === undefined && delete (seed as any)[k]);

    // Compute canonical docId from sourceUrl (hash), fallback to provided id if p_*
    let docId = isDocId ? id : '';
    if (!docId && sourceUrl) {
      try {
        const u = new URL(sourceUrl);
        const normalized = `${u.origin}${u.pathname}`.toLowerCase();
        let hash = 5381;
        for (let i = 0; i < normalized.length; i++) hash = ((hash << 5) + hash) ^ normalized.charCodeAt(i);
        docId = `p_${Math.abs(hash >>> 0).toString(36)}`;
      } catch {}
    }
    if (!docId) return NextResponse.json({ error: 'Could not determine product document id' }, { status: 400 });
    const productRef = doc(db, 'scrapedProducts', docId);
    await setDoc(productRef, { ...seed, id: docId }, { merge: true });

    // Copy related subcollection from the parent product (where we found this as a related item)
    try {
      // Get the parent document path from the seed snapshot
      const parentPath = seedSnap.docs[0].ref.parent.parent;
      if (parentPath) {
        // Fetch all related items from the parent product
        const parentRelatedRef = collection(db, `scrapedProducts/${parentPath.id}/related`);
        const parentRelatedSnap = await getDocs(parentRelatedRef);
        
        if (!parentRelatedSnap.empty) {
          // Copy related items to the new product document in batches
          const batch = writeBatch(db);
          let batchCount = 0;
          
          parentRelatedSnap.docs.forEach((relDoc) => {
            const relData = relDoc.data();
            const newRelRef = doc(db, `scrapedProducts/${docId}/related`, relDoc.id);
            batch.set(newRelRef, relData, { merge: true });
            batchCount++;
            
            // Firestore batch limit is 500 operations
            if (batchCount >= 500) {
              batch.commit();
              batchCount = 0;
            }
          });
          
          if (batchCount > 0) {
            await batch.commit();
          }
          
          console.log(`✅ Copied ${parentRelatedSnap.size} related products to ${docId}`);
        }
      }
    } catch (copyError) {
      console.error('Failed to copy related products:', copyError);
      // Don't fail the request if copying related products fails
    }

    // Optionally kick off detail enrichment in background if we have sourceUrl
    if (sourceUrl) {
      // Fire-and-forget; don't block response
      try {
        const base = new URL(request.url);
        const detailUrl = new URL('/api/scrape/detail', base.origin);
        detailUrl.searchParams.set('productId', docId);
        detailUrl.searchParams.set('url', sourceUrl);
        // No await to keep response snappy
        fetch(detailUrl.toString()).catch(() => {});
      } catch {}
    }

    return NextResponse.json({ success: true, ensured: true, existed: false, docId });
  } catch (error) {
    console.error('Ensure product failed', error);
    return NextResponse.json({ error: 'Failed to ensure product' }, { status: 500 });
  }
}
