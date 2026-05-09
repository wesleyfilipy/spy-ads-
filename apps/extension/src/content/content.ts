import type { ExtensionAdPayload, ExtensionCreativePayload } from '@adspy/types';

let isRunning = false;
let collectedAds: ExtensionAdPayload[] = [];

// ── Listen for trigger events ──────────────────────────────────
window.addEventListener('ADSPY_TRIGGER_MINING', () => {
  if (!isRunning) collectAds();
});

// ── Auto-collect on page load ──────────────────────────────────
if (document.readyState === 'complete') {
  collectAds();
} else {
  window.addEventListener('load', collectAds);
}

// ── Observe DOM changes for infinite scroll ────────────────────
const observer = new MutationObserver(() => {
  if (!isRunning) {
    clearTimeout((window as Window & { _adspyTimer?: ReturnType<typeof setTimeout> })._adspyTimer);
    (window as Window & { _adspyTimer?: ReturnType<typeof setTimeout> })._adspyTimer = setTimeout(collectAds, 1000);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

function extractAdsFromPage(): ExtensionAdPayload[] {
  const ads: ExtensionAdPayload[] = [];

  // Facebook Ads Library card selector
  const adCards = document.querySelectorAll('[data-testid="ad-card"], ._99s5, .x1ywc1zp');

  adCards.forEach((card) => {
    try {
      const ad = parseAdCard(card as HTMLElement);
      if (ad) ads.push(ad);
    } catch {
      // Skip malformed cards
    }
  });

  // Also try JSON-LD structured data
  const jsonScripts = document.querySelectorAll('script[type="application/json"]');
  jsonScripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent ?? '');
      if (data?.require && Array.isArray(data.require)) {
        const extracted = extractFromRequire(data.require);
        ads.push(...extracted);
      }
    } catch {
      // Invalid JSON
    }
  });

  return deduplicateAds(ads);
}

function parseAdCard(card: HTMLElement): ExtensionAdPayload | null {
  const facebookAdId = card.getAttribute('data-ad-archive-id') || generateFallbackId(card);
  if (!facebookAdId) return null;

  const pageName =
    card.querySelector('[data-testid="library-ad-page-name"]')?.textContent?.trim() ??
    card.querySelector('._8yyq')?.textContent?.trim();

  const status = card.querySelector('[data-testid="active-badge"]') ? 'ACTIVE' : 'UNKNOWN';

  const creatives: ExtensionCreativePayload[] = [];

  // Video
  const videos = card.querySelectorAll('video');
  videos.forEach((video) => {
    creatives.push({
      type: 'VIDEO',
      mediaUrl: video.src || video.querySelector('source')?.src,
      thumbnailUrl: video.poster,
    });
  });

  // Images
  if (videos.length === 0) {
    const images = card.querySelectorAll('img:not([data-testid="profile-picture"])');
    images.forEach((img) => {
      if ((img as HTMLImageElement).naturalWidth > 50) {
        creatives.push({
          type: 'IMAGE',
          mediaUrl: (img as HTMLImageElement).src,
          thumbnailUrl: (img as HTMLImageElement).src,
        });
      }
    });
  }

  // Copy text
  const bodyEl = card.querySelector('[data-testid="ad-card-body"], ._7jyg');
  const body = bodyEl?.textContent?.trim();

  const headlineEl = card.querySelector('[data-testid="ad-card-headline"], ._9s0e');
  const headline = headlineEl?.textContent?.trim();

  const ctaEl = card.querySelector('[data-testid="cta-button"], ._9s0f');
  const callToAction = ctaEl?.textContent?.trim();

  const linkEl = card.querySelector('a[href*="l.facebook.com"]');
  const linkUrl = linkEl?.getAttribute('href') ?? undefined;

  const displayUrl = linkUrl ? extractDomain(linkUrl) : undefined;

  if (body || headline || callToAction) {
    creatives.push({
      type: 'TEXT',
      body,
      headline,
      callToAction,
      linkUrl,
      displayUrl,
    });
  }

  const countries = extractCountries(card);
  const languages = extractLanguages(card);
  const pageUrl = card.querySelector('a[href*="facebook.com"]')?.getAttribute('href') ?? undefined;
  const domain = linkUrl ? extractDomain(linkUrl) : undefined;

  const startDateEl = card.querySelector('[data-testid="ad-card-start-date"]');
  const startDate = startDateEl?.textContent?.trim();

  return {
    facebookAdId,
    pageName,
    pageUrl,
    domain,
    status,
    platforms: ['FACEBOOK'],
    countries,
    languages,
    startDate,
    creatives: creatives.filter((c) => c.mediaUrl || c.body || c.headline),
  };
}

