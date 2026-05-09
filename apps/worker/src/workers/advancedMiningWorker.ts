import { Worker, Job, Queue } from 'bullmq';
import axios, { AxiosInstance } from 'axios';
import { prisma } from '../lib/prisma';
import { redisConnection } from '../lib/redis';
import { logger } from '../lib/logger';
import { extractDomain } from '@adspy/utils';
import { detectPlatform } from '../services/platformDetector';
import { scoreAd } from '../services/adScoring';
import type { MiningJobData } from './types';

// ── Proxy pool ─────────────────────────────────────────────────
const PROXY_LIST = (process.env.PROXY_LIST ?? '').split(',').filter(Boolean);
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
];

const FACEBOOK_ADS_ENDPOINTS = [
  'https://www.facebook.com/ads/library/async/search_ads/',
  'https://www.facebook.com/api/graphql/',
];

const DOMAIN_COOLDOWNS = new Map<string, number>();
const DOMAIN_COOLDOWN_MS = 3000;

// ── Axios factory with rotating proxy + UA ─────────────────────
function createHttpClient(attempt = 0): AxiosInstance {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const config: Parameters<typeof axios.create>[0] = {
    timeout: 20000,
    headers: {
      'User-Agent': ua,
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Referer: 'https://www.facebook.com/ads/library/',
      'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-fb-friendly-name': 'AdsArchiveAdsTableQuery',
    },
    maxRedirects: 5,
  };

  if (PROXY_LIST.length > 0) {
    const proxyUrl = PROXY_LIST[attempt % PROXY_LIST.length];
    try {
      const parsed = new URL(proxyUrl);
      config.proxy = {
        protocol: parsed.protocol.replace(':', ''),
        host: parsed.hostname,
        port: parseInt(parsed.port || '80'),
        auth:
          parsed.username && parsed.password
            ? { username: parsed.username, password: parsed.password }
            : undefined,
      };
    } catch {
      logger.warn(`[Mining] Invalid proxy URL: ${proxyUrl}`);
    }
  }

  return axios.create(config);
}

// ── Facebook Ads Library scraper ───────────────────────────────
async function fetchAdsWithRetry(
  params: { query?: string; country?: string; limit?: number; cursor?: string },
  maxAttempts = 4
): Promise<{ ads: Record<string, unknown>[]; nextCursor?: string }> {
  const domain = 'www.facebook.com';

  // Respect domain cooldown
  const lastRequest = DOMAIN_COOLDOWNS.get(domain);
  if (lastRequest) {
    const elapsed = Date.now() - lastRequest;
    if (elapsed < DOMAIN_COOLDOWN_MS) {
      await sleep(DOMAIN_COOLDOWN_MS - elapsed);
    }
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const client = createHttpClient(attempt);
    const jitter = Math.random() * 1500 + 500; // 500–2000ms jitter

    try {
      if (attempt > 0) {
        await sleep(Math.pow(2, attempt) * 1000 + jitter);
        logger.info(`[Mining] Retry attempt ${attempt + 1}/${maxAttempts}`);
      }

      const searchParams = new URLSearchParams({
        active_status: 'all',
        ad_type: 'all',
        country: params.country ?? 'ALL',
        q: params.query ?? '',
        search_type: 'keyword_unordered',
        media_type: 'all',
        limit: String(Math.min(params.limit ?? 50, 100)),
        ...(params.cursor ? { after: params.cursor } : {}),
      });

      DOMAIN_COOLDOWNS.set(domain, Date.now());

      const response = await client.get(FACEBOOK_ADS_ENDPOINTS[0], {
        params: searchParams,
      });

      const raw = response.data;
      let parsed: Record<string, unknown> = {};

      if (typeof raw === 'string') {
        const cleaned = raw.replace(/^for \(;;\);/, '');
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          // Try to extract JSON from HTML
          const match = cleaned.match(/\{.*\}/s);
          if (match) parsed = JSON.parse(match[0]);
        }
      } else {
        parsed = raw;
      }

      const results = extractAdsFromResponse(parsed);
      const nextCursor = extractNextCursor(parsed);

      logger.info(`[Mining] Fetched ${results.length} ads (attempt ${attempt + 1})`);
      return { ads: results, nextCursor };
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      logger.warn(`[Mining] Attempt ${attempt + 1} failed (HTTP ${status ?? 'N/A'}): ${(error as Error).message}`);

      if (status === 429 || status === 503) {
        // Back off aggressively on rate limit
        await sleep(Math.pow(2, attempt + 2) * 1000);
      } else if (status === 403) {
        // Proxy/block — rotate immediately
        logger.warn('[Mining] Got 403 — rotating proxy on next attempt');
      }
    }
  }

  logger.error('[Mining] All retry attempts exhausted');
  return { ads: [] };
}

