import { Worker, Job } from 'bullmq';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { redisConnection } from '../lib/redis';
import { logger } from '../lib/logger';
import { extractDomain } from '@adspy/utils';
import type { MiningJobData } from './types';

const FACEBOOK_ADS_API = 'https://www.facebook.com/ads/library/async/search_ads/';

async function fetchFacebookAds(params: {
  query?: string;
  country?: string;
  limit?: number;
}): Promise<unknown[]> {
  try {
    const searchParams = new URLSearchParams({
      active_status: 'active',
      ad_type: 'all',
      country: params.country ?? 'ALL',
      q: params.query ?? '',
      search_type: 'keyword_unordered',
      media_type: 'all',
      limit: String(params.limit ?? 50),
    });

    const response = await axios.get(FACEBOOK_ADS_API, {
      params: searchParams,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
        Referer: 'https://www.facebook.com/ads/library/',
      },
      timeout: 15000,
    });

    const data = response.data;
    if (typeof data === 'string' && data.startsWith('for (;;);')) {
      const jsonStr = data.slice('for (;;);'.length);
      const parsed = JSON.parse(jsonStr);
      return parsed.payload?.results ?? [];
    }
    return Array.isArray(data?.payload?.results) ? data.payload.results : [];
  } catch (error) {
    logger.error('Facebook Ads API error:', error);
    return [];
  }
}

function parseAdFromFacebook(raw: Record<string, unknown>) {
  const snapshot = (raw.snapshot ?? {}) as Record<string, unknown>;
  const cards = Array.isArray(snapshot.cards) ? snapshot.cards : [];
  const pageInfo = (raw.page_info ?? {}) as Record<string, unknown>;

  const creatives = [
    {
      type: raw.ad_creative_type === 'video' ? 'VIDEO' : 'IMAGE',
      mediaUrl: (snapshot.video_hd_url ?? snapshot.video_sd_url ?? snapshot.image_url) as string | undefined,
      thumbnailUrl: snapshot.resized_image_url as string | undefined,
      headline: snapshot.title as string | undefined,
      body: snapshot.body?.markup?.__html as string | undefined,
      callToAction: snapshot.cta_text as string | undefined,
      linkUrl: snapshot.link_url as string | undefined,
      displayUrl: snapshot.display_format as string | undefined,
    },
    ...cards.map((card: Record<string, unknown>) => ({
      type: 'IMAGE' as const,
      mediaUrl: card.resized_image_url as string | undefined,
      thumbnailUrl: card.resized_image_url as string | undefined,
      headline: card.title as string | undefined,
      body: card.body as string | undefined,
      callToAction: card.cta_text as string | undefined,
      linkUrl: card.link_url as string | undefined,
    })),
  ];

  const linkUrl = snapshot.link_url as string | undefined;
  const domain = linkUrl ? extractDomain(linkUrl) ?? undefined : undefined;

  return {
    facebookAdId: String(raw.adArchiveID ?? raw.ad_archive_id ?? ''),
    pageId: String(raw.pageID ?? raw.page_id ?? ''),
    pageName: String(pageInfo.page_name ?? raw.page_name ?? ''),
    pageUrl: String(pageInfo.page_profile_uri ?? ''),
    domain,
    status: (raw.isActive ?? raw.is_active) ? 'ACTIVE' : ('INACTIVE' as const),
    platforms: Array.isArray(raw.publisher_platform) ? raw.publisher_platform : ['FACEBOOK'],
    countries: Array.isArray(raw.target_location) ? raw.target_location : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    startDate: raw.startDate ? new Date(raw.startDate as string) : undefined,
    endDate: raw.endDate ? new Date(raw.endDate as string) : undefined,
    creatives: creatives.filter((c) => c.mediaUrl || c.headline || c.body),
    rawData: raw,
  };
}

async function processMiningJob(job: Job<MiningJobData>) {
  const { type, country, keyword, limit = 50 } = job.data;

  logger.info(`[Mining] Starting ${type} job — country=${country} keyword=${keyword}`);

  const miningLog = await prisma.miningLog.create({
    data: { type, status: 'RUNNING', startedAt: new Date() },
  });

  try {
    const rawAds = await fetchFacebookAds({ query: keyword, country, limit });

    let newAds = 0;
    let updatedAds = 0;
    let errors = 0;

    for (const raw of rawAds) {
      try {
        const adData = parseAdFromFacebook(raw as Record<string, unknown>);

        if (!adData.facebookAdId) continue;

        const existing = await prisma.ad.findUnique({
          where: { facebookAdId: adData.facebookAdId },
          select: { id: true },
        });

        if (existing) {
          await prisma.ad.update({
            where: { id: existing.id },
            data: { status: adData.status, updatedAt: new Date() },
          });
          updatedAds++;
        } else {
          await prisma.ad.create({
            data: {
              facebookAdId: adData.facebookAdId,
              pageName: adData.pageName,
              pageId: adData.pageId,
              pageUrl: adData.pageUrl,
              domain: adData.domain,
              status: adData.status,
              platforms: adData.platforms as never[],
              startDate: adData.startDate,
              endDate: adData.endDate,
              rawData: adData.rawData,
              creatives: { create: adData.creatives as never[] },
              adCountries: { create: adData.countries.map((code) => ({ countryCode: code })) },
              adLanguages: { create: adData.languages.map((code) => ({ languageCode: code })) },
            },
          });

          if (adData.domain) {
            await prisma.domain.upsert({
              where: { domain: adData.domain },
              update: { adsCount: { increment: 1 }, lastSeen: new Date() },
              create: { domain: adData.domain, adsCount: 1 },
            });
          }

          newAds++;
        }

        await job.updateProgress(Math.round(((newAds + updatedAds) / rawAds.length) * 100));
      } catch (err) {
        logger.error('[Mining] Error processing ad:', err);
        errors++;
      }
    }

    await prisma.miningLog.update({
      where: { id: miningLog.id },
      data: {
        status: 'COMPLETED',
        totalAds: rawAds.length,
        processedAds: newAds + updatedAds,
        newAds,
        updatedAds,
        errors,
        progress: 100,
        completedAt: new Date(),
      },
    });

    logger.info(`[Mining] Completed: ${newAds} new, ${updatedAds} updated, ${errors} errors`);
    return { newAds, updatedAds, errors };
  } catch (err) {
    await prisma.miningLog.update({
      where: { id: miningLog.id },
      data: { status: 'FAILED', errorMessage: String(err), completedAt: new Date() },
    });
    throw err;
  }
}

export function startMiningWorker() {
  const worker = new Worker<MiningJobData>('mining', processMiningJob, {
    connection: redisConnection,
    concurrency: parseInt(process.env.MINING_CONCURRENCY ?? '5'),
  });

  worker.on('completed', (job) =>
    logger.info(`[Mining Worker] Job ${job.id} completed`)
  );
  worker.on('failed', (job, err) =>
    logger.error(`[Mining Worker] Job ${job?.id} failed:`, err)
  );

  return worker;
}
