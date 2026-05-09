import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addMiningJob } from '../lib/queues';
import { getPrismaSkip, paginate } from '@adspy/utils';

const router = Router();

router.use(authenticate, requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (_req: Request, res: Response) => {
  const [users, ads, subscriptions, miningLogs] = await Promise.all([
    prisma.user.count(),
    prisma.ad.count(),
    prisma.subscription.groupBy({ by: ['plan'], _count: true }),
    prisma.miningLog.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  const revenue = await prisma.payment.aggregate({
    where: { status: 'SUCCEEDED' },
    _sum: { amount: true },
  });

  res.json({
    success: true,
    data: {
      users,
      ads,
      subscriptions,
      lastMining: miningLogs,
      totalRevenue: revenue._sum.amount ?? 0,
    },
  });
});

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const q = req.query.q as string;

  const where = q
    ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: getPrismaSkip(page, limit),
      take: limit,
    }),
  ]);

  res.json({ success: true, data: users, meta: paginate(page, limit, total) });
});

const updateUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).optional(),
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', validate(updateUserSchema), async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: req.body,
    select: { id: true, email: true, role: true, status: true },
  });

  await prisma.adminLog.create({
    data: {
      adminId: req.user!.sub,
      action: 'UPDATE_USER',
      targetType: 'USER',
      targetId: req.params.id,
      metadata: req.body,
    },
  });

  res.json({ success: true, data: user });
});

// POST /api/admin/mining/trigger
router.post('/mining/trigger', async (req: Request, res: Response) => {
  const { type = 'INCREMENTAL', country, keyword, limit = 100 } = req.body;

  const job = await addMiningJob({ type, country, keyword, limit });

  await prisma.adminLog.create({
    data: {
      adminId: req.user!.sub,
      action: 'TRIGGER_MINING',
      metadata: { jobId: job.id, type, country, keyword },
    },
  });

  res.json({ success: true, data: { jobId: job.id, message: 'Mining job queued' } });
});

// GET /api/admin/ads
router.get('/ads', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

  const [total, ads] = await Promise.all([
    prisma.ad.count(),
    prisma.ad.findMany({
      orderBy: { createdAt: 'desc' },
      skip: getPrismaSkip(page, limit),
      take: limit,
      include: { creatives: { take: 1 } },
    }),
  ]);

  res.json({ success: true, data: ads, meta: paginate(page, limit, total) });
});

// DELETE /api/admin/ads/:id
router.delete('/ads/:id', async (req: Request, res: Response) => {
  await prisma.ad.delete({ where: { id: req.params.id } });

  await prisma.adminLog.create({
    data: {
      adminId: req.user!.sub,
      action: 'DELETE_AD',
      targetType: 'AD',
      targetId: req.params.id,
    },
  });

  res.json({ success: true, message: 'Ad deleted' });
});

export default router;
