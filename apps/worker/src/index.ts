import 'dotenv/config';
import { logger } from './lib/logger';
import { startAdvancedMiningWorker } from './workers/advancedMiningWorker';
import { startVideoProcessingWorker } from './workers/videoWorker';
import { startThumbnailWorker } from './workers/thumbnailWorker';
import { startDeduplicationWorker } from './workers/deduplicationWorker';
import { startImageOptimizationWorker } from './workers/imageOptimizationWorker';
import { scheduleBulkMining } from './workers/advancedMiningWorker';
import { Queue } from 'bullmq';
import { redisConnection } from './lib/redis';
import { prisma } from './lib/prisma';
import { scoreAllUnscoredAds } from './services/adScoring';

const miningQueue = new Queue('mining', { connection: redisConnection });

const MINING_INTERVAL_MS = parseInt(process.env.MINING_INTERVAL_MS ?? '300000');

async function bootstrap() {
  logger.info('🚀 AdSpy Worker Service starting...');

  await prisma.$connect();
  logger.info('✅ Database connected');

  const workers = [
    { name: 'Mining', worker: startAdvancedMiningWorker() },
    { name: 'Video Processing', worker: startVideoProcessingWorker() },
    { name: 'Thumbnails', worker: startThumbnailWorker() },
    { name: 'Deduplication', worker: startDeduplicationWorker() },
    { name: 'Image Optimization', worker: startImageOptimizationWorker() },
  ];

  logger.info('✅ All workers started:');
  workers.forEach(({ name }) => logger.info(`   → ${name}`));

  // Score unscored ads on startup (background)
  setTimeout(() => {
    scoreAllUnscoredAds(200).catch((err) =>
      logger.warn('[Bootstrap] Scoring failed:', err)
    );
  }, 30000);

  // Initial mining job (delayed 1 min after startup)
  setTimeout(async () => {
    logger.info('[Scheduler] Triggering initial mining run...');
    await scheduleBulkMining(miningQueue);
  }, 60 * 1000);

  // Periodic bulk mining
  setInterval(async () => {
    logger.info('[Scheduler] Periodic mining triggered');
    await scheduleBulkMining(miningQueue);
  }, MINING_INTERVAL_MS);

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received — shutting down gracefully');
    await Promise.all(workers.map(({ worker }) => worker.close()));
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received — shutting down');
    await Promise.all(workers.map(({ worker }) => worker.close()));
    await prisma.$disconnect();
    process.exit(0);
  });

  logger.info(`🕐 Mining interval: ${MINING_INTERVAL_MS / 60000} min`);
  logger.info('⚡ Worker service ready');
}

bootstrap().catch((err) => {
  logger.error('Worker bootstrap failed:', err);
  process.exit(1);
});
