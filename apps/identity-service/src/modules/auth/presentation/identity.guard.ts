import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyAccessToken, type Principal } from '@minimart/auth';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../sessions/domain/session.repository';
import type { IdentityUser } from '../../users/domain/user.repository';
import type { Request } from 'express';
export interface IdentityRequest extends Request {
  principal: Principal;
  user: IdentityUser;
  correlationId?: string;
}
@Injectable()
export class IdentityGuard implements CanActivate {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<IdentityRequest>();
    req.principal = verifyAccessToken(req.headers.authorization);
    const user = await this.sessions.authenticate(req.principal);
    if (!user)
      throw new UnauthorizedException({
        code: 'SESSION_REVOKED',
        message: 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.',
      });
    req.user = user;
    return true;
  }
}
