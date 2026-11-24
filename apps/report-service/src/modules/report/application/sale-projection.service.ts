import { Inject, Injectable } from '@nestjs/common';
import { PROJECTION, type ProjectionRepository } from '../domain/report.repository';
import { parseSaleEvent } from '../domain/sale-event';
@Injectable()
export class SaleProjectionService {
  constructor(@Inject(PROJECTION) private readonly repository: ProjectionRepository) {}
  async consume(value: unknown) { await this.repository.apply(parseSaleEvent(value)); }
}
