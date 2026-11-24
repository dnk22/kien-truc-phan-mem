import type { TableColumnsType } from 'antd';
import type { SaleInvoice } from '@minimart/contracts';
import { Link } from 'react-router-dom';
import { SaleStatusTag } from './SaleStatusTag';
import { money,formatDate } from '../../inventory/utils/format';
export const invoiceColumns:TableColumnsType<SaleInvoice>=[
 {title:'Mã hóa đơn',render:(_,i)=><Link to={'/invoices/'+i.id}>{i.code}</Link>},
 {title:'Ngày lập',render:(_,i)=>formatDate(i.createdAt)},
 {title:'Tổng tiền',render:(_,i)=>money(i.totalAmount)},
 {title:'Thanh toán',render:(_,i)=>i.payment?.method==='CASH'?'Tiền mặt':i.payment?.method==='BANK_TRANSFER'?'Chuyển khoản':'—'},
 {title:'Trạng thái',render:(_,i)=><SaleStatusTag status={i.status}/>},
];