function extractAdsFromResponse(data: Record<string, unknown>): Record<string, unknown>[] {
  // Handle multiple response shapes from Facebook
  const paths = [
    () => (data as { payload?: { results?: unknown[] } }).payload?.results,
    () => (data as { data?: { ads?: unknown[] } }).data?.ads,
    () => {
      // GraphQL shape
      const edges = (data as { data?: { ad_library_search_connection?: { edges?: unknown[] } } })
        .data?.ad_library_search_connection?.edges;
      return edges?.map((e: unknown) => (e as { node?: unknown }).node);
    },
  ];

  for (const path of paths) {
    try {
      const result = path();
      if (Array.isArray(result) && result.length > 0) {
        return result as Record<string, unknown>[];
      }
    } catch {
      continue;
    }
  }
  return [];
}

function extractNextCursor(data: Record<string, unknown>): string | undefined {
  try {
    return (
      (data as { payload?: { paging?: { cursors?: { after?: string } } } }).payload?.paging?.cursors?.after ??
      (data as { data?: { ad_library_search_connection?: { page_info?: { end_cursor?: string } } } })
        .data?.ad_library_search_connection?.page_info?.end_cursor
    );
  } catch {
    return undefined;
  }
}

// ── Ad parser ──────────────────────────────────────────────────
function parseAdData(raw: Record<string, unknown>) {
  const snapshot = ((raw.snapshot ?? raw.ad_snapshot) ?? {}) as Record<string, unknown>;
  const pageInfo = ((raw.page_info ?? raw.byline) ?? {}) as Record<string, unknown>;
  const cards = Array.isArray(snapshot.cards) ? (snapshot.cards as Record<string, unknown>[]) : [];

  const mainCreative = {
    type: (raw.ad_creative_type === 'video' || snapshot.video_hd_url || snapshot.video_sd_url)
      ? 'VIDEO'
      : 'IMAGE',
    mediaUrl: (snapshot.video_hd_url ?? snapshot.video_sd_url ?? snapshot.image_url ?? '') as string,
    thumbnailUrl: (snapshot.resized_image_url ?? snapshot.video_preview_image_url ?? '') as string,
    headline: (snapshot.title ?? '') as string,
    body: ((snapshot.body as Record<string, unknown>)?.__html ?? snapshot.body ?? '') as string,
    description: (snapshot.link_description ?? '') as string,
    callToAction: (snapshot.cta_text ?? '') as string,
    linkUrl: (snapshot.link_url ?? '') as string,
    displayUrl: (snapshot.display_format ?? snapshot.link_url ?? '') as string,
  };

  const carouselCreatives = cards.map((card) => ({
    type: 'IMAGE' as const,
    mediaUrl: (card.original_image_url ?? card.resized_image_url ?? '') as string,
    thumbnailUrl: (card.resized_image_url ?? '') as string,
    headline: (card.title ?? '') as string,
    body: (card.body ?? '') as string,
    callToAction: (card.cta_text ?? '') as string,
    linkUrl: (card.link_url ?? '') as string,
  }));

  const allCreatives = [mainCreative, ...carouselCreatives].filter(
    (c) => c.mediaUrl || c.headline || c.body
  );

  const linkUrl = mainCreative.linkUrl;
  const domain = linkUrl ? extractDomain(linkUrl) ?? undefined : undefined;

  const countries = Array.isArray(raw.target_locations)
    ? (raw.target_locations as string[])
    : Array.isArray(raw.publisher_platforms)
    ? []
    : [];

  const languages = Array.isArray(raw.languages)
    ? (raw.languages as string[])
    : [];

  return {
    facebookAdId: String(raw.adArchiveID ?? raw.ad_archive_id ?? raw.id ?? ''),
    pageId: String(raw.pageID ?? raw.page_id ?? ''),
    pageName: String(pageInfo.page_name ?? raw.page_name ?? ''),
    pageUrl: String(pageInfo.page_profile_uri ?? ''),
    domain,
    status: (raw.isActive ?? raw.is_active) ? ('ACTIVE' as const) : ('INACTIVE' as const),
    platforms: (Array.isArray(raw.publisher_platform) ? raw.publisher_platform : ['FACEBOOK']) as string[],
    countries,
    languages,
    startDate: raw.startDate ? new Date(raw.startDate as string) : undefined,
    endDate: raw.endDate ? new Date(raw.endDate as string) : undefined,
    impressionsLower: (raw.impressions as Record<string, number>)?.lower_bound,
    impressionsUpper: (raw.impressions as Record<string, number>)?.upper_bound,
    spendLower: (raw.spend as Record<string, number>)?.lower_bound,
    spendUpper: (raw.spend as Record<string, number>)?.upper_bound,
    currency: raw.currency as string | undefined,
    creatives: allCreatives,
    rawData: raw,
  };
}

