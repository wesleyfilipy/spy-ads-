export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.origin + parsed.pathname;
  } catch {
    return url;
  }
}

export function isFacebookAdLibraryUrl(url: string): boolean {
  return url.includes('facebook.com/ads/library') || url.includes('fb.com/ads/library');
}

export function buildFacebookAdLibraryUrl(params: {
  country?: string;
  adType?: string;
  query?: string;
}): string {
  const base = 'https://www.facebook.com/ads/library/';
  const searchParams = new URLSearchParams({
    active_status: 'active',
    ad_type: params.adType ?? 'all',
    country: params.country ?? 'ALL',
    q: params.query ?? '',
    search_type: 'keyword_unordered',
    media_type: 'all',
  });
  return `${base}?${searchParams.toString()}`;
}
