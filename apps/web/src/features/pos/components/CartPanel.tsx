import { Button,Card,InputNumber,Table,Typography } from 'antd';
import { useCartStore } from '../stores/cart.store';
import { money } from '../../inventory/utils/format';
export function CartPanel({disabled,onPrepare,pending}:{disabled:boolean;onPrepare:()=>void;pending:boolean}){
 const {items,quantity,remove}=useCartStore();
 const total=items.reduce((sum,i)=>sum+i.product.sellingPrice*i.quantity,0);
 return <Card title="Giỏ hàng">
 <Table rowKey="productId" dataSource={items} pagination={false} columns={[
 {title:'Sản phẩm',render:(_,i)=>i.product.name},
 {title:'SL',render:(_,i)=><InputNumber min={1} max={2147483647} precision={0} value={i.quantity} disabled={disabled} onChange={v=>{if(v!==null)quantity(i.productId,v);}}/>},
 {title:'Thành tiền',render:(_,i)=>money(i.product.sellingPrice*i.quantity)},
 {title:'',render:(_,i)=><Button danger type="link" disabled={disabled} onClick={()=>remove(i.productId)}>Xóa</Button>},
 ]}/>
 <Typography.Title level={4}>Tạm tính: {money(total)}</Typography.Title>
 <Button block type="primary" loading={pending} disabled={disabled||!items.length||!Number.isSafeInteger(total)} onClick={onPrepare}>Kiểm tra giá và giữ hàng</Button>
 </Card>;
}