// ── Main processor ─────────────────────────────────────────────
async function processAdvancedMining(job: Job<MiningJobData>) {
  const { type, country, keyword, limit = 100 } = job.data;

  logger.info(`[Advanced Mining] Starting ${type} — country=${country ?? 'ALL'} keyword=${keyword ?? '*'}`);

  const miningLog = await prisma.miningLog.create({
    data: { type, status: 'RUNNING', startedAt: new Date(), metadata: { country, keyword } },
  });

  let newAds = 0;
  let updatedAds = 0;
  let errors = 0;
  let cursor: string | undefined;
  let pagesFetched = 0;
  const maxPages = Math.ceil(limit / 50);

  try {
    do {
      const { ads: rawAds, nextCursor } = await fetchAdsWithRetry(
        { query: keyword, country, limit: 50, cursor },
        4
      );

      cursor = nextCursor;
      pagesFetched++;

      for (const raw of rawAds) {
        try {
          const adData = parseAdData(raw);
          if (!adData.facebookAdId) continue;

          const existing = await prisma.ad.findUnique({
            where: { facebookAdId: adData.facebookAdId },
            select: { id: true, status: true },
          });

          if (existing) {
            if (existing.status !== adData.status) {
              await prisma.ad.update({
                where: { id: existing.id },
                data: { status: adData.status, updatedAt: new Date() },
              });
            }
            updatedAds++;
            continue;
          }

          // Detect platform for the landing domain
          let platformInfo: Awaited<ReturnType<typeof detectPlatform>> | null = null;
          if (adData.domain) {
            platformInfo = await detectPlatform(adData.domain).catch(() => null);
          }

          const ad = await prisma.ad.create({
            data: {
              facebookAdId: adData.facebookAdId,
              pageName: adData.pageName || undefined,
              pageId: adData.pageId || undefined,
              pageUrl: adData.pageUrl || undefined,
              domain: adData.domain,
              status: adData.status,
              platforms: adData.platforms as never[],
              startDate: adData.startDate,
              endDate: adData.endDate,
              impressionsLower: adData.impressionsLower,
              impressionsUpper: adData.impressionsUpper,
              spendLower: adData.spendLower,
              spendUpper: adData.spendUpper,
              currency: adData.currency,
              rawData: adData.rawData,
              ...(platformInfo
                ? {
                    niche: platformInfo.detectedNiche ?? undefined,
                  }
                : {}),
              creatives: {
                create: adData.creatives.map((c) => ({
                  type: c.type,
                  mediaUrl: c.mediaUrl || undefined,
                  thumbnailUrl: c.thumbnailUrl || undefined,
                  headline: c.headline || undefined,
                  body: c.body || undefined,
                  description: c.description || undefined,
                  callToAction: c.callToAction || undefined,
                  linkUrl: c.linkUrl || undefined,
                  displayUrl: c.displayUrl || undefined,
                })),
              },
              adCountries: {
                create: adData.countries.map((code: string) => ({ countryCode: code })),
              },
              adLanguages: {
                create: adData.languages.map((code: string) => ({ languageCode: code })),
              },
            },
            select: { id: true },
          });

          // Compute ad intelligence score asynchronously
          scoreAd(ad.id).catch((err) => logger.warn('[Mining] Score failed:', err));

          // Domain stats
          if (adData.domain) {
            await prisma.domain.upsert({
              where: { domain: adData.domain },
              update: {
                adsCount: { increment: 1 },
                activeAds: adData.status === 'ACTIVE' ? { increment: 1 } : undefined,
                lastSeen: new Date(),
              },
              create: {
                domain: adData.domain,
                adsCount: 1,
                activeAds: adData.status === 'ACTIVE' ? 1 : 0,
                niche: platformInfo?.detectedNiche ?? undefined,
              },
            });
          }

          newAds++;
        } catch (err) {
          logger.debug('[Mining] Ad parse error:', err);
          errors++;
        }
      }

      const progress = Math.round((pagesFetched / maxPages) * 100);
      await job.updateProgress(progress);

      await prisma.miningLog.update({
        where: { id: miningLog.id },
        data: { processedAds: newAds + updatedAds, newAds, updatedAds, errors, progress },
      });

      // Inter-page delay with jitter
      if (cursor && pagesFetched < maxPages) {
        await sleep(1500 + Math.random() * 1000);
      }
    } while (cursor && pagesFetched < maxPages);

    await prisma.miningLog.update({
      where: { id: miningLog.id },
      data: {
        status: 'COMPLETED',
        totalAds: newAds + updatedAds,
        processedAds: newAds + updatedAds,
        newAds,
        updatedAds,
        errors,
        progress: 100,
        completedAt: new Date(),
      },
    });

    logger.info(`[Advanced Mining] Done: ${newAds} new, ${updatedAds} updated, ${errors} errors`);
    return { newAds, updatedAds, errors };
  } catch (err) {
    await prisma.miningLog.update({
      where: { id: miningLog.id },
      data: { status: 'FAILED', errorMessage: String(err), completedAt: new Date() },
    });
    throw err;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startAdvancedMiningWorker() {
  const worker = new Worker<MiningJobData>('mining', processAdvancedMining, {
    connection: redisConnection,
    concurrency: parseInt(process.env.MINING_CONCURRENCY ?? '3'),
    limiter: { max: 10, duration: 60000 },
  });

  worker.on('completed', (job, result) =>
    logger.info(`[Mining Worker] Job ${job.id} done: +${(result as { newAds: number }).newAds} new ads`)
  );
  worker.on('failed', (job, err) =>
    logger.error(`[Mining Worker] Job ${job?.id} failed: ${err.message}`)
  );
  worker.on('stalled', (jobId) =>
    logger.warn(`[Mining Worker] Job ${jobId} stalled`)
  );

  return worker;
}

// ── Distributed scheduler ──────────────────────────────────────
export async function scheduleBulkMining(queue: Queue) {
  const COUNTRIES = ['US', 'BR', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IN', 'MX'];
  const NICHES = [
    'weight loss', 'dropshipping', 'make money online', 'fitness',
    'skincare', 'keto', 'crypto', 'real estate', 'e-commerce', 'pet',
  ];

  const jobs = [];

  // Incremental updates for active ads
  jobs.push(
    queue.add('mine', { type: 'INCREMENTAL', limit: 200 }, {
      attempts: 3, backoff: { type: 'exponential', delay: 5000 },
    })
  );

  // Country-targeted crawl
  for (const [i, country] of COUNTRIES.entries()) {
    jobs.push(
      queue.add('mine', { type: 'COUNTRY_TARGETED', country, limit: 100 }, {
        delay: i * 8000,
        attempts: 3, backoff: { type: 'exponential', delay: 5000 },
      })
    );
  }

  // Keyword-targeted crawl
  for (const [i, keyword] of NICHES.entries()) {
    jobs.push(
      queue.add('mine', { type: 'KEYWORD_TARGETED', keyword, limit: 50 }, {
        delay: COUNTRIES.length * 8000 + i * 5000,
        attempts: 3, backoff: { type: 'exponential', delay: 5000 },
      })
    );
  }

  await Promise.all(jobs);
  logger.info(`[Scheduler] Queued ${jobs.length} mining jobs`);
}
