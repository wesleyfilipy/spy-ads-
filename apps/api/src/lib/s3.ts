import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger';

const s3Config: ConstructorParameters<typeof S3Client>[0] = {
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
};

// Cloudflare R2 support
if (process.env.AWS_S3_ENDPOINT) {
  s3Config.endpoint = process.env.AWS_S3_ENDPOINT;
  s3Config.forcePathStyle = true;
}

export const s3 = new S3Client(s3Config);
export const BUCKET = process.env.AWS_S3_BUCKET ?? 'adspy-creatives';

export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const endpoint = process.env.AWS_S3_ENDPOINT;
  if (endpoint) {
    return `${endpoint}/${BUCKET}/${key}`;
  }
  return `https://${BUCKET}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com/${key}`;
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function deleteFromS3(key: string): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (error) {
    logger.warn(`Failed to delete S3 object: ${key}`, error);
  }
}

export function buildS3Key(type: 'videos' | 'images' | 'thumbnails', filename: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${type}/${date}/${filename}`;
}
