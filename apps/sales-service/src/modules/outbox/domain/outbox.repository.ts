export const OUTBOX = Symbol('OUTBOX');
export interface OutboxMessage { id: string; eventType: string; payload: unknown; attempts: number }
export interface OutboxRepository {
  due(): Promise<OutboxMessage[]>;
  sent(id: string): Promise<void>;
  defer(id: string, attempts: number): Promise<void>;
}
