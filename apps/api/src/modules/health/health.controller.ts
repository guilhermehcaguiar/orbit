import { RouteConfig } from '@nestjs/platform-fastify';
import { Controller, Get } from '@nestjs/common';
import { HealthService } from '#app/modules/health/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @RouteConfig({ rateLimit: false })
  getHealth(): ReturnType<HealthService['getHealth']> {
    return this.healthService.getHealth();
  }
}
