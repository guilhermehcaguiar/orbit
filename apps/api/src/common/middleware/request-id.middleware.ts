import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { IncomingMessage, ServerResponse } from 'node:http';

export type RequestWithId = IncomingMessage & { requestId?: string };
export type NextFunction = (err?: unknown) => void;

const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: ServerResponse, next: NextFunction): void {
    const existingId = Object.entries(req.headers)
      .find(([name]) => name.toLowerCase() === REQUEST_ID_HEADER)?.[1];
    const requestId = typeof existingId === 'string' && this.isValidUuid(existingId) ? existingId : uuidv4();

    req.requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }

  private isValidUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
