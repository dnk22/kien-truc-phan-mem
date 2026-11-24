import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/client';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ datasources: { db: { url: process.env.DATABASE_URL } } });
  }
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
