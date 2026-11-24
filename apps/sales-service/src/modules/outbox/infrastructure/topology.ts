import type { Channel } from 'amqplib';
export const EXCHANGE = 'minimart.sales';
export const ROUTING_KEY = 'sale.completed.v1';
export const QUEUE = 'minimart.report.sale-completed.v1';
export const DEAD_EXCHANGE = 'minimart.sales.dead';
export const DEAD_QUEUE = QUEUE + '.dead';
export const RETRY_QUEUE = QUEUE + '.retry';
export async function assertTopology(ch: Channel) {
  await ch.assertExchange(EXCHANGE, 'direct', { durable: true });
  await ch.assertExchange(DEAD_EXCHANGE, 'direct', { durable: true });
  await ch.assertQueue(DEAD_QUEUE, { durable: true });
  await ch.bindQueue(DEAD_QUEUE, DEAD_EXCHANGE, ROUTING_KEY);
  await ch.assertQueue(QUEUE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': DEAD_EXCHANGE,
      'x-dead-letter-routing-key': ROUTING_KEY,
    },
  });
  await ch.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
  await ch.assertQueue(RETRY_QUEUE, {
    durable: true,
    arguments: {
      'x-message-ttl': 10000,
      'x-dead-letter-exchange': EXCHANGE,
      'x-dead-letter-routing-key': ROUTING_KEY,
    },
  });
}
