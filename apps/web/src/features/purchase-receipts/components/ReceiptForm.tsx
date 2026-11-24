import { Alert,Button,Form,InputNumber,Modal,Select,Space } from 'antd';
import type { PurchaseReceiptSummary } from '@minimart/contracts';
import type { ReceiptValues } from '../../inventory/api/inventory.api';
import { useInventoryOptions } from '../../inventory/hooks/useInventoryOptions';
export function ReceiptForm({item,pending,onSave,onCancel}:{item?:PurchaseReceiptSummary;pending:boolean;onSave:(v:ReceiptValues)=>void;onCancel:()=>void}){
 const [form]=Form.useForm<ReceiptValues>();
 const {suppliers,products}=useInventoryOptions();
 const failed=suppliers.isError||products.isError;
 return <Modal open width={760} title={item?'Sửa phiếu nhập':'Lập phiếu nhập'} okText="Lưu nháp" cancelText="Hủy" confirmLoading={pending} okButtonProps={{disabled:failed||suppliers.isPending||products.isPending}} onOk={()=>form.submit()} onCancel={onCancel} closable={!pending} maskClosable={!pending}>
 {failed&&<Alert type="error" message="Không tải được nhà cung cấp hoặc sản phẩm."/>}
 <Form form={form} layout="vertical" initialValues={{supplierId:item?.supplierId,items:item?.items.map(({productId,quantity,unitCost})=>({productId,quantity,unitCost}))??[{}]}} onFinish={onSave}>
 <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={(suppliers.data??[]).map(s=>({value:s.id,label:s.name}))}/></Form.Item>
 <Form.List name="items" rules={[{validator:async(_,items:ReceiptValues['items'])=>{if(!items?.length||items.length>100||new Set(items.map(i=>i?.productId)).size!==items.length)throw new Error('Cần 1–100 sản phẩm không trùng.');}}]}>
 {(fields,{add,remove},meta)=><>{fields.map(field=><Space key={field.key} align="baseline" wrap>
 <Form.Item name={[field.name,'productId']} rules={[{required:true}]}><Select placeholder="Sản phẩm" style={{width:240}} showSearch optionFilterProp="label" options={(products.data??[]).map(p=>({value:p.id,label:p.code+' – '+p.name}))}/></Form.Item>
 <Form.Item name={[field.name,'quantity']} rules={[{required:true,type:'integer',min:1,max:2147483647}]}><InputNumber placeholder="SL" min={1} precision={0}/></Form.Item>
 <Form.Item name={[field.name,'unitCost']} rules={[{required:true,type:'integer',min:1,max:2147483647}]}><InputNumber placeholder="Giá nhập" min={1} precision={0} style={{width:140}}/></Form.Item>
 <Button danger onClick={()=>remove(field.name)}>Xóa</Button></Space>)}<Form.ErrorList errors={meta.errors}/><Button onClick={()=>add()} disabled={fields.length>=100}>+ Thêm dòng</Button></>}
 </Form.List></Form></Modal>;
}
