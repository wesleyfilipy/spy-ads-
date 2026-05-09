import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet } from '../lib/redis';
import { getPrismaSkip, paginate } from '@adspy/utils';

export interface SearchFilters {
  q?: string;
  countries?: string[];
  languages?: string[];
  domains?: string[];
  niches?: string[];
  callToActions?: string[];
  platforms?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
  type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'TEXT';
  isScaled?: boolean;
  isDuplicate?: boolean;
  isWinner?: boolean;
  dateFrom?: string;
  dateTo?: string;
  minScore?: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'startDate' | 'impressionsLower' | 'spendLower' | 'score';
  sortOrder?: 'asc' | 'desc';
}

export async function searchAds(filters: SearchFilters) {
  const {
    q, countries, languages, domains, niches, callToActions, platforms,
    status, type, isScaled, isDuplicate, dateFrom, dateTo,
    page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc',
  } = filters;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));

  const cacheKey = `search:${JSON.stringify({ ...filters, page: safePage, limit: safeLimit })}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  // Build Prisma where clause
  const where: Record<string, unknown> = {};
  const ANDs: Record<string, unknown>[] = [];

  if (status) where.status = status;
  if (isScaled !== undefined) where.isScaled = isScaled;
  if (isDuplicate !== undefined) where.isDuplicate = isDuplicate;
  if (niches?.length) where.niche = { in: niches };
  if (domains?.length) where.domain = { in: domains };

  // Full-text search across multiple fields
  if (q && q.trim()) {
    const terms = q.trim().split(/\s+/).filter(Boolean);
    ANDs.push({
      OR: terms.flatMap((term) => [
        { pageName: { contains: term, mode: 'insensitive' } },
        { domain: { contains: term, mode: 'insensitive' } },
        {
          creatives: {
            some: {
              OR: [
                { body: { contains: term, mode: 'insensitive' } },
                { headline: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
              ],
            },
          },
        },
      ]),
    });
  }

  if (countries?.length) {
    ANDs.push({ adCountries: { some: { countryCode: { in: countries } } } });
  }
  if (languages?.length) {
    ANDs.push({ adLanguages: { some: { languageCode: { in: languages } } } });
  }
  if (callToActions?.length) {
    ANDs.push({ creatives: { some: { callToAction: { in: callToActions } } } });
  }
  if (platforms?.length) {
    ANDs.push({ platforms: { hasSome: platforms } });
  }
  if (type) {
    ANDs.push({ creatives: { some: { type } } });
  }
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, unknown> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    ANDs.push({ startDate: dateFilter });
  }

  if (ANDs.length > 0) where.AND = ANDs;

  const orderBy: Record<string, string> =
    sortBy === 'score'
      ? { createdAt: sortOrder }
      : { [sortBy]: sortOrder };

  const [total, ads] = await Promise.all([
    prisma.ad.count({ where }),
    prisma.ad.findMany({
      where,
      include: {
        creatives: {
          take: 3,
          orderBy: { createdAt: 'asc' },
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
      orderBy,
      skip: getPrismaSkip(safePage, safeLimit),
      take: safeLimit,
    }),
  ]);

  const result = {
    data: ads,
    meta: paginate(safePage, safeLimit, total),
  };

  await cacheSet(cacheKey, result, 90);
  return result;
}

export async function getSearchSuggestions(q: string, limit = 8): Promise<string[]> {
  if (!q || q.length < 2) return [];

  const cacheKey = `suggest:${q.toLowerCase()}`;
  const cached = await cacheGet<string[]>(cacheKey);
  if (cached) return cached;

  const [pages, domains] = await Promise.all([
    prisma.ad.findMany({
      where: { pageName: { contains: q, mode: 'insensitive' }, pageName: { not: null } },
      select: { pageName: true },
      distinct: ['pageName'],
      take: Math.ceil(limit / 2),
    }),
    prisma.domain.findMany({
      where: { domain: { contains: q, mode: 'insensitive' } },
      select: { domain: true },
      orderBy: { adsCount: 'desc' },
      take: Math.floor(limit / 2),
    }),
  ]);

  const suggestions = [
    ...pages.map((p) => p.pageName!).filter(Boolean),
    ...domains.map((d) => d.domain),
  ].slice(0, limit);

  await cacheSet(cacheKey, suggestions, 300);
  return suggestions;
}

export async function getTrendingSearches(limit = 10): Promise<Array<{ query: string; count: number }>> {
  const cacheKey = `trending:searches`;
  const cached = await cacheGet<Array<{ query: string; count: number }>>(cacheKey);
  if (cached) return cached;

  const results = await prisma.searchHistory.groupBy({
    by: ['query'],
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: limit,
    where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });

  const trending = results.map((r) => ({ query: r.query, count: r._count.query }));
  await cacheSet(cacheKey, trending, 300);
  return trending;
}
