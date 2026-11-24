import { Card,Col,Row,Table } from 'antd';
import type { RevenueReport } from '@minimart/contracts';
import { money } from '../../inventory/utils/format';
export function ReportTables({data}:{data:RevenueReport}){
 return <Row gutter={[12,12]}>
 <Col xs={24} lg={14}><Card title="10 sản phẩm bán chạy"><Table rowKey="productId" dataSource={data.topProducts} pagination={false} scroll={{x:400}} columns={[{title:'Sản phẩm',dataIndex:'productName'},{title:'SL',dataIndex:'quantity'},{title:'Doanh thu',render:(_,r)=>money(r.revenue)}]}/></Card></Col>
 <Col xs={24} lg={10}><Card title="Phương thức thanh toán"><Table rowKey="method" dataSource={data.paymentMethods} pagination={false} scroll={{x:300}} columns={[{title:'Phương thức',render:(_,r)=>r.method==='CASH'?'Tiền mặt':'Chuyển khoản'},{title:'Hóa đơn',dataIndex:'invoiceCount'},{title:'Doanh thu',render:(_,r)=>money(r.revenue)}]}/></Card></Col>
 </Row>;
}
