import { Catch, HttpException, HttpStatus, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { STATUS_CODES } from 'node:http';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.adapterHost;
    const context = host.switchToHttp();
    const statusCode = exception instanceof HttpException
      ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const error = STATUS_CODES[statusCode] ?? 'Error';
    let message: string | string[] = error;

    if (exception instanceof HttpException && statusCode < 500) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if ('message' in response) {
        const detail: unknown = response.message;
        if (typeof detail === 'string' ||
          (Array.isArray(detail) && detail.every((item: unknown) => typeof item === 'string'))) {
          message = detail;
        }
      }
    }

    if (statusCode >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : 'Unhandled server error');
    }

    httpAdapter.reply(context.getResponse(), {
      statusCode,
      error,
      message,
      path: httpAdapter.getRequestUrl(context.getRequest()),
      timestamp: new Date().toISOString(),
    }, statusCode);
  }
}
