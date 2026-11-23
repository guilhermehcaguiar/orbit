import { BadRequestException, Body, ConflictException, Controller, Get, HttpCode, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { loginSchema, registerSchema } from '@orbit/contracts';
import { RouteConfig } from '@nestjs/platform-fastify';
import type { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service.js';
import { SessionGuard, sessionToken, type AccountRequest } from './session.guard.js';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('auth/register')
  @RouteConfig({ rateLimit: { max: 15, timeWindow: '1 minute', allowList: [] } })
  register(@Body() body: unknown) {
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Confira o nome, o e-mail e a senha de pelo menos 8 caracteres.');
    return this.auth.register(parsed.data);
  }

  @Post('auth/login')
  @RouteConfig({ rateLimit: { max: 15, timeWindow: '1 minute', allowList: [] } })
  @HttpCode(200)
  login(@Body() body: unknown) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Confira o e-mail e a senha.');
    return this.auth.login(parsed.data);
  }

  @Post('auth/logout')
  @HttpCode(204)
  async logout(@Req() request: FastifyRequest) {
    const token = sessionToken(request);
    if (!token) return;
    const expected = request.headers['x-orbit-account'];
    if (expected !== undefined && expected !== (await this.auth.authenticate(token)).id) {
      throw new ConflictException('A conta desta aba mudou. Recarregue a página.');
    }
    await this.auth.logout(token);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@Req() request: AccountRequest) {
    if (!request.account) throw new UnauthorizedException();
    return request.account;
  }
}
