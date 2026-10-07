import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiEnvironment } from '#app/config/environment';
import { DatabaseService } from '#app/database/database.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly config: ConfigService<ApiEnvironment, true>,
    private readonly database: DatabaseService,
  ) {}

  getHealth(): {
    status: 'ok';
    service: 'orbit-api';
    environment: ApiEnvironment['NODE_ENV'];
    database?: 'up' | 'down';
  } {
    const health: {
      status: 'ok';
      service: 'orbit-api';
      environment: ApiEnvironment['NODE_ENV'];
      database?: 'up' | 'down';
    } = {
      status: 'ok',
      service: 'orbit-api',
      environment: this.config.get('NODE_ENV', { infer: true }),
    };

    if (this.database.getDatabase()) {
      health.database = this.database.isConnected() ? 'up' : 'down';
    }

    return health;
  }
}
