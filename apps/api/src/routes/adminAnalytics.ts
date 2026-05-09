import { Router, Request, Response } from 'express';
import { Queue, QueueEvents } from 'bullmq';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';
import { redis } from '../lib/redis';

const router = Router();
router.use(authenticate, requireAdmin);

const redisConn = {
  host: new URL(process.env.REDIS_URL ?? 'redis://localhost:6379').hostname,
  port: parseInt(new URL(process.env.REDIS_URL ?? 'redis://localhost:6379').port ?? '6379'),
  password: process.env.REDIS_PASSWORD,
};

const miningQueue = new Queue('mining', { connection: redisConn });
const videoQueue = new Queue('video-processing', { connection: redisConn });
const thumbnailQueue = new Queue('thumbnails', { connection: redisConn });
const dedupQueue = new Queue('deduplication', { connection: redisConn });

// GET /api/admin/analytics/overview
router.get('/analytics/overview', async (_req: Request, res: Response) => {
  const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const [
    totalUsers, newUsers7d, totalAds, newAds7d, newAdsToday,
    activeAds, scaledAds, duplicateAds, totalRevenue,
    subscriptionCounts, miningLogs30d,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: last7d } } }),
    prisma.ad.count(),
    prisma.ad.count({ where: { createdAt: { gte: last7d } } }),
    prisma.ad.count({ where: { createdAt: { gte: today } } }),
    prisma.ad.count({ where: { status: 'ACTIVE' } }),
    prisma.ad.count({ where: { isScaled: true } }),
    prisma.ad.count({ where: { isDuplicate: true } }),
    prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true } }),
    prisma.subscription.groupBy({ by: ['plan'], _count: true }),
    prisma.miningLog.findMany({
      where: { createdAt: { gte: last30d }, status: 'COMPLETED' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, newAds: true, processedAds: true, errors: true },
    }),
  ]);

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, new7d: newUsers7d },
      ads: { total: totalAds, new7d: newAds7d, today: newAdsToday, active: activeAds, scaled: scaledAds, duplicates: duplicateAds },
      revenue: { total: totalRevenue._sum.amount ?? 0 },
      subscriptions: subscriptionCounts,
      miningActivity: miningLogs30d,
    },
  });
});

// GET /api/admin/workers/status
router.get('/workers/status', async (_req: Request, res: Response) => {
  const [mining, video, thumbnail, dedup] = await Promise.all([
    getQueueStats(miningQueue),
    getQueueStats(videoQueue),
    getQueueStats(thumbnailQueue),
    getQueueStats(dedupQueue),
  ]);

  res.json({
    success: true,
    data: {
      queues: {
        mining,
        'video-processing': video,
        thumbnails: thumbnail,
        deduplication: dedup,
      },
    },
  });
});

async function getQueueStats(queue: Queue) {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);
  return { name: queue.name, waiting, active, completed, failed, delayed };
}

// GET /api/admin/workers/jobs?queue=mining&status=failed
router.get('/workers/jobs', async (req: Request, res: Response) => {
  const queueName = String(req.query.queue ?? 'mining');
  const status = String(req.query.status ?? 'failed') as 'waiting' | 'active' | 'completed' | 'failed';
  const limit = parseInt(req.query.limit as string) || 20;

  const queues: Record<string, Queue> = {
    mining: miningQueue,
    'video-processing': videoQueue,
    thumbnails: thumbnailQueue,
    deduplication: dedupQueue,
  };

  const queue = queues[queueName];
  if (!queue) return res.status(400).json({ success: false, error: 'Unknown queue' });

  const jobs = await queue.getJobs([status], 0, limit - 1);

  const formatted = jobs.map((job) => ({
    id: job.id,
    name: job.name,
    data: job.data,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  }));

  res.json({ success: true, data: formatted });
});

// POST /api/admin/workers/retry
router.post('/workers/retry', async (req: Request, res: Response) => {
  const { queueName, jobId } = req.body;
  const queues: Record<string, Queue> = {
    mining: miningQueue,
    'video-processing': videoQueue,
  };
  const queue = queues[queueName];
  if (!queue) return res.status(400).json({ success: false, error: 'Unknown queue' });

  const job = await queue.getJob(jobId);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

  await job.retry();
  res.json({ success: true, message: 'Job queued for retry' });
});

// GET /api/admin/users/:id/details
router.get('/users/:id/details', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      subscription: true,
      _count: { select: { favorites: true, searchHistory: true } },
      payments: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
});

// POST /api/admin/users/:id/ban
router.post('/users/:id/ban', async (req: Request, res: Response) => {
  const { reason } = req.body;

  await prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'SUSPENDED' },
  });

  // Revoke all tokens
  await prisma.refreshToken.updateMany({
    where: { userId: req.params.id },
    data: { revokedAt: new Date() },
  });

  await prisma.adminLog.create({
    data: {
      adminId: req.user!.sub,
      action: 'BAN_USER',
      targetType: 'USER',
      targetId: req.params.id,
      metadata: { reason },
    },
  });

  res.json({ success: true, message: 'User suspended' });
});

// GET /api/admin/payments
router.get('/payments', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

  const [total, payments] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({ success: true, data: payments, meta: { total, page, limit } });
});

export default router;
