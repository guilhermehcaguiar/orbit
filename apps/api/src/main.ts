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

  await configureApp(app);
  app.enableShutdownHooks();
  const config = app.get(ConfigService<ApiEnvironment, true>);
  const host = process.env.ORBIT_API_LOOPBACK === '1' ? '127.0.0.1' : '0.0.0.0';
  await app.listen(config.get('API_PORT', { infer: true }), host);
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
