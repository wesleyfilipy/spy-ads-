import { Queue } from 'bullmq';
import { redis } from './redis';

const connection = {
  host: new URL(process.env.REDIS_URL ?? 'redis://localhost:6379').hostname,
  port: parseInt(new URL(process.env.REDIS_URL ?? 'redis://localhost:6379').port ?? '6379'),
  password: process.env.REDIS_PASSWORD,
};

export const miningQueue = new Queue('mining', { connection });
export const videoProcessingQueue = new Queue('video-processing', { connection });
export const thumbnailQueue = new Queue('thumbnails', { connection });
export const deduplicationQueue = new Queue('deduplication', { connection });

export type MiningJobData = {
  type: 'FULL_CRAWL' | 'INCREMENTAL' | 'COUNTRY_TARGETED' | 'KEYWORD_TARGETED';
  country?: string;
  keyword?: string;
  limit?: number;
};

export type VideoProcessingJobData = {
  creativeId: string;
  mediaUrl: string;
};

export type ThumbnailJobData = {
  creativeId: string;
  videoUrl: string;
};

export type DeduplicationJobData = {
  adId: string;
  pHashValue: string;
};

export async function addMiningJob(data: MiningJobData, delay = 0) {
  return miningQueue.add('mine', data, {
    delay,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

export async function addVideoProcessingJob(data: VideoProcessingJobData) {
  return videoProcessingQueue.add('process-video', data, {
    attempts: 3,
    backoff: { type: 'fixed', delay: 3000 },
  });
}

export async function addThumbnailJob(data: ThumbnailJobData) {
  return thumbnailQueue.add('capture-thumbnail', data, { attempts: 2 });
}

export async function addDeduplicationJob(data: DeduplicationJobData) {
  return deduplicationQueue.add('deduplicate', data, { attempts: 2 });
}
