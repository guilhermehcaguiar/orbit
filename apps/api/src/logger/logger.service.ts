import { Injectable, Scope } from '@nestjs/common';
import pino, { type Logger as PinoLogger } from 'pino';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private readonly logger: PinoLogger;

  constructor() {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const level = process.env.LOG_LEVEL ?? 'info';

    this.logger = pino({
      level,
      transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        service: 'orbit-api',
      },
    });
  }

  getLogger(): PinoLogger {
    return this.logger;
  }

  child(bindings: Record<string, unknown>): PinoLogger {
    return this.logger.child(bindings);
  }

  log(message: string, context?: Record<string, unknown>): void {
    this.logger.info(context, message);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.logger.error(context, message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(context, message);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(context, message);
  }

  verbose(message: string, context?: Record<string, unknown>): void {
    this.logger.trace(context, message);
  }
}
