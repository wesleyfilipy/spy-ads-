import { Worker, Job } from 'bullmq';
import axios from 'axios';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../lib/prisma';
import { redisConnection } from '../lib/redis';
import { logger } from '../lib/logger';
import type { ThumbnailJobData } from './types';

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
  ...(process.env.AWS_S3_ENDPOINT ? { endpoint: process.env.AWS_S3_ENDPOINT, forcePathStyle: true } : {}),
});

const BUCKET = process.env.AWS_S3_BUCKET ?? 'adspy-creatives';

async function generateThumbnail(job: Job<ThumbnailJobData>) {
  const { creativeId, videoUrl } = job.data;

  logger.info(`[Thumbnail Worker] Generating thumbnail for ${creativeId}`);

  try {
    // Download thumbnail from video URL (many FB videos have a poster image)
    const thumbnailUrl = videoUrl.replace(/\.mp4.*$/, '_thumbnail.jpg');

    let imageBuffer: Buffer;

    try {
      const response = await axios.get(thumbnailUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
      });
      imageBuffer = Buffer.from(response.data);
    } catch {
      // Fallback: download first frame approximation using original URL
      const response = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: { Range: 'bytes=0-65536' },
      });
      imageBuffer = Buffer.from(response.data);
    }

    // Process with sharp: resize to 640x360, convert to WebP
    const processedBuffer = await sharp(imageBuffer)
      .resize(640, 360, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const date = new Date().toISOString().split('T')[0];
    const s3Key = `thumbnails/${date}/${creativeId}.webp`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: processedBuffer,
        ContentType: 'image/webp',
      })
    );

    const s3Url = process.env.AWS_S3_ENDPOINT
      ? `${process.env.AWS_S3_ENDPOINT}/${BUCKET}/${s3Key}`
      : `https://${BUCKET}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com/${s3Key}`;

    await prisma.creative.update({
      where: { id: creativeId },
      data: { thumbnailS3: s3Key, thumbnailUrl: s3Url },
    });

    // Compute simplified pHash from thumbnail
    const grayscale = await sharp(processedBuffer)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    const avg = grayscale.reduce((sum, val) => sum + val, 0) / grayscale.length;
    const pHash = Array.from(grayscale)
      .map((val) => (val >= avg ? '1' : '0'))
      .join('');

    await prisma.creative.update({ where: { id: creativeId }, data: { pHashValue: pHash } });

    logger.info(`[Thumbnail Worker] Done for ${creativeId}`);
    return { s3Key, pHash };
  } catch (error) {
    logger.error(`[Thumbnail Worker] Failed for ${creativeId}:`, error);
    throw error;
  }
}

export function startThumbnailWorker() {
  const worker = new Worker<ThumbnailJobData>('thumbnails', generateThumbnail, {
    connection: redisConnection,
    concurrency: 5,
  });

  worker.on('completed', (job) =>
    logger.info(`[Thumbnail Worker] Job ${job.id} completed`)
  );
  worker.on('failed', (job, err) =>
    logger.error(`[Thumbnail Worker] Job ${job?.id} failed:`, err)
  );

  return worker;
}
