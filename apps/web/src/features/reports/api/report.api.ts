import type {
  ApiSuccess,
  RevenueReport,
  InventoryReportSummary,
} from '@minimart/contracts';
import { client } from '../../../shared/api/client';
export const reportApi = {
  async revenue(from: string, to: string) {
    return (
      await client.get<ApiSuccess<RevenueReport>>('/api/v1/reports/revenue', {
        params: { from, to },
      })
    ).data.data;
  },
  async inventory() {
    return (
      await client.get<ApiSuccess<InventoryReportSummary>>(
        '/api/v1/reports/inventory',
      )
    ).data.data;
  },
};
