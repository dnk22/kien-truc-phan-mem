import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/client';
import type { HealthProbe } from '@minimart/config';
@Injectable()
export class DatabaseProbe implements HealthProbe, OnModuleDestroy {
  private readonly client = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  async check(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }
  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
