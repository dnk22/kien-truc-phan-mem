import type { TableColumnsType } from 'antd';
import type { StockAdjustmentSummary } from '@minimart/contracts';
import { DocumentActions } from './DocumentActions';
import { DocumentStatusTag } from './DocumentStatusTag';
import { formatDate } from '../utils/format';
export function adjustmentColumns(manager:boolean,action:(r:StockAdjustmentSummary,a:'confirm'|'cancel')=>void):TableColumnsType<StockAdjustmentSummary>{
 return [{title:'Mã phiếu',render:(_,r)=>r.id.slice(0,8)},{title:'Sản phẩm',dataIndex:'productId'},{title:'SL kiểm kê',dataIndex:'counted'},{title:'Phiên bản tồn',dataIndex:'expectedVersion'},{title:'Lý do',dataIndex:'reason'},{title:'Ngày lập',render:(_,r)=>formatDate(r.createdAt)},{title:'Trạng thái',render:(_,r)=><DocumentStatusTag status={r.status}/>},{title:'Thao tác',render:(_,r)=>r.status==='DRAFT'?<DocumentActions canConfirm={manager} onConfirm={()=>action(r,'confirm')} onCancel={()=>action(r,'cancel')}/>:null}];
}
