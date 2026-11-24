import { Card, Col, Row, Statistic } from 'antd';
import type { RevenueReport } from '@minimart/contracts';
export function RevenueMetrics({ data }: { data: RevenueReport }) {
  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} md={8}>
        <Card>
          <Statistic
            title="Doanh thu"
            value={data.revenue}
            suffix="₫"
            precision={0}
          />
        </Card>
      </Col>
      <Col xs={12} md={8}>
        <Card>
          <Statistic title="Hóa đơn hoàn thành" value={data.invoiceCount} />
        </Card>
      </Col>
      <Col xs={12} md={8}>
        <Card>
          <Statistic title="Số lượng đã bán" value={data.quantitySold} />
        </Card>
      </Col>
    </Row>
  );
}
