import { Queue } from 'bullmq';
import { redisConnection } from './lib/redis';
import { logger } from './lib/logger';
import { APP_CONFIG } from '@adspy/config';

const miningQueue = new Queue('mining', { connection: redisConnection });

const MINING_COUNTRIES = ['US', 'BR', 'GB', 'CA', 'AU', 'DE'];

export function scheduleMiningJobs() {
  const intervalMs = parseInt(process.env.MINING_INTERVAL_MS ?? String(APP_CONFIG.mining.intervalMs));

  logger.info(`[Scheduler] Mining interval: ${intervalMs / 60000} minutes`);

  // Initial run after 1 minute
  setTimeout(async () => {
    await triggerMining();
  }, 60 * 1000);

  // Periodic runs
  setInterval(async () => {
    await triggerMining();
  }, intervalMs);
}

async function triggerMining() {
  logger.info('[Scheduler] Triggering scheduled mining jobs');

  // One incremental job
  await miningQueue.add(
    'mine',
    { type: 'INCREMENTAL', limit: 100 },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
  );

  // Country-targeted jobs
  for (const country of MINING_COUNTRIES) {
    await miningQueue.add(
      'mine',
      { type: 'COUNTRY_TARGETED', country, limit: 50 },
      {
        delay: MINING_COUNTRIES.indexOf(country) * 5000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );
  }

  logger.info(`[Scheduler] Queued ${MINING_COUNTRIES.length + 1} mining jobs`);
}
