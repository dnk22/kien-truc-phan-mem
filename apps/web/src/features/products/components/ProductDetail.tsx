import { Descriptions,Modal } from 'antd';
import type { ProductSummary } from '@minimart/contracts';
import { formatVnd } from '../../catalog/utils/currency';
export function ProductDetail({item,category,onClose}:{item:ProductSummary;category?:string;onClose:()=>void}){
 return <Modal open title={item.name} footer={null} onCancel={onClose}>
 <Descriptions column={1}><Descriptions.Item label="Mã">{item.code}</Descriptions.Item><Descriptions.Item label="Mã vạch">{item.barcode??'—'}</Descriptions.Item><Descriptions.Item label="Danh mục">{category??'—'}</Descriptions.Item><Descriptions.Item label="Đơn vị">{item.unit}</Descriptions.Item><Descriptions.Item label="Giá bán">{formatVnd(item.sellingPrice)}</Descriptions.Item><Descriptions.Item label="Mô tả">{item.description??'—'}</Descriptions.Item>{item.imageUrl&&<Descriptions.Item label="Ảnh"><img src={item.imageUrl} alt={item.name} style={{maxWidth:200}} onError={e=>{e.currentTarget.style.display='none';}}/></Descriptions.Item>}</Descriptions></Modal>;
}
