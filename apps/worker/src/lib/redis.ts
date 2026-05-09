import Redis from 'ioredis';

const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
const parsed = new URL(url);

export const redisConnection = {
  host: parsed.hostname,
  port: parseInt(parsed.port || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};
