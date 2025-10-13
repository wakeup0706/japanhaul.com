import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, limit, query } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('id');
    const max = Number(searchParams.get('limit') || '12');
    if (!productId) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const q = query(
      collection(db, `scrapedProducts/${productId}/related`),
      orderBy('rank', 'asc'),
      limit(Math.max(1, Math.min(max, 48)))
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(d => {
      const data: any = d.data();
      const sourceUrl: string | undefined = data.sourceUrl;
      // Prefer numeric product code as public id if available
      let publicId: string = data.id || d.id;
      const numericFromField = typeof data.id === 'string' && /^\d+$/.test(data.id);
      if (!numericFromField && sourceUrl) {
        const m = sourceUrl.match(/\/detail\/(\d+)/);
        if (m) publicId = m[1];
      }

      // Compute or reuse Firestore doc id (p_*) for routing
      let docId: string = d.id;
      if (!docId.startsWith('p_') && sourceUrl) {
        try {
          const u = new URL(sourceUrl);
          const normalized = `${u.origin}${u.pathname}`.toLowerCase();
          let hash = 5381;
          for (let i = 0; i < normalized.length; i++) hash = ((hash << 5) + hash) ^ normalized.charCodeAt(i);
          docId = `p_${Math.abs(hash >>> 0).toString(36)}`;
        } catch {}
      }

      return {
        id: publicId,          // human/product code id
        docId,                 // Firestore document id for routing
        title: data.title,
        imageUrl: data.imageUrl,
        sourceUrl: data.sourceUrl,
        priceJpy: data.priceJpy,
        rank: data.rank,
        addedAt: data.addedAt,
      };
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error('Related fetch failed', e);
    return NextResponse.json({ error: 'Failed to fetch related' }, { status: 500 });
  }
}
