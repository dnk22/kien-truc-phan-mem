import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const origins = (
      process.env.CSRF_ALLOWED_ORIGINS ??
      process.env.CORS_ORIGIN ??
      'http://localhost:3000'
    )
      .split(',')
      .map((value) => value.trim());
    if (
      !req.headers.origin ||
      !origins.includes(req.headers.origin) ||
      req.headers['x-csrf-protection'] !== '1'
    )
      throw new ForbiddenException({
        code: 'CSRF_REJECTED',
        message: 'Nguồn yêu cầu không hợp lệ.',
      });
    return true;
  }
}
