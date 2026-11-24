import type { TableColumnsType } from 'antd';
import type { CategorySummary } from '@minimart/contracts';
import { CatalogActions,CatalogStatusTag } from '../../catalog/components/CatalogActions';
export function categoryColumns(edit:(item:CategorySummary)=>void,toggle:(item:CategorySummary)=>void):TableColumnsType<CategorySummary>{
 return [{title:'Mã',dataIndex:'code'},{title:'Tên danh mục',dataIndex:'name'},{title:'Mô tả',dataIndex:'description'},{title:'Trạng thái',render:(_,item)=><CatalogStatusTag status={item.status}/>},{title:'Cập nhật',render:(_,item)=>new Date(item.updatedAt).toLocaleString('vi-VN')},{title:'Thao tác',render:(_,item)=><CatalogActions status={item.status} canWrite onEdit={()=>edit(item)} onStatus={()=>toggle(item)}/>}];
}
