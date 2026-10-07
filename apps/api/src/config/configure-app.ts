import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { HttpExceptionFilter } from '#app/common/filters/http-exception.filter';
import type { ApiEnvironment } from '#app/config/environment';

export async function configureApp(app: NestFastifyApplication): Promise<void> {
  const config = app.get(ConfigService<ApiEnvironment, true>);

  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: config.get('NODE_ENV') === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: config.get('NODE_ENV') === 'production',
  });

  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', '::1'],
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors({ origin: config.get('FRONTEND_URL', { infer: true }) });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  app.useGlobalFilters(new HttpExceptionFilter(app.get(HttpAdapterHost)));
}
