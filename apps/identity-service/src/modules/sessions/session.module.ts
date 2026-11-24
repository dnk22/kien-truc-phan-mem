import { Module } from '@nestjs/common';
import { SESSION_REPOSITORY } from './domain/session.repository';
import { PrismaSessionRepository } from './infrastructure/prisma-session.repository';
@Module({
  providers: [
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
  ],
  exports: [SESSION_REPOSITORY],
})
export class SessionModule {}
