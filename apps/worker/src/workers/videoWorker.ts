import { Worker, Job } from 'bullmq';
import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../lib/prisma';
import { redisConnection } from '../lib/redis';
import { logger } from '../lib/logger';
import type { VideoProcessingJobData } from './types';

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
  ...(process.env.AWS_S3_ENDPOINT ? { endpoint: process.env.AWS_S3_ENDPOINT, forcePathStyle: true } : {}),
});

const BUCKET = process.env.AWS_S3_BUCKET ?? 'adspy-creatives';

async function processVideo(job: Job<VideoProcessingJobData>) {
  const { creativeId, mediaUrl } = job.data;

  logger.info(`[Video Worker] Processing creative ${creativeId}`);

  try {
    const response = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      maxContentLength: 500 * 1024 * 1024,
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'] ?? 'video/mp4';
    const ext = contentType.includes('mp4') ? 'mp4' : 'mp4';
    const date = new Date().toISOString().split('T')[0];
    const s3Key = `videos/${date}/${creativeId}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const s3Url = process.env.AWS_S3_ENDPOINT
      ? `${process.env.AWS_S3_ENDPOINT}/${BUCKET}/${s3Key}`
      : `https://${BUCKET}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com/${s3Key}`;

    await prisma.creative.update({
      where: { id: creativeId },
      data: { s3Key, mediaUrl: s3Url, processed: true },
    });

    logger.info(`[Video Worker] Uploaded ${s3Key}`);
    return { s3Key, s3Url };
  } catch (error) {
    logger.error(`[Video Worker] Failed to process creative ${creativeId}:`, error);
    throw error;
  }
}

export function startVideoProcessingWorker() {
  const worker = new Worker<VideoProcessingJobData>('video-processing', processVideo, {
    connection: redisConnection,
    concurrency: 3,
  });

  worker.on('completed', (job) =>
    logger.info(`[Video Worker] Job ${job.id} completed`)
  );
  worker.on('failed', (job, err) =>
    logger.error(`[Video Worker] Job ${job?.id} failed:`, err)
  );

  return worker;
}
