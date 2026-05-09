import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet } from '../lib/redis';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { searchRateLimiter } from '../middleware/rateLimiter';
import { AppError } from '../middleware/errorHandler';
import { getPrismaSkip, paginate } from '@adspy/utils';

const router = Router();

const searchSchema = z.object({
  q: z.string().optional(),
  countries: z.string().optional(),
  languages: z.string().optional(),
  domains: z.string().optional(),
  niches: z.string().optional(),
  callToActions: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'UNKNOWN']).optional(),
  type: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL', 'TEXT']).optional(),
  isScaled: z.string().optional(),
  isDuplicate: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  sortBy: z.enum(['createdAt', 'startDate', 'impressionsLower', 'spendLower']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// GET /api/ads — search ads
router.get('/', authenticate, searchRateLimiter, validate(searchSchema, 'query'), async (req: Request, res: Response) => {
  const {
    q,
    countries,
    languages,
    domains,
    niches,
    callToActions,
    status,
    type,
    isScaled,
    isDuplicate,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query as z.infer<typeof searchSchema>;

  const cacheKey = `ads:search:${JSON.stringify(req.query)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return res.json({ success: true, ...cached });
  }

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { pageName: { contains: q, mode: 'insensitive' } },
      { domain: { contains: q, mode: 'insensitive' } },
      { creatives: { some: { body: { contains: q, mode: 'insensitive' } } } },
      { creatives: { some: { headline: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  if (status) where.status = status;
  if (isScaled !== undefined) where.isScaled = isScaled === 'true';
  if (isDuplicate !== undefined) where.isDuplicate = isDuplicate === 'true';
  if (niches) where.niche = { in: niches.split(',') };

  if (countries) {
    where.adCountries = { some: { countryCode: { in: countries.split(',') } } };
  }
  if (languages) {
    where.adLanguages = { some: { languageCode: { in: languages.split(',') } } };
  }
  if (domains) {
    where.domain = { in: domains.split(',') };
  }
  if (callToActions) {
    where.creatives = { some: { callToAction: { in: callToActions.split(',') } } };
  }
  if (dateFrom || dateTo) {
    where.startDate = {};
    if (dateFrom) (where.startDate as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.startDate as Record<string, unknown>).lte = new Date(dateTo);
  }

  const safeLimit = Math.min(100, Math.max(1, limit || 20));
  const safePage = Math.max(1, page || 1);

  const [total, ads] = await Promise.all([
    prisma.ad.count({ where }),
    prisma.ad.findMany({
      where,
      include: {
        creatives: {
          take: 3,
          select: {
            id: true,
            type: true,
            thumbnailUrl: true,
            headline: true,
            body: true,
            callToAction: true,
            mediaUrl: true,
          },
        },
        adCountries: { select: { countryCode: true } },
        adLanguages: { select: { languageCode: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: getPrismaSkip(safePage, safeLimit),
      take: safeLimit,
    }),
  ]);

  const meta = paginate(safePage, safeLimit, total);
  const result = { data: ads, meta };

  await cacheSet(cacheKey, result, 60);
  res.json({ success: true, ...result });
});

// GET /api/ads/:id — get single ad
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  const cacheKey = `ads:${id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json({ success: true, data: cached });

  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      creatives: true,
      adCountries: { include: { country: true } },
      adLanguages: { include: { language: true } },
    },
  });

  if (!ad) throw new AppError(404, 'Ad not found');

  // Related ads (same domain or duplicate group)
  const related = await prisma.ad.findMany({
    where: {
      OR: [
        { domain: ad.domain ?? undefined, id: { not: id } },
        { duplicateGroupId: ad.duplicateGroupId ?? undefined, id: { not: id } },
      ],
    },
    include: {
      creatives: { take: 1, select: { thumbnailUrl: true, type: true } },
    },
    take: 12,
    orderBy: { createdAt: 'desc' },
  });

  const result = { ...ad, related };
  await cacheSet(cacheKey, result, 120);

  res.json({ success: true, data: result });
});

// GET /api/ads/stats/overview
router.get('/stats/overview', authenticate, async (_req: Request, res: Response) => {
  const cacheKey = 'ads:stats:overview';
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json({ success: true, data: cached });

  const [total, active, scaled, duplicates, todayNew] = await Promise.all([
    prisma.ad.count(),
    prisma.ad.count({ where: { status: 'ACTIVE' } }),
    prisma.ad.count({ where: { isScaled: true } }),
    prisma.ad.count({ where: { isDuplicate: true } }),
    prisma.ad.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
  ]);

  const lastMining = await prisma.miningLog.findFirst({
    where: { status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true },
  });

  const stats = { total, active, scaled, duplicates, todayNew, lastMiningAt: lastMining?.completedAt };
  await cacheSet(cacheKey, stats, 300);

  res.json({ success: true, data: stats });
});

export default router;
