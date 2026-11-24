import { Module } from '@nestjs/common';
import { JwtGuard, LoginRateLimiter, RolesGuard } from '@minimart/auth';
import { IdentityProxyService } from './identity-proxy.service';
import { AuthProxyController } from './auth-proxy.controller';
import { UsersProxyController } from './users-proxy.controller';
@Module({
  controllers: [AuthProxyController, UsersProxyController],
  providers: [IdentityProxyService, JwtGuard, RolesGuard, LoginRateLimiter],
})
export class IdentityProxyModule {}
