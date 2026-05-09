import { Worker, Job } from 'bullmq';
import { prisma } from '../lib/prisma';
import { redisConnection } from '../lib/redis';
import { logger } from '../lib/logger';
import { calculateSimilarityScore, isLikelySameAd, isLikelyScaled } from '@adspy/utils';
import type { DeduplicationJobData } from './types';
import { v4 as uuidv4 } from 'uuid';

async function deduplicateAd(job: Job<DeduplicationJobData>) {
  const { adId, pHashValue } = job.data;

  logger.info(`[Dedup Worker] Processing ad ${adId}`);

  // Fetch recent ads with pHash values (within last 30 days for performance)
  const recentAds = await prisma.ad.findMany({
    where: {
      pHashValue: { not: null },
      id: { not: adId },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, pHashValue: true, duplicateGroupId: true, domain: true },
    take: 500,
  });

  const currentAd = await prisma.ad.findUnique({
    where: { id: adId },
    select: { id: true, pHashValue: true, duplicateGroupId: true, domain: true },
  });

  if (!currentAd) return;

  let highestScore = 0;
  let mostSimilarAd: typeof recentAds[0] | null = null;

  for (const other of recentAds) {
    if (!other.pHashValue || !pHashValue) continue;
    const score = calculateSimilarityScore(pHashValue, other.pHashValue);
    if (score > highestScore) {
      highestScore = score;
      mostSimilarAd = other;
    }
  }

  const updates: {
    isDuplicate?: boolean;
    isScaled?: boolean;
    duplicateGroupId?: string;
    duplicateScore?: number;
    pHashValue?: string;
  } = { pHashValue };

  if (mostSimilarAd && highestScore > 0) {
    if (isLikelySameAd(pHashValue, mostSimilarAd.pHashValue!)) {
      updates.isDuplicate = true;
      updates.duplicateScore = highestScore;
      updates.duplicateGroupId = mostSimilarAd.duplicateGroupId ?? uuidv4();

      // Also update the matching ad's group ID if not set
      if (!mostSimilarAd.duplicateGroupId) {
        await prisma.ad.update({
          where: { id: mostSimilarAd.id },
          data: { duplicateGroupId: updates.duplicateGroupId, isDuplicate: true },
        });
      }
    } else if (isLikelyScaled(pHashValue, mostSimilarAd.pHashValue!)) {
      updates.isScaled = true;
      updates.duplicateScore = highestScore;
      updates.duplicateGroupId = mostSimilarAd.duplicateGroupId ?? `scaled_${uuidv4()}`;
    }
  }

  await prisma.ad.update({ where: { id: adId }, data: updates });

  logger.info(
    `[Dedup Worker] Ad ${adId}: score=${highestScore}, isDuplicate=${updates.isDuplicate}, isScaled=${updates.isScaled}`
  );

  return updates;
}

export function startDeduplicationWorker() {
  const worker = new Worker<DeduplicationJobData>('deduplication', deduplicateAd, {
    connection: redisConnection,
    concurrency: 10,
  });

  worker.on('completed', (job) =>
    logger.info(`[Dedup Worker] Job ${job.id} completed`)
  );
  worker.on('failed', (job, err) =>
    logger.error(`[Dedup Worker] Job ${job?.id} failed:`, err)
  );

  return worker;
}
