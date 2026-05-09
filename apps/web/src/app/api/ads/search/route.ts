import { NextRequest, NextResponse } from 'next/server';

const FB_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const FB_API = 'https://graph.facebook.com/v19.0/ads_archive';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const countries = searchParams.get('countries') || 'BR,US';
  const limit = searchParams.get('limit') || '20';

  if (!FB_TOKEN) {
    return NextResponse.json({ error: 'FACEBOOK_ACCESS_TOKEN not configured', data: [] }, { status: 200 });
  }

  try {
    const params = new URLSearchParams({
      access_token: FB_TOKEN,
      ad_type: 'ALL',
      ad_reached_countries: `[${countries.split(',').map((c) => `"${c.trim()}"`).join(',')}]`,
      search_terms: query || 'produto',
      fields: [
        'id',
        'page_name',
        'page_id',
        'ad_creative_link_titles',
        'ad_creative_bodies',
        'ad_creative_link_descriptions',
        'ad_creative_link_captions',
        'ad_snapshot_url',
        'ad_delivery_start_time',
        'ad_delivery_stop_time',
        'impressions',
        'spend',
        'currency',
        'publisher_platforms',
        'languages',
        'bylines',
      ].join(','),
      limit,
    });

    const res = await fetch(`${FB_API}?${params.toString()}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err?.error?.message ?? 'Facebook API error', data: [] }, { status: 200 });
    }

    const json = await res.json();

    const ads = (json.data ?? []).map((ad: Record<string, unknown>) => ({
      id: ad.id,
      pageName: ad.page_name,
      pageId: ad.page_id,
      headline: Array.isArray(ad.ad_creative_link_titles) ? (ad.ad_creative_link_titles as string[])[0] : '',
      body: Array.isArray(ad.ad_creative_bodies) ? (ad.ad_creative_bodies as string[])[0] : '',
      description: Array.isArray(ad.ad_creative_link_descriptions) ? (ad.ad_creative_link_descriptions as string[])[0] : '',
      snapshotUrl: ad.ad_snapshot_url,
      startDate: ad.ad_delivery_start_time,
      endDate: ad.ad_delivery_stop_time,
      status: ad.ad_delivery_stop_time ? 'INACTIVE' : 'ACTIVE',
      impressions: ad.impressions,
      spend: ad.spend,
      currency: ad.currency,
      platforms: ad.publisher_platforms ?? [],
      languages: ad.languages ?? [],
    }));

    return NextResponse.json({ data: ads, total: json.data?.length ?? 0 });
  } catch (e) {
    return NextResponse.json({ error: String(e), data: [] }, { status: 200 });
  }
}
