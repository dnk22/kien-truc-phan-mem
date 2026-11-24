import { Inject, Injectable, Logger, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import { OUTBOX, type OutboxRepository } from '../domain/outbox.repository';
import { EVENT_PUBLISHER, type EventPublisher } from '../domain/event-publisher';
@Injectable()
export class OutboxWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  private stopped = false;
  private readonly logger = new Logger(OutboxWorker.name);
  constructor(@Inject(OUTBOX) private readonly repository: OutboxRepository, @Inject(EVENT_PUBLISHER) private readonly publisher: EventPublisher) {}
  onModuleInit() { this.timer = setInterval(() => void this.tick(), 2000); this.timer.unref(); }
  onModuleDestroy() { this.stopped = true; if (this.timer) clearInterval(this.timer); }
  async tick() {
    if (this.busy || this.stopped) return;
    this.busy = true;
    try {
      for (const event of await this.repository.due()) {
        if (this.stopped) break;
        try { await this.publisher.publish(event); await this.repository.sent(event.id); }
        catch { await this.repository.defer(event.id, event.attempts); this.logger.warn('Outbox deferred: ' + event.id); break; }
      }
    } catch { this.logger.warn('Outbox scan unavailable'); }
    finally { this.busy = false; }
  }
}
