import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { searchRateLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { searchAds, getSearchSuggestions, getTrendingSearches } from '../services/searchService';
import { prisma } from '../lib/prisma';

const router = Router();

const searchSchema = z.object({
  q: z.string().optional(),
  countries: z.string().optional().transform((s) => s?.split(',').filter(Boolean)),
  languages: z.string().optional().transform((s) => s?.split(',').filter(Boolean)),
  domains: z.string().optional().transform((s) => s?.split(',').filter(Boolean)),
  niches: z.string().optional().transform((s) => s?.split(',').filter(Boolean)),
  callToActions: z.string().optional().transform((s) => s?.split(',').filter(Boolean)),
  platforms: z.string().optional().transform((s) => s?.split(',').filter(Boolean)),
  status: z.enum(['ACTIVE', 'INACTIVE', 'UNKNOWN']).optional(),
  type: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL', 'TEXT']).optional(),
  isScaled: z.string().optional().transform((s) => s === 'true' ? true : s === 'false' ? false : undefined),
  isDuplicate: z.string().optional().transform((s) => s === 'true' ? true : s === 'false' ? false : undefined),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minScore: z.string().optional().transform(Number),
  page: z.string().optional().transform((s) => s ? parseInt(s) : 1),
  limit: z.string().optional().transform((s) => s ? parseInt(s) : 20),
  sortBy: z.enum(['createdAt', 'startDate', 'impressionsLower', 'spendLower', 'score']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// GET /api/search — main search
router.get('/', authenticate, searchRateLimiter, validate(searchSchema, 'query'), async (req: Request, res: Response) => {
  const filters = req.query as z.infer<typeof searchSchema>;

  const results = await searchAds(filters);

  // Save search history
  if (filters.q) {
    prisma.searchHistory.create({
      data: {
        userId: req.user!.sub,
        query: filters.q,
        filters: filters,
        results: results.meta.total,
      },
    }).catch(() => {});
  }

  res.json({ success: true, ...results });
});

// GET /api/search/suggest?q=...
router.get('/suggest', authenticate, async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '');
  const suggestions = await getSearchSuggestions(q, 8);
  res.json({ success: true, data: suggestions });
});

// GET /api/search/trending
router.get('/trending', authenticate, async (_req: Request, res: Response) => {
  const trending = await getTrendingSearches(10);
  res.json({ success: true, data: trending });
});

// GET /api/search/filters/options — for filter dropdowns
router.get('/filters/options', authenticate, async (_req: Request, res: Response) => {
  const [domains, niches, ctas] = await Promise.all([
    prisma.domain.findMany({
      orderBy: { adsCount: 'desc' },
      take: 50,
      select: { domain: true, adsCount: true },
    }),
    prisma.ad.groupBy({
      by: ['niche'],
      where: { niche: { not: null } },
      _count: true,
      orderBy: { _count: { niche: 'desc' } },
      take: 20,
    }),
    prisma.creative.groupBy({
      by: ['callToAction'],
      where: { callToAction: { not: null } },
      _count: true,
      orderBy: { _count: { callToAction: 'desc' } },
      take: 20,
    }),
  ]);

  res.json({
    success: true,
    data: {
      domains: domains.map((d) => ({ value: d.domain, label: d.domain, count: d.adsCount })),
      niches: niches.map((n) => ({ value: n.niche!, label: n.niche!, count: n._count })),
      callToActions: ctas.map((c) => ({ value: c.callToAction!, label: c.callToAction!, count: c._count })),
    },
  });
});

export default router;
