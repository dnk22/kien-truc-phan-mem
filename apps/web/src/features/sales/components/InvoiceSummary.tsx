import { Descriptions, Table, Typography } from 'antd';
import type { SaleInvoice } from '@minimart/contracts';
import { money, formatDate } from '../../inventory/utils/format';
import { SaleStatusTag } from './SaleStatusTag';
export function InvoiceSummary({ invoice }: { invoice: SaleInvoice }) {
  return <div className="invoice-print-area">
    <Typography.Title level={3}>MiniMart – Hóa đơn</Typography.Title>
    <Descriptions column={1}>
      <Descriptions.Item label="Mã hóa đơn">{invoice.code}</Descriptions.Item>
      <Descriptions.Item label="Ngày lập">{formatDate(invoice.createdAt)}</Descriptions.Item>
      <Descriptions.Item label="Thu ngân">{invoice.cashierId}</Descriptions.Item>
      <Descriptions.Item label="Trạng thái"><SaleStatusTag status={invoice.status}/></Descriptions.Item>
    </Descriptions>
    <Table rowKey="productId" pagination={false} scroll={{x:520}} dataSource={invoice.items} columns={[
      {title:'Sản phẩm',dataIndex:'productName'}, {title:'ĐVT',dataIndex:'unit'}, {title:'SL',dataIndex:'quantity'},
      {title:'Đơn giá',render:(_,i)=>money(i.unitPrice)}, {title:'Thành tiền',render:(_,i)=>money(i.subtotal)},
    ]}/>
    <Typography.Title level={4}>Tổng cộng: {money(invoice.totalAmount)}</Typography.Title>
    {invoice.payment && <Descriptions column={1}>
      <Descriptions.Item label="Phương thức">{invoice.payment.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</Descriptions.Item>
      <Descriptions.Item label="Đã nhận">{money(invoice.payment.amountReceived)}</Descriptions.Item>
      <Descriptions.Item label="Tiền thừa">{money(invoice.payment.changeAmount)}</Descriptions.Item>
    </Descriptions>}
  </div>;
}
