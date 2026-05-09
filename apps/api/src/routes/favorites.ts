import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { getPrismaSkip, paginate } from '@adspy/utils';

const router = Router();

const addFavoriteSchema = z.object({
  adId: z.string(),
  note: z.string().max(500).optional(),
});

// GET /api/favorites
router.get('/', authenticate, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

  const [total, favorites] = await Promise.all([
    prisma.favorite.count({ where: { userId: req.user!.sub } }),
    prisma.favorite.findMany({
      where: { userId: req.user!.sub },
      include: {
        ad: {
          include: {
            creatives: { take: 1, select: { thumbnailUrl: true, type: true, callToAction: true } },
            adCountries: { select: { countryCode: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: getPrismaSkip(page, limit),
      take: limit,
    }),
  ]);

  res.json({ success: true, data: favorites, meta: paginate(page, limit, total) });
});

// POST /api/favorites
router.post('/', authenticate, validate(addFavoriteSchema), async (req: Request, res: Response) => {
  const { adId, note } = req.body;

  const ad = await prisma.ad.findUnique({ where: { id: adId }, select: { id: true } });
  if (!ad) throw new AppError(404, 'Ad not found');

  const existing = await prisma.favorite.findUnique({
    where: { userId_adId: { userId: req.user!.sub, adId } },
  });
  if (existing) throw new AppError(409, 'Already in favorites');

  const favorite = await prisma.favorite.create({
    data: { userId: req.user!.sub, adId, note },
  });

  res.status(201).json({ success: true, data: favorite });
});

// DELETE /api/favorites/:adId
router.delete('/:adId', authenticate, async (req: Request, res: Response) => {
  const { adId } = req.params;

  const deleted = await prisma.favorite.deleteMany({
    where: { userId: req.user!.sub, adId },
  });

  if (deleted.count === 0) throw new AppError(404, 'Favorite not found');

  res.json({ success: true, message: 'Removed from favorites' });
});

export default router;
