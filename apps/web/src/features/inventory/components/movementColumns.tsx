import type { TableColumnsType } from 'antd';
import type { StockMovementSummary } from '@minimart/contracts';
import { formatDate } from '../utils/format';
const labels={PURCHASE:'Nhập hàng',SALE:'Bán hàng',ADJUSTMENT_IN:'Điều chỉnh tăng',ADJUSTMENT_OUT:'Điều chỉnh giảm'};
export const movementColumns:TableColumnsType<StockMovementSummary>=[
 {title:'Sản phẩm (ID)',dataIndex:'productId'},{title:'Tham chiếu',dataIndex:'referenceId'},{title:'Loại',render:(_,r)=>labels[r.type]},{title:'Số lượng',render:(_,r)=>['SALE','ADJUSTMENT_OUT'].includes(r.type)?-r.quantity:r.quantity},{title:'Người thực hiện',render:(_,r)=>r.actorId??'Hệ thống'},{title:'Thời gian',render:(_,r)=>formatDate(r.createdAt)}
];
