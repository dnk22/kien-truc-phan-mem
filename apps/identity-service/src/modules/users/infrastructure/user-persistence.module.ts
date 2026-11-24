import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from '../domain/user.repository';
import { PrismaUserRepository } from './prisma-user.repository';
@Module({
  providers: [{ provide: USER_REPOSITORY, useClass: PrismaUserRepository }],
  exports: [USER_REPOSITORY],
})
export class UserPersistenceModule {}
