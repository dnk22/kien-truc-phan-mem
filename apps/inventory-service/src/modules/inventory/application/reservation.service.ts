import { Inject, Injectable } from '@nestjs/common';
import {
  RESERVATIONS,
  type ReservationRepository,
} from '../domain/inventory.repository';
import type { ReservationInput } from '../domain/inventory.types';
@Injectable()
export class ReservationService {
  constructor(
    @Inject(RESERVATIONS) private readonly repository: ReservationRepository,
  ) {}
  reserve(input: ReservationInput) {
    return this.repository.reserve(input);
  }
  get(id: string) {
    return this.repository.get(id);
  }
  byInvoice(id: string) {
    return this.repository.byInvoice(id);
  }
  commit(id: string, actorId?: string) {
    return this.repository.transition(id, 'COMMITTED', actorId);
  }
  release(id: string) {
    return this.repository.transition(id, 'RELEASED');
  }
}
