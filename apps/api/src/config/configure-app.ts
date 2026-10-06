import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { HttpExceptionFilter } from '#app/common/filters/http-exception.filter';
import type { ApiEnvironment } from '#app/config/environment';

export function configureApp(app: NestFastifyApplication): void {
  const config = app.get(ConfigService<ApiEnvironment, true>);
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
