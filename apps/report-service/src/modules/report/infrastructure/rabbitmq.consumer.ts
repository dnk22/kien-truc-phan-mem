import { Injectable, Logger, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import { connect, type ChannelModel, type ConfirmChannel, type ConsumeMessage } from 'amqplib';
import { assertTopology, QUEUE, RETRY_QUEUE } from './topology';
import { SaleProjectionService } from '../application/sale-projection.service';
import { InvalidSaleEvent } from '../domain/sale-event';
@Injectable()
export class RabbitMqConsumer implements OnModuleInit, OnModuleDestroy {
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;
  private timer?: ReturnType<typeof setInterval>;
  private connecting = false;
  private stopped = false;
  private readonly logger = new Logger(RabbitMqConsumer.name);
  constructor(private readonly projection: SaleProjectionService) {}
  onModuleInit() { this.timer = setInterval(() => void this.ensureConnected(), 5000); this.timer.unref(); void this.ensureConnected(); }
  async onModuleDestroy() { this.stopped = true; if (this.timer) clearInterval(this.timer); await this.disconnect(); }
  private async disconnect() {
    const connection = this.connection;
    this.connection = undefined; this.channel = undefined;
    if (connection) await connection.close().catch(() => undefined);
  }
  private async ensureConnected() {
    if (this.stopped || this.connecting || this.channel) return;
    this.connecting = true;
    try {
      await this.disconnect();
      const connection = await connect(process.env.RABBITMQ_URL ?? '', { timeout: 5000 });
      if (this.stopped) { await connection.close(); return; }
      this.connection = connection;
      connection.on('error', () => undefined);
      connection.on('close', () => { if (this.connection === connection) { this.connection = undefined; this.channel = undefined; } });
      const channel = await connection.createConfirmChannel();
      channel.on('error', () => undefined);
      channel.on('close', () => { if (this.channel === channel) this.channel = undefined; });
      await assertTopology(channel);
      await channel.prefetch(1);
      this.channel = channel;
      await channel.consume(QUEUE, msg => { if (msg) void this.handle(channel, msg); else if (this.channel === channel) this.channel = undefined; }, { noAck: false });
    } catch { this.logger.warn('Report broker unavailable'); await this.disconnect(); }
    finally { this.connecting = false; }
  }
  private async handle(channel: ConfirmChannel, msg: ConsumeMessage) {
    try {
      let value: unknown;
      try { value = JSON.parse(msg.content.toString('utf8')); } catch { throw new InvalidSaleEvent('Invalid JSON'); }
      await this.projection.consume(value);
      channel.ack(msg);
    } catch (error) {
      try {
        const retries = Number(msg.properties.headers?.['x-retry-count'] ?? 0);
        if (error instanceof InvalidSaleEvent || !Number.isInteger(retries) || retries >= 5) { channel.nack(msg, false, false); return; }
        // Confirm retry enqueue before acknowledging original. Crash between these operations may duplicate, not lose.
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            new Promise<void>((resolve, reject) => channel.sendToQueue(RETRY_QUEUE, msg.content, { persistent: true, contentType: 'application/json', messageId: msg.properties.messageId, headers: { 'x-retry-count': retries + 1 } }, err => err ? reject(err) : resolve())),
            new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Retry confirm timeout')), 5000); }),
          ]);
        } finally { if (timer) clearTimeout(timer); }
        channel.ack(msg);
      } catch { await this.disconnect(); }
    }
  }
}
