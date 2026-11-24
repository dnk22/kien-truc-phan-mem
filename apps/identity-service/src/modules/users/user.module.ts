import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../auth/auth.module';
import { RoleModule } from '../roles/role.module';
import { UserPersistenceModule } from './infrastructure/user-persistence.module';
import { UserController } from './presentation/user.controller';
import { UserService } from './application/user.service';
@Module({
  imports: [UserPersistenceModule, AuthenticationModule, RoleModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
