import { Injectable } from '@nestjs/common';
import type { HealthProbe } from '@minimart/config';
import { PrismaService } from './prisma.service';
@Injectable()
export class DatabaseProbe implements HealthProbe {
  constructor(private readonly db: PrismaService) {}
  async check(): Promise<void> {
    await this.db.$queryRaw`SELECT 1`;
  }
}
