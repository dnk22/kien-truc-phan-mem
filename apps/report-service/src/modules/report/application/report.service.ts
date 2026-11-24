import { Inject, Injectable } from '@nestjs/common';
import {
  REPORTS,
  INVENTORY_REPORT,
  type ReportRepository,
  type InventoryReportPort,
  type ReportPeriod,
} from '../domain/report.repository';
@Injectable()
export class ReportService {
  constructor(
    @Inject(REPORTS) private readonly reports: ReportRepository,
    @Inject(INVENTORY_REPORT) private readonly inventory: InventoryReportPort,
  ) {}
  revenue(period: ReportPeriod) {
    return this.reports.revenue(period);
  }
  stock(correlationId?: string) {
    return this.inventory.summary(correlationId);
  }
}
