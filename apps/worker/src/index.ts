import 'dotenv/config';
import { logger } from './lib/logger';
import { startMiningWorker } from './workers/miningWorker';
import { startVideoProcessingWorker } from './workers/videoWorker';
import { startThumbnailWorker } from './workers/thumbnailWorker';
import { startDeduplicationWorker } from './workers/deduplicationWorker';
import { scheduleMiningJobs } from './scheduler';

async function bootstrap() {
  logger.info('🚀 Worker service starting...');

  const miningWorker = startMiningWorker();
  const videoWorker = startVideoProcessingWorker();
  const thumbnailWorker = startThumbnailWorker();
  const dedupWorker = startDeduplicationWorker();

  // Schedule periodic mining
  scheduleMiningJobs();

  logger.info('✅ All workers running');
  logger.info('   → Mining worker');
  logger.info('   → Video processing worker');
  logger.info('   → Thumbnail worker');
  logger.info('   → Deduplication worker');

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received — closing workers');
    await Promise.all([
      miningWorker.close(),
      videoWorker.close(),
      thumbnailWorker.close(),
      dedupWorker.close(),
    ]);
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  logger.error('Worker bootstrap failed:', err);
  process.exit(1);
});
