import { Form, Input, Modal } from 'antd';
import type { CategorySummary } from '@minimart/contracts';
import type { CategoryValues } from '../../catalog/types';
export function CategoryForm({item,pending,onSave,onCancel}:{item?:CategorySummary;pending:boolean;onSave:(v:CategoryValues)=>void;onCancel:()=>void}){
 const [form]=Form.useForm<CategoryValues>();
 return <Modal open title={item?'Sửa danh mục':'Thêm danh mục'} okText="Lưu" cancelText="Hủy" confirmLoading={pending} onOk={()=>form.submit()} onCancel={onCancel} maskClosable={!pending} closable={!pending}>
 <Form form={form} layout="vertical" initialValues={item} onFinish={onSave}>
 <Form.Item name="code" label="Mã danh mục" rules={[{required:true,whitespace:true,max:64}]}><Input/></Form.Item>
 <Form.Item name="name" label="Tên danh mục" rules={[{required:true,whitespace:true,max:200}]}><Input/></Form.Item>
 <Form.Item name="description" label="Mô tả" rules={[{max:2000}]}><Input.TextArea/></Form.Item>
 </Form></Modal>;
}
