import { Worker, Job } from 'bullmq';
import axios from 'axios';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../lib/prisma';
import { redisConnection } from '../lib/redis';
import { logger } from '../lib/logger';

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
  ...(process.env.AWS_S3_ENDPOINT ? { endpoint: process.env.AWS_S3_ENDPOINT, forcePathStyle: true } : {}),
});
const BUCKET = process.env.AWS_S3_BUCKET ?? 'adspy-creatives';

interface ImageOptimizationJob {
  creativeId: string;
  imageUrl: string;
}

const SIZES = [
  { width: 320, height: 180, suffix: 'sm' },
  { width: 640, height: 360, suffix: 'md' },
  { width: 1280, height: 720, suffix: 'lg' },
];

async function optimizeImage(job: Job<ImageOptimizationJob>) {
  const { creativeId, imageUrl } = job.data;
  logger.info(`[Image Optimizer] Processing ${creativeId}`);

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 20000,
      headers: {
        'User-Agent': 'AdSpy/1.0 (image-optimizer)',
      },
    });

    const originalBuffer = Buffer.from(response.data);
    const date = new Date().toISOString().split('T')[0];

    // Upload original as WebP
    const webpBuffer = await sharp(originalBuffer)
      .webp({ quality: 85 })
      .toBuffer();

    const originalKey = `images/${date}/${creativeId}.webp`;
    await uploadToS3(originalKey, webpBuffer, 'image/webp');

    // Generate responsive sizes
    const thumbnailKeys: Record<string, string> = {};
    for (const size of SIZES) {
      const resized = await sharp(originalBuffer)
        .resize(size.width, size.height, { fit: 'cover', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const key = `images/${date}/${creativeId}_${size.suffix}.webp`;
      await uploadToS3(key, resized, 'image/webp');
      thumbnailKeys[size.suffix] = key;
    }

    // Compute pHash from medium size
    const pHashBuffer = await sharp(originalBuffer)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    const avg = Array.from(pHashBuffer).reduce((s, v) => s + v, 0) / pHashBuffer.length;
    const pHash = Array.from(pHashBuffer).map((v) => (v >= avg ? '1' : '0')).join('');

    await prisma.creative.update({
      where: { id: creativeId },
      data: {
        s3Key: originalKey,
        thumbnailS3: thumbnailKeys['md'],
        thumbnailUrl: buildCdnUrl(thumbnailKeys['md']),
        mediaUrl: buildCdnUrl(originalKey),
        pHashValue: pHash,
        processed: true,
      },
    });

    logger.info(`[Image Optimizer] Done: ${creativeId} — pHash=${pHash.slice(0, 8)}...`);
    return { s3Key: originalKey, thumbnailKeys, pHash };
  } catch (err) {
    logger.error(`[Image Optimizer] Failed for ${creativeId}:`, err);
    throw err;
  }
}

async function uploadToS3(key: string, body: Buffer, contentType: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: { 'x-processed-by': 'adspy-optimizer' },
    })
  );
}

function buildCdnUrl(key: string): string {
  const cdn = process.env.CDN_BASE_URL;
  if (cdn) return `${cdn}/${key}`;
  const region = process.env.AWS_REGION ?? 'us-east-1';
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`;
}

export function startImageOptimizationWorker() {
  const worker = new Worker<ImageOptimizationJob>('image-optimization', optimizeImage, {
    connection: redisConnection,
    concurrency: 8,
  });

  worker.on('completed', (job) =>
    logger.info(`[Image Worker] Job ${job.id} done`)
  );
  worker.on('failed', (job, err) =>
    logger.error(`[Image Worker] Job ${job?.id} failed: ${err.message}`)
  );

  return worker;
}
