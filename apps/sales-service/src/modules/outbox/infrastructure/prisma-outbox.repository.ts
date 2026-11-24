import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { OutboxRepository } from '../domain/outbox.repository';
@Injectable()
export class PrismaOutboxRepository implements OutboxRepository {
  constructor(private readonly db: PrismaService) {}
  due() {
    return this.db.outboxEvent.findMany({ where: { status: 'PENDING', nextAttemptAt: { lte: new Date() } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 20 });
  }
  async sent(id: string) {
    await this.db.outboxEvent.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'SENT', sentAt: new Date() } });
  }
  async defer(id: string, attempts: number) {
    await this.db.outboxEvent.updateMany({ where: { id, status: 'PENDING' }, data: { attempts: { increment: 1 }, nextAttemptAt: new Date(Date.now() + Math.min(60000, 1000 * 2 ** Math.min(attempts + 1, 6))) } });
  }
}
