import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiEnvironment } from '#app/config/environment';

@Injectable()
export class HealthService {
  constructor(private readonly config: ConfigService<ApiEnvironment, true>) {}

  getHealth(): { status: 'ok'; service: 'orbit-api'; environment: ApiEnvironment['NODE_ENV'] } {
    return {
      status: 'ok',
      service: 'orbit-api',
      environment: this.config.get('NODE_ENV', { infer: true }),
    };
  }
}
