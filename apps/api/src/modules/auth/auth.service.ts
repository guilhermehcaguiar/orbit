import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { and, eq, gt, lte } from 'drizzle-orm';
import type { Account } from '@orbit/contracts';
import { DatabaseService } from '#app/database/database.service';
import { ProfilesRepository } from '#app/database/repositories/profiles.repository';
import { accountSessions, credentials } from '#app/database/schema/profiles';
import { forUser, requireDatabase } from '#app/database/user-transaction';

export const sessionSeconds = 7 * 24 * 60 * 60;
const derive = promisify(scrypt);
const dummyHash = `${'0'.repeat(32)}:${'0'.repeat(128)}`;
const tokenDigest = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(private readonly database: DatabaseService, private readonly profiles: ProfilesRepository) {}

  async register(input: { name: string; email: string; password: string }) {
    const database = requireDatabase(this.database);
    const userId = randomUUID();
    const salt = randomBytes(16).toString('hex');
    const passwordHash = `${salt}:${(await derive(input.password, salt, 64) as Buffer).toString('hex')}`;
    try {
      return await forUser(database, userId, async transaction => {
        const { id, email, name } = await this.profiles.create({ id: userId, email: input.email, name: input.name }, transaction);
        await transaction.insert(credentials).values({ userId, passwordHash, email });
        const session = this.newSession(userId);
        await transaction.insert(accountSessions).values(session.record);
        return { token: session.token, account: { id, email, name } };
      });
    } catch (error) {
      const cause = error instanceof Error ? error.cause : undefined;
      if (typeof cause === 'object' && cause && 'code' in cause && cause.code === '23505') {
        throw new ConflictException('Já existe uma conta com este e-mail.');
      }
      throw error;
    }
  }

  async login(input: { email: string; password: string }) {
    const database = requireDatabase(this.database);
    const [credential] = await database.select().from(credentials).where(eq(credentials.email, input.email)).limit(1);
    const [salt, hash] = (credential?.passwordHash ?? dummyHash).split(':') as [string, string];
    const candidate = await derive(input.password, salt, 64) as Buffer;
    if (!timingSafeEqual(candidate, Buffer.from(hash, 'hex')) || !credential) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    const account = await this.profile(credential.userId);
    const session = this.newSession(account.id);
    await database.transaction(async transaction => {
      await transaction.delete(accountSessions).where(and(eq(accountSessions.userId, account.id), lte(accountSessions.expiresAt, new Date())));
      await transaction.insert(accountSessions).values(session.record);
    });
    return { token: session.token, account };
  }

  async authenticate(token: string): Promise<Account> {
    const database = requireDatabase(this.database);
    const [session] = await database.select({ userId: accountSessions.userId }).from(accountSessions)
      .where(and(eq(accountSessions.tokenHash, tokenDigest(token)), gt(accountSessions.expiresAt, new Date()))).limit(1);
    if (!session) throw new UnauthorizedException('Sessão expirada. Entre novamente.');
    return this.profile(session.userId);
  }

  async logout(token: string) {
    await requireDatabase(this.database).delete(accountSessions).where(eq(accountSessions.tokenHash, tokenDigest(token)));
  }

  private async profile(id: string): Promise<Account> {
    const profile = await forUser(requireDatabase(this.database), id, transaction => this.profiles.findById(id, transaction));
    if (!profile) throw new UnauthorizedException();
    return { id: profile.id, email: profile.email, name: profile.name };
  }

  private newSession(userId: string) {
    const token = randomBytes(32).toString('base64url');
    return { token, record: { userId, tokenHash: tokenDigest(token), expiresAt: new Date(Date.now() + sessionSeconds * 1000) } };
  }
}
