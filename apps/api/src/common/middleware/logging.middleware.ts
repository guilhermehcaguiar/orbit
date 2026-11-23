import { Injectable, NestMiddleware } from '@nestjs/common';
import type { ServerResponse } from 'node:http';
import { LoggerService } from '../../logger/logger.service.js';
import type { NextFunction, RequestWithId } from './request-id.middleware.js';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: RequestWithId, res: ServerResponse, next: NextFunction): void {
    const start = process.hrtime.bigint();
    let logged = false;
    const logRequest = () => {
      if (logged) return;
      logged = true;
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      this.logger.log('HTTP request completed', {
        method: req.method,
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        requestId: req.requestId ?? 'unknown',
      });
    };
    res.once('finish', logRequest);
    res.once('close', logRequest);
    next();
  }
}