function extractFromRequire(requireArray: unknown[]): ExtensionAdPayload[] {
  const ads: ExtensionAdPayload[] = [];

  function traverse(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach(traverse);
      return;
    }
    const record = obj as Record<string, unknown>;
    if (record.adArchiveID || record.ad_archive_id) {
      const id = String(record.adArchiveID ?? record.ad_archive_id);
      const snapshot = (record.snapshot ?? {}) as Record<string, unknown>;
      const pageInfo = (record.page_info ?? {}) as Record<string, unknown>;

      ads.push({
        facebookAdId: id,
        pageName: String(pageInfo.page_name ?? record.page_name ?? ''),
        pageId: String(record.pageID ?? record.page_id ?? ''),
        pageUrl: String(pageInfo.page_profile_uri ?? ''),
        domain: snapshot.link_url ? extractDomain(String(snapshot.link_url)) : undefined,
        status: record.isActive ? 'ACTIVE' : 'INACTIVE',
        platforms: ['FACEBOOK'],
        countries: [],
        languages: [],
        startDate: record.startDate as string | undefined,
        creatives: [
          {
            type: record.ad_creative_type === 'video' ? 'VIDEO' : 'IMAGE',
            mediaUrl: String(snapshot.video_hd_url ?? snapshot.image_url ?? ''),
            thumbnailUrl: String(snapshot.resized_image_url ?? ''),
            headline: String(snapshot.title ?? ''),
            body: String((snapshot.body as Record<string, unknown>)?.__html ?? snapshot.body ?? ''),
            callToAction: String(snapshot.cta_text ?? ''),
            linkUrl: String(snapshot.link_url ?? ''),
          },
        ],
        rawData: record,
      });
      return;
    }
    Object.values(record).forEach(traverse);
  }

  traverse(requireArray);
  return ads;
}

function extractCountries(card: HTMLElement): string[] {
  const text = card.querySelector('[data-testid="ad-card-countries"]')?.textContent ?? '';
  const matches = text.match(/[A-Z]{2}/g);
  return matches ?? [];
}

function extractLanguages(card: HTMLElement): string[] {
  const text = card.querySelector('[data-testid="ad-card-languages"]')?.textContent ?? '';
  return text ? [text.toLowerCase().substring(0, 2)] : [];
}

function extractDomain(url: string): string | undefined {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function generateFallbackId(card: HTMLElement): string {
  const text = card.textContent ?? '';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
  }
  return `fb_${Math.abs(hash)}`;
}

function deduplicateAds(ads: ExtensionAdPayload[]): ExtensionAdPayload[] {
  const seen = new Set<string>();
  return ads.filter((ad) => {
    if (seen.has(ad.facebookAdId)) return false;
    seen.add(ad.facebookAdId);
    return true;
  });
}

async function collectAds() {
  if (isRunning) return;
  isRunning = true;

  try {
    const ads = extractAdsFromPage();
    if (ads.length === 0) return;

    // Batch submit every 20 ads
    const BATCH = 20;
    for (let i = 0; i < ads.length; i += BATCH) {
      const batch = ads.slice(i, i + BATCH);
      collectedAds.push(...batch);

      chrome.runtime.sendMessage({ type: 'SUBMIT_ADS', ads: batch }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response?.newAds > 0) {
          showCollectionBadge(response.newAds);
        }
      });
    }
  } finally {
    isRunning = false;
  }
}

function showCollectionBadge(count: number) {
  // Inject subtle toast notification
  const existing = document.getElementById('adspy-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'adspy-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #6366f1;
    color: white;
    padding: 10px 18px;
    border-radius: 8px;
    font-family: -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 600;
    z-index: 99999;
    box-shadow: 0 4px 20px rgba(99,102,241,0.4);
    animation: fadeIn 0.3s ease;
  `;
  toast.textContent = `✓ AdSpy: ${count} new ads collected`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
