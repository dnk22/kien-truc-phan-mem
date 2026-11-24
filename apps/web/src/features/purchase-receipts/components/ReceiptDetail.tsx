import { Descriptions,Modal,Table } from 'antd';
import type { PurchaseReceiptSummary } from '@minimart/contracts';
import { money,formatDate } from '../../inventory/utils/format';
export function ReceiptDetail({item,onClose}:{item:PurchaseReceiptSummary;onClose:()=>void}){
 return <Modal open width={760} title="Chi tiết phiếu nhập" footer={null} onCancel={onClose}><Descriptions column={1}><Descriptions.Item label="Mã phiếu">{item.id}</Descriptions.Item><Descriptions.Item label="Nhà cung cấp">{item.supplier.name}</Descriptions.Item><Descriptions.Item label="Ngày lập">{formatDate(item.createdAt)}</Descriptions.Item></Descriptions>
 <Table rowKey="productId" pagination={false} dataSource={item.items} columns={[{title:'Sản phẩm',dataIndex:'productName'},{title:'SL',dataIndex:'quantity'},{title:'Đơn giá',render:(_,i)=>money(i.unitCost)}]}/>
 <p>Tổng tiền: {money(item.items.reduce((sum,i)=>sum+i.quantity*i.unitCost,0))}</p></Modal>;
}
