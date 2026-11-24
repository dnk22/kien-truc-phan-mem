import type { TableColumnsType } from 'antd';
import type { ProductSummary } from '@minimart/contracts';
import { CatalogActions,CatalogStatusTag } from '../../catalog/components/CatalogActions';
import { formatVnd } from '../../catalog/utils/currency';
export function productColumns(names:Map<string,string>,canWrite:boolean,edit:(item:ProductSummary)=>void,toggle:(item:ProductSummary)=>void,view:(item:ProductSummary)=>void):TableColumnsType<ProductSummary>{
 return [{title:'Mã',dataIndex:'code'},{title:'Mã vạch',dataIndex:'barcode'},{title:'Tên sản phẩm',dataIndex:'name'},{title:'Danh mục',render:(_,item)=>names.get(item.categoryId)??'—'},{title:'Đơn vị',dataIndex:'unit'},{title:'Giá bán',render:(_,item)=>formatVnd(item.sellingPrice)},{title:'Trạng thái',render:(_,item)=><CatalogStatusTag status={item.status}/>},{title:'Thao tác',render:(_,item)=><CatalogActions status={item.status} canWrite={canWrite} onEdit={()=>edit(item)} onStatus={()=>toggle(item)} onView={()=>view(item)}/>}];
}
