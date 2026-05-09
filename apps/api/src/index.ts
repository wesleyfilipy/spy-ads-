import 'dotenv/config';
import app from './app';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';

const PORT = process.env.PORT ?? 4000;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    await redis.ping();
    logger.info('✅ Redis connected');

    app.listen(PORT, () => {
      logger.info(`🚀 API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Startup failed', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

bootstrap();
