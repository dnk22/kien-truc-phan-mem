import { Inject, Injectable, Logger, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import { INVOICES, type InvoiceRepository } from '../domain/sales.repository';
import { CheckoutOrchestrator } from './checkout-orchestrator';
@Injectable()
export class RecoveryWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  private readonly logger = new Logger(RecoveryWorker.name);
  constructor(@Inject(INVOICES) private readonly invoices: InvoiceRepository, private readonly orchestrator: CheckoutOrchestrator) {}
  onModuleInit() { this.timer = setInterval(() => void this.tick(), 5000); this.timer.unref(); }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  async tick() {
    if (this.busy) return;
    this.busy = true;
    try {
      for (const invoice of await this.invoices.due()) {
        try { await this.orchestrator.advance(invoice.id); }
        catch { this.logger.warn('Recovery deferred for invoice ' + invoice.id); }
      }
    } catch { this.logger.warn('Recovery scan unavailable'); }
    finally { this.busy = false; }
  }
}
