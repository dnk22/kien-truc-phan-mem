import type { OutboxMessage } from './outbox.repository';
export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
export interface EventPublisher { publish(event: OutboxMessage): Promise<void> }
