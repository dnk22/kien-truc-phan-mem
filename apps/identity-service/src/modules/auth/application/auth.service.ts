import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { jwtSettings, signAccessToken } from '@minimart/auth';
import {
  USER_REPOSITORY,
  type UserRepository,
  type IdentityUser,
} from '../../users/domain/user.repository';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../sessions/domain/session.repository';
import { userProfile } from '../../users/application/user.mapper';
const DUMMY_HASH =
  '$2b$12$H8FIzNxpqQGdiWjRpnjf3eXBDp1ERkZaCK5LEbU7LMrZ1xV0ZxN4e';
export function hashRefresh(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
export function sessionLifetime() {
  const days = Number(process.env.REFRESH_TTL_DAYS ?? 7);
  if (!Number.isInteger(days) || days < 1 || days > 30)
    throw new Error('Invalid REFRESH_TTL_DAYS');
  return days * 86400;
}
function denied() {
  return new UnauthorizedException({
    code: 'INVALID_CREDENTIALS',
    message: 'Thông tin đăng nhập không hợp lệ hoặc tài khoản đã bị khóa.',
  });
}
@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
  ) {}
  private next() {
    const token = randomBytes(48).toString('base64url');
    return {
      token,
      session: {
        id: randomUUID(),
        familyId: randomUUID(),
        tokenHash: hashRefresh(token),
        expiresAt: new Date(Date.now() + sessionLifetime() * 1000),
      },
    };
  }
  private result(user: IdentityUser, sid: string, refreshToken: string) {
    return {
      data: {
        accessToken: signAccessToken({
          sub: user.id,
          role: user.role,
          sid,
          version: user.tokenVersion,
        }),
        expiresIn: jwtSettings().ttl,
        user: userProfile(user),
      },
      refreshToken,
    };
  }
  async login(username: string, password: string) {
    const user = await this.users.findByUsername(username);
    const valid = await compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid || user.status !== 'ACTIVE') throw denied();
    const next = this.next();
    const current = await this.sessions.create(user, next.session);
    if (!current) throw denied();
    return this.result(current, next.session.id, next.token);
  }
  async refresh(token: string | undefined) {
    if (!token || !/^[A-Za-z0-9_-]{64}$/.test(token)) throw denied();
    const next = this.next();
    const user = await this.sessions.rotate(hashRefresh(token), next.session);
    if (!user) throw denied();
    return this.result(user, next.session.id, next.token);
  }
  async logout(token: string | undefined) {
    if (token) await this.sessions.revoke(hashRefresh(token));
    return { message: 'Đã đăng xuất.' };
  }
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.users.findById(userId);
    if (!user || !(await compare(currentPassword, user.passwordHash)))
      throw new UnauthorizedException({
        code: 'CURRENT_PASSWORD_INVALID',
        message: 'Mật khẩu hiện tại không đúng.',
      });
    if (
      !(await this.sessions.changePassword(
        userId,
        user.passwordHash,
        await hash(newPassword, 12),
      ))
    )
      throw denied();
    return { message: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.' };
  }
}
