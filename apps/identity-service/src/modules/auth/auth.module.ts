import { Module } from '@nestjs/common';
import { LoginRateLimiter } from '@minimart/auth';
import { UserPersistenceModule } from '../users/infrastructure/user-persistence.module';
import { SessionModule } from '../sessions/session.module';
import { AuthService } from './application/auth.service';
import { AuthController } from './presentation/auth.controller';
import { IdentityGuard } from './presentation/identity.guard';
import { CsrfGuard } from './presentation/csrf.guard';
@Module({
  imports: [UserPersistenceModule, SessionModule],
  controllers: [AuthController],
  providers: [AuthService, IdentityGuard, CsrfGuard, LoginRateLimiter],
  exports: [IdentityGuard, SessionModule],
})
export class AuthenticationModule {}
