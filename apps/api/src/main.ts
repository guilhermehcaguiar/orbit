import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '#app/app.module';
import { ConfigService } from '@nestjs/config';
import { configureApp } from '#app/config/configure-app';
import type { ApiEnvironment } from '#app/config/environment';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  configureApp(app);
  app.enableShutdownHooks();
  const config = app.get(ConfigService<ApiEnvironment, true>);
  await app.listen(config.get('API_PORT', { infer: true }), '0.0.0.0');
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
