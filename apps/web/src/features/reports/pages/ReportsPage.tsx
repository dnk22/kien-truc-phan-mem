import { Alert, Button, Card, Space, Typography } from 'antd';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { useReports } from '../hooks/useReports';
import { ReportPeriodFilter } from '../components/ReportPeriodFilter';
import { RevenueMetrics } from '../components/RevenueMetrics';
import { StockMetrics } from '../components/StockMetrics';
import { RevenueTrend } from '../components/RevenueTrend';
import { ReportTables } from '../components/ReportTables';
import { formatDate } from '../../inventory/utils/format';
export function ReportView({ dashboard = false }: { dashboard?: boolean }) {
  const { period, setPeriod, valid, revenue, inventory } = useReports(
    dashboard ? 1 : 7,
  );
  return (
    <>
      <PageHeader
        title={dashboard ? 'Tổng quan' : 'Báo cáo doanh thu'}
        actions={
          <Button
            onClick={() => {
              if (valid) void revenue.refetch();
              void inventory.refetch();
            }}
          >
            Làm mới
          </Button>
        }
      />
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card>
          <ReportPeriodFilter period={period} onChange={setPeriod} />
        </Card>
        <Alert
          type="info"
          showIcon
          message="Doanh thu chỉ tính hóa đơn hoàn thành; dữ liệu đồng bộ bất đồng bộ qua RabbitMQ."
        />
        {!valid ? (
          <Alert
            type="warning"
            message="Chọn khoảng ngày hợp lệ, tối đa 366 ngày."
          />
        ) : revenue.isError ? (
          <ErrorState
            error={revenue.error}
            retry={() => void revenue.refetch()}
          />
        ) : revenue.data ? (
          <>
            <RevenueMetrics data={revenue.data} />
            <RevenueTrend days={revenue.data.days} />
            <ReportTables data={revenue.data} />
            <Typography.Text type="secondary">
              Sự kiện gần nhất xử lý:{' '}
              {revenue.data.updatedAt
                ? formatDate(revenue.data.updatedAt)
                : 'Chưa có sự kiện'}
            </Typography.Text>
          </>
        ) : (
          <LoadingState />
        )}
        {inventory.isError ? (
          <ErrorState
            error={inventory.error}
            retry={() => void inventory.refetch()}
          />
        ) : inventory.data ? (
          <StockMetrics data={inventory.data} />
        ) : (
          <LoadingState />
        )}
      </Space>
    </>
  );
}
export default function ReportsPage() {
  return <ReportView />;
}
