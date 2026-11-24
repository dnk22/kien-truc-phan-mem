import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@minimart/contracts';
import { verifyAccessToken, type Principal } from './jwt';
export const Roles = (...roles: Role[]) => SetMetadata('minimart:roles', roles);
export interface AuthenticatedRequest {
  headers: { authorization?: string };
  principal: Principal;
}
@Injectable()
export class JwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    req.principal = verifyAccessToken(req.headers.authorization);
    return true;
  }
}
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>('minimart:roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (roles && !roles.includes(req.principal?.role))
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bạn không có quyền thực hiện thao tác này.',
      });
    return true;
  }
}
