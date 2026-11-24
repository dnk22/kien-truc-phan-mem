import { Card,Col,Row,Statistic,Typography } from 'antd';
import type { InventoryReportSummary } from '@minimart/contracts';
export function StockMetrics({data}:{data:InventoryReportSummary}){
 return <Card title="Tồn kho hiện tại">
 <Row gutter={[12,12]}>
 <Col xs={12} md={6}><Statistic title="Sản phẩm có bản ghi kho" value={data.productCount}/></Col>
 <Col xs={12} md={6}><Statistic title="Tồn thực tế" value={data.onHand}/></Col>
 <Col xs={12} md={6}><Statistic title="Có thể bán" value={data.available}/></Col>
 <Col xs={12} md={6}><Statistic title="Sản phẩm tồn thấp" value={data.lowStockCount}/></Col>
 </Row><Typography.Text type="secondary">Đang giữ: {data.reserved}. Chỉ thống kê sản phẩm đã có bản ghi tồn kho.</Typography.Text>
 </Card>;
}
