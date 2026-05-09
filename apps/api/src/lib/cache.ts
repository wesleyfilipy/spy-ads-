import { redis } from './redis';
import { logger } from './logger';

/**
 * Cache-aside helper with automatic serialization and TTL.
 * Falls back to `fetcher()` on cache miss.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    logger.warn(`[Cache] Redis read failed for ${key}:`, err);
  }

  const data = await fetcher();

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn(`[Cache] Redis write failed for ${key}:`, err);
  }

  return data;
}

/**
 * Invalidate all keys matching a pattern.
 */
export async function invalidatePattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    const deleted = await redis.del(...keys);
    logger.debug(`[Cache] Invalidated ${deleted} keys matching: ${pattern}`);
    return deleted;
  } catch (err) {
    logger.warn('[Cache] Invalidation failed:', err);
    return 0;
  }
}

/**
 * Tag-based cache invalidation.
 * Stores a set of keys under a tag, so all tagged keys can be cleared at once.
 */
export async function setCacheWithTag(
  key: string,
  value: unknown,
  tags: string[],
  ttlSeconds = 300
): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  for (const tag of tags) {
    pipeline.sadd(`tag:${tag}`, key);
    pipeline.expire(`tag:${tag}`, ttlSeconds + 60);
  }
  await pipeline.exec();
}

export async function invalidateTag(tag: string): Promise<void> {
  const keys = await redis.smembers(`tag:${tag}`);
  if (keys.length > 0) {
    await redis.del(...keys, `tag:${tag}`);
    logger.debug(`[Cache] Tag "${tag}" invalidated: ${keys.length} keys`);
  }
}

/**
 * Distributed lock for preventing duplicate work (e.g. mining the same keyword twice).
 */
export async function acquireLock(
  resource: string,
  ttlSeconds = 60
): Promise<boolean> {
  const key = `lock:${resource}`;
  const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
  return result === 'OK';
}

export async function releaseLock(resource: string): Promise<void> {
  await redis.del(`lock:${resource}`);
}

/**
 * Sliding window counter for analytics.
 */
export async function incrementCounter(
  metric: string,
  windowSeconds = 86400
): Promise<number> {
  const key = `counter:${metric}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds * 2);
  return count;
}

/**
 * CDN URL helper — prepends CDN base URL to S3 keys.
 */
export function toCdnUrl(s3Key: string | null | undefined): string | null {
  if (!s3Key) return null;
  const cdn = process.env.CDN_BASE_URL;
  if (cdn) return `${cdn}/${s3Key}`;
  const bucket = process.env.AWS_S3_BUCKET ?? 'adspy-creatives';
  const region = process.env.AWS_REGION ?? 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
}

/**
 * Build cache-control headers for CDN caching.
 */
export function getCacheControlHeader(ttlSeconds: number): string {
  return `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`;
}
