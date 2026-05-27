import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = (
    process.env.CORS_ORIGIN ?? 'http://localhost:8081'
  ).split(',');

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port);

  logger.log(`🚀  REST API    → http://localhost:${port}/api`);
  logger.log(`🔌  WebSocket   → ws://localhost:${port}/orders`);
}

void bootstrap();
