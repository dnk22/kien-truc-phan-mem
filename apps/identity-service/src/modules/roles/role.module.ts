import { Module } from '@nestjs/common';
import { RolesGuard } from '@minimart/auth';
// Role enum in the schema is the single source of persisted role values.
@Module({ providers: [RolesGuard], exports: [RolesGuard] })
export class RoleModule {}
