import { Module } from '@nestjs/common';
import { HealthController } from '#app/health.controller';

@Module({
  controllers: [HealthController],
})
export class AppModule {}
