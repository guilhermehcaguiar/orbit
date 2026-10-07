import { Injectable, NestMiddleware } from '@nestjs/common';
import type { ServerResponse } from 'node:http';
import { LoggerService } from '../../logger/logger.service.js';
import type { NextFunction, RequestWithId } from './request-id.middleware.js';

const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-csrf-token',
  'x-xsrf-token',
]);

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: RequestWithId, res: ServerResponse, next: NextFunction): void {
    const startTime = process.hrtime.bigint();
    const requestId = req.requestId ?? 'unknown';

    let logged = false;
    const logRequest = () => {
      if (logged) return;
      logged = true;
      const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
      const sanitizedHeaders = this.sanitizeHeaders(req.headers);

      this.logger.log(
        `${req.method} ${req.url} ${res.statusCode}`,
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
          requestId,
          headers: sanitizedHeaders,
          ip: req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      );
    };

    res.on('finish', logRequest);
    res.on('close', logRequest);

    next();
  }

  private sanitizeHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (Array.isArray(value)) {
        sanitized[key] = value.join(', ');
      } else if (typeof value === 'string') {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
