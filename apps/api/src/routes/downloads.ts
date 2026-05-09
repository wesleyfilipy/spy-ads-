import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireSubscription } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { getPresignedUrl } from '../lib/s3';

const router = Router();

// GET /api/downloads/ad/:id/video — presigned video URL
router.get('/ad/:id/video', authenticate, requireSubscription('BASIC', 'PRO', 'ENTERPRISE'), async (req: Request, res: Response) => {
  const ad = await prisma.ad.findUnique({
    where: { id: req.params.id },
    include: { creatives: { where: { type: 'VIDEO' }, take: 1 } },
  });

  if (!ad) throw new AppError(404, 'Ad not found');
  const creative = ad.creatives[0];
  if (!creative) throw new AppError(404, 'No video found for this ad');

  if (creative.s3Key) {
    const url = await getPresignedUrl(creative.s3Key, 3600);
    return res.json({ success: true, data: { url, filename: `ad_${ad.facebookAdId}.mp4` } });
  }

  if (creative.mediaUrl) {
    return res.json({ success: true, data: { url: creative.mediaUrl, filename: `ad_${ad.facebookAdId}.mp4` } });
  }

  throw new AppError(404, 'Video URL not available');
});

// GET /api/downloads/ads/csv?ids=... — bulk CSV export
router.get('/ads/csv', authenticate, requireSubscription('BASIC', 'PRO', 'ENTERPRISE'), async (req: Request, res: Response) => {
  const idsParam = req.query.ids as string;
  const ids = idsParam?.split(',').filter(Boolean) ?? [];

  if (ids.length === 0) throw new AppError(400, 'No ad IDs provided');
  if (ids.length > 500) throw new AppError(400, 'Max 500 ads per export');

  const ads = await prisma.ad.findMany({
    where: { id: { in: ids } },
    include: {
      creatives: { take: 1 },
      adCountries: true,
    },
  });

  const rows = [
    'Ad ID,Facebook Ad ID,Page Name,Domain,Status,Countries,CTA,Headline,Body,Media URL,Start Date,Is Scaled,Is Duplicate',
    ...ads.map((ad) => {
      const c = ad.creatives[0];
      const countries = ad.adCountries.map((ac) => ac.countryCode).join('|');
      const csvEsc = (s?: string | null) => `"${(s ?? '').replace(/"/g, '""')}"`;
      return [
        ad.id, ad.facebookAdId, csvEsc(ad.pageName), ad.domain ?? '',
        ad.status, countries, csvEsc(c?.callToAction), csvEsc(c?.headline),
        csvEsc(c?.body), c?.mediaUrl ?? '', ad.startDate?.toISOString() ?? '',
        ad.isScaled, ad.isDuplicate,
      ].join(',');
    }),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="adspy_export.csv"');
  res.send(rows);
});

// GET /api/downloads/ads/json?ids=... — JSON export
router.get('/ads/json', authenticate, requireSubscription('PRO', 'ENTERPRISE'), async (req: Request, res: Response) => {
  const idsParam = req.query.ids as string;
  const ids = idsParam?.split(',').filter(Boolean) ?? [];

  if (ids.length === 0) throw new AppError(400, 'No ad IDs provided');
  if (ids.length > 200) throw new AppError(400, 'Max 200 ads per JSON export');

  const ads = await prisma.ad.findMany({
    where: { id: { in: ids } },
    include: { creatives: true, adCountries: true, adLanguages: true },
  });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="adspy_export.json"');
  res.json({ exported_at: new Date().toISOString(), total: ads.length, ads });
});

export default router;
