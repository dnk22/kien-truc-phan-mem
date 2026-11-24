import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { OUTBOX } from './domain/outbox.repository';
import { EVENT_PUBLISHER } from './domain/event-publisher';
import { PrismaOutboxRepository } from './infrastructure/prisma-outbox.repository';
import { RabbitMqPublisher } from './infrastructure/rabbitmq.publisher';
import { OutboxWorker } from './application/outbox.worker';
@Module({
  imports: [DatabaseModule],
  providers: [
    OutboxWorker,
    { provide: OUTBOX, useClass: PrismaOutboxRepository },
    { provide: EVENT_PUBLISHER, useClass: RabbitMqPublisher },
  ],
})
export class OutboxModule {}
