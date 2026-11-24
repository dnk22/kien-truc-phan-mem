import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { connect, type ChannelModel, type ConfirmChannel } from 'amqplib';
import { assertTopology, EXCHANGE, ROUTING_KEY } from './topology';
import type { EventPublisher } from '../domain/event-publisher';
import type { OutboxMessage } from '../domain/outbox.repository';

@Injectable()
export class RabbitMqPublisher implements EventPublisher, OnModuleDestroy {
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;
  private stopped = false;
  private async open(): Promise<ConfirmChannel> {
    if (this.stopped) throw new Error('Publisher stopped');
    if (this.channel) return this.channel;
    await this.disconnect();
    const connection = await connect(process.env.RABBITMQ_URL ?? '', {
      timeout: 5000,
    });
    if (this.stopped) {
      await connection.close();
      throw new Error('Publisher stopped');
    }
    connection.on('error', () => undefined);
    this.connection = connection;
    connection.on('close', () => {
      if (this.connection === connection) {
        this.connection = undefined;
        this.channel = undefined;
      }
    });
    try {
      const channel = await connection.createConfirmChannel();
      channel.on('error', () => undefined);
      channel.on('close', () => {
        if (this.channel === channel) this.channel = undefined;
      });
      await assertTopology(channel);
      this.channel = channel;
      return channel;
    } catch (error) {
      await connection.close().catch(() => undefined);
      throw error;
    }
  }
  async publish(event: OutboxMessage): Promise<void> {
    if (event.eventType !== ROUTING_KEY) throw new Error('Unsupported event');
    const channel = await this.open();
    let returned = false;
    const onReturn = (msg: { properties: { messageId?: string } }) => {
      if (msg.properties.messageId === event.id) returned = true;
    };
    channel.on('return', onReturn);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          channel.publish(
            EXCHANGE,
            ROUTING_KEY,
            Buffer.from(JSON.stringify(event.payload)),
            {
              persistent: true,
              mandatory: true,
              contentType: 'application/json',
              messageId: event.id,
              type: event.eventType,
            },
            (error) => (error ? reject(error) : resolve()),
          );
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Publisher confirm timeout')),
            5000,
          );
        }),
      ]);
      if (returned) throw new Error('Unroutable event');
    } catch (error) {
      await this.disconnect();
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
      channel.removeListener('return', onReturn);
    }
  }
  private async disconnect() {
    const connection = this.connection;
    this.connection = undefined;
    this.channel = undefined;
    if (connection) await connection.close().catch(() => undefined);
  }
  async onModuleDestroy() {
    this.stopped = true;
    await this.disconnect();
  }
}
