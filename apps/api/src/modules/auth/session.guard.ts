import { ConflictException, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Account } from '@orbit/contracts';
import type { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service.js';

export type AccountRequest = FastifyRequest & { account: Account };

export function sessionToken(request: FastifyRequest) {
  return /^Bearer ([\w-]{43})$/i.exec(request.headers.authorization ?? '')?.[1];
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AccountRequest>();
    const token = sessionToken(request);
    if (!token) throw new UnauthorizedException('Entre na sua conta.');
    request.account = await this.auth.authenticate(token);
    const expected = request.headers['x-orbit-account'];
    if (expected !== undefined && expected !== request.account.id) {
      throw new ConflictException('A conta desta aba mudou. Recarregue a página.');
    }
    return true;
  }
}
