import { NextRequest, NextResponse } from 'next/server';
import { updateScrapedProductDetails } from '@/lib/db/scraped-products';
import { db } from '@/lib/firebase';
import { doc, writeBatch, Timestamp } from 'firebase/firestore';

// Lazy import to avoid bundling cost when unused
async function getDeps() {
  const axios = (await import('axios')).default;
  const cheerio = await import('cheerio');
  return { axios, cheerio } as const;
}

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// GET /api/scrape/detail?productId=...&url=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const url = searchParams.get('url');

    if (!productId || !url) {
      return NextResponse.json({ error: 'productId and url are required' }, { status: 400 });
    }

    const { axios, cheerio } = await getDeps();
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(res.data);

    // Extract gallery images (from detail slider and thumbs)
    const images = new Set<string>();
    $('#detail-slider img, #detail-thumb img, img.detail-slide-image').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src && src.startsWith('http')) images.add(src);
    });

    // Extract textual blocks on the right pane
    const pane = $('.detail-item');
    const text = pane.text();

    // Price blocks
    function parseJpy(value: string): number | undefined {
      const match = value.replace(/[,\s]/g, '').match(/¥?(\d{1,9})(?:\(tax.*\))?/i);
      return match ? Number(match[1]) : undefined;
    }

    const singlePriceMatch = text.match(/Single\s*item[:：]?\s*¥?([\d,]+)/i);
    const boxPriceMatch = text.match(/BOX[:：]?\s*¥?([\d,]+)/i);
    const taxIncluded = /tax included/i.test(text);

    // Preorder / badges
    const preorderOpen = /Now accepting reservations/i.test(text);
    const reservationEndDate = (text.match(/Applications accepted until\s*([\w\s,\d]+)/i) || [])[1] || undefined;
    const shippingSchedule = (text.match(/Shipments will begin in\s*([\w\s,\d]+)/i) || [])[1] || undefined;

    // Description and specs
    const descriptionHtml = $('.detail-note section').first().html() || undefined;
    const cleanDescription = descriptionHtml
      ?.replace(/\s*<br\s*\/?>\s*/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const specs: string[] = [];
    $('.detail-spec li').each((_, li) => {
      specs.push($(li).text().replace(/\s+/g, ' ').trim());
    });

    // Build update payload
    const updates = {
      images: Array.from(images).slice(0, 20),
      description: cleanDescription,
      specs,
      singlePriceJpy: singlePriceMatch ? parseJpy(singlePriceMatch[0]) : undefined,
      boxPriceJpy: boxPriceMatch ? parseJpy(boxPriceMatch[0]) : undefined,
      taxIncluded,
      preorderOpen,
      reservationEndDate,
      shippingSchedule,
      labels: preorderOpen ? ['Preorder'] : undefined,
    } as any;

    // Remove undefined fields (Firestore doesn't allow undefined)
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    // Persist to Firestore (details)
    await updateScrapedProductDetails(productId, updates);

    // Parse related products and save to subcollection
    const related: Array<{ id: string; title: string; imageUrl?: string; sourceUrl: string; priceJpy?: number }>= [];
    $('section.list-item ul > li a').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const relUrl = href.startsWith('http') ? href : `https://amnibus.com${href}`;
      const relTitle = ($(el).find('.list-name').text() || $(el).find('img').attr('alt') || '').trim();
      const thumb = $(el).find('.list-image img').attr('src');
      const priceText = (($(el).find('.list-price .small-price').text() || $(el).find('.list-price').text()) || '').replace(/[^0-9]/g, '');
      const priceJpy = priceText ? Number(priceText) : undefined;

      // Derive stable ID from URL (same scheme used in db service)
      let normalized = relUrl;
      try {
        const u = new URL(relUrl);
        normalized = `${u.origin}${u.pathname}`.toLowerCase();
      } catch {}
      let hash = 5381;
      for (let i = 0; i < normalized.length; i++) hash = ((hash << 5) + hash) ^ normalized.charCodeAt(i);
      const relId = `p_${Math.abs(hash >>> 0).toString(36)}`;

      related.push({ id: relId, title: relTitle || 'Related Product', imageUrl: thumb, sourceUrl: relUrl, priceJpy });
    });

    if (related.length) {
      const batch = writeBatch(db);
      related.slice(0, 24).forEach((rp, idx) => {
        const relRef = doc(db, `scrapedProducts/${productId}/related`, rp.id);
        batch.set(relRef, { ...rp, rank: idx, addedAt: Timestamp.now() }, { merge: true });
      });
      await batch.commit();
    }

    return NextResponse.json({ success: true, productId, updates, relatedCount: related.length });
  } catch (error) {
    console.error('Detail scrape error:', error);
    return NextResponse.json({ error: 'Failed to scrape detail page' }, { status: 500 });
  }
}
