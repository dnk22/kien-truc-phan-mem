import { Form,Input,InputNumber,Modal,Select } from 'antd';
import type { CategorySummary,ProductSummary } from '@minimart/contracts';
import type { ProductValues } from '../../catalog/types';
export function ProductForm({item,categories,pending,onSave,onCancel}:{item?:ProductSummary;categories:CategorySummary[];pending:boolean;onSave:(v:ProductValues)=>void;onCancel:()=>void}){
 const [form]=Form.useForm<ProductValues>();
 return <Modal open title={item?'Sửa sản phẩm':'Thêm sản phẩm'} okText="Lưu" cancelText="Hủy" confirmLoading={pending} onOk={()=>form.submit()} onCancel={onCancel} maskClosable={!pending} closable={!pending}>
 <Form form={form} layout="vertical" initialValues={item} onFinish={onSave}>
 <Form.Item name="code" label="Mã sản phẩm" rules={[{required:true,whitespace:true,max:64}]}><Input/></Form.Item>
 <Form.Item name="barcode" label="Mã vạch" rules={[{max:64}]}><Input/></Form.Item>
 <Form.Item name="name" label="Tên sản phẩm" rules={[{required:true,whitespace:true,max:200}]}><Input/></Form.Item>
 <Form.Item name="categoryId" label="Danh mục" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={categories.filter(c=>c.status==='ACTIVE'||c.id===item?.categoryId).map(c=>({value:c.id,label:c.name,disabled:c.status==='INACTIVE'}))}/></Form.Item>
 <Form.Item name="unit" label="Đơn vị tính" rules={[{required:true,whitespace:true,max:50}]}><Input/></Form.Item>
 <Form.Item name="sellingPrice" label="Giá bán (VNĐ)" rules={[{required:true,type:'integer',min:1,max:2147483647}]}><InputNumber min={1} precision={0} style={{width:'100%'}}/></Form.Item>
 <Form.Item name="imageUrl" label="URL hình ảnh" rules={[{type:'url',max:2048}]}><Input/></Form.Item>
 <Form.Item name="description" label="Mô tả" rules={[{max:2000}]}><Input.TextArea/></Form.Item>
 </Form></Modal>;
}
