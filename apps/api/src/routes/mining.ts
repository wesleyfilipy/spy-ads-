import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { miningRateLimiter } from '../middleware/rateLimiter';
import { addDeduplicationJob, addThumbnailJob, addVideoProcessingJob } from '../lib/queues';
import { AppError } from '../middleware/errorHandler';
import { extractDomain } from '@adspy/utils';
import type { ExtensionAdPayload } from '@adspy/types';

const router = Router();

const submitAdsSchema = z.object({
  ads: z
    .array(
      z.object({
        facebookAdId: z.string(),
        pageName: z.string().optional(),
        pageId: z.string().optional(),
        pageUrl: z.string().optional(),
        domain: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'UNKNOWN']).default('UNKNOWN'),
        platforms: z.array(z.string()).default([]),
        countries: z.array(z.string()).default([]),
        languages: z.array(z.string()).default([]),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        creatives: z.array(
          z.object({
            type: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL', 'TEXT']).default('IMAGE'),
            mediaUrl: z.string().optional(),
            thumbnailUrl: z.string().optional(),
            headline: z.string().optional(),
            body: z.string().optional(),
            description: z.string().optional(),
            callToAction: z.string().optional(),
            linkUrl: z.string().optional(),
            displayUrl: z.string().optional(),
          })
        ),
        rawData: z.record(z.unknown()).optional(),
      })
    )
    .min(1)
    .max(100),
});

// POST /api/mining/submit — extension submits collected ads
router.post(
  '/submit',
  authenticate,
  miningRateLimiter,
  validate(submitAdsSchema),
  async (req: Request, res: Response) => {
    const { ads } = req.body as { ads: ExtensionAdPayload[] };
    let newAds = 0;
    let updatedAds = 0;

    for (const adData of ads) {
      const domain =
        adData.domain ??
        (adData.creatives[0]?.linkUrl ? extractDomain(adData.creatives[0].linkUrl) : null) ??
        undefined;

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
        continue;
      }

      const ad = await prisma.ad.create({
        data: {
          facebookAdId: adData.facebookAdId,
          pageName: adData.pageName,
          pageId: adData.pageId,
          pageUrl: adData.pageUrl,
          domain,
          status: adData.status,
          platforms: adData.platforms as never[],
          startDate: adData.startDate ? new Date(adData.startDate) : undefined,
          endDate: adData.endDate ? new Date(adData.endDate) : undefined,
          rawData: adData.rawData,
          creatives: {
            create: adData.creatives.map((c) => ({
              type: c.type,
              mediaUrl: c.mediaUrl,
              thumbnailUrl: c.thumbnailUrl,
              headline: c.headline,
              body: c.body,
              description: c.description,
              callToAction: c.callToAction,
              linkUrl: c.linkUrl,
              displayUrl: c.displayUrl,
            })),
          },
          adCountries: {
            create: adData.countries.map((code) => ({ countryCode: code })),
          },
          adLanguages: {
            create: adData.languages.map((code) => ({ languageCode: code })),
          },
        },
        include: { creatives: true },
      });

      // Queue background processing
      for (const creative of ad.creatives) {
        if (creative.type === 'VIDEO' && creative.mediaUrl) {
          await addVideoProcessingJob({ creativeId: creative.id, mediaUrl: creative.mediaUrl });
          if (creative.mediaUrl) {
            await addThumbnailJob({ creativeId: creative.id, videoUrl: creative.mediaUrl });
          }
        }
        if (creative.pHashValue) {
          await addDeduplicationJob({ adId: ad.id, pHashValue: creative.pHashValue });
        }
      }

      // Update domain stats
      if (domain) {
        await prisma.domain.upsert({
          where: { domain },
          update: {
            adsCount: { increment: 1 },
            activeAds: adData.status === 'ACTIVE' ? { increment: 1 } : undefined,
            lastSeen: new Date(),
          },
          create: {
            domain,
            adsCount: 1,
            activeAds: adData.status === 'ACTIVE' ? 1 : 0,
          },
        });
      }

      newAds++;
    }

    // Log mining activity
    await prisma.miningLog.create({
      data: {
        type: 'EXTENSION_SUBMIT',
        status: 'COMPLETED',
        totalAds: ads.length,
        processedAds: ads.length,
        newAds,
        updatedAds,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    res.json({ success: true, data: { newAds, updatedAds, total: ads.length } });
  }
);

// GET /api/mining/logs
router.get('/logs', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const logs = await prisma.miningLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: logs });
});

// GET /api/mining/stats
router.get('/stats', authenticate, async (_req: Request, res: Response) => {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const logs = await prisma.miningLog.findMany({
    where: { createdAt: { gte: last30Days }, status: 'COMPLETED' },
    orderBy: { createdAt: 'asc' },
  });

  const totals = logs.reduce(
    (acc, log) => ({
      totalAds: acc.totalAds + log.totalAds,
      newAds: acc.newAds + log.newAds,
      updatedAds: acc.updatedAds + log.updatedAds,
    }),
    { totalAds: 0, newAds: 0, updatedAds: 0 }
  );

  res.json({ success: true, data: { logs, totals } });
});

export default router;
