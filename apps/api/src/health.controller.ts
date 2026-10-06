import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: 'ok'; service: 'orbit-api' } {
    return {
      status: 'ok',
      service: 'orbit-api',
    };
  }
}
