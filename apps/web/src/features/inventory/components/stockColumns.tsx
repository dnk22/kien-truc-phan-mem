import { Tag,type TableColumnsType } from 'antd';
import type { StockSummary } from '@minimart/contracts';
export type StockTableRow=StockSummary&{id:string};
export const stockColumns:TableColumnsType<StockTableRow>=[
 {title:'Mã sản phẩm',dataIndex:'productCode'},
 {title:'Tên sản phẩm',dataIndex:'productName'},
 {title:'Tồn thực tế',dataIndex:'onHand'},
 {title:'Đang giữ',dataIndex:'reserved'},
 {title:'Có thể bán',dataIndex:'available'},
 {title:'Ngưỡng cảnh báo',dataIndex:'threshold'},
 {title:'Trạng thái',render:(_,r)=><Tag color={r.available<=r.threshold?'red':'green'}>{r.available<=r.threshold?'Tồn thấp':'Bình thường'}</Tag>},
];
