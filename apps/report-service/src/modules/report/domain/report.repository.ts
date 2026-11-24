import type { RevenueReport, SaleCompletedEvent, InventoryReportSummary } from '@minimart/contracts';
export const PROJECTION = Symbol('PROJECTION');
export const REPORTS = Symbol('REPORTS');
export const INVENTORY_REPORT = Symbol('INVENTORY_REPORT');
export interface ProjectionRepository { apply(event: SaleCompletedEvent): Promise<void> }
export interface ReportPeriod { from: string; to: string; start: Date; end: Date }
export interface ReportRepository { revenue(period: ReportPeriod): Promise<RevenueReport> }
export interface InventoryReportPort { summary(correlationId?: string): Promise<InventoryReportSummary> }
