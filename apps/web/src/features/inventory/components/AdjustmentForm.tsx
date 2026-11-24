import { useState } from 'react';
import { Alert,Form,Input,InputNumber,Modal,Select,Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi,type AdjustmentValues } from '../api/inventory.api';
export function AdjustmentForm({pending,onSave,onCancel}:{pending:boolean;onSave:(v:AdjustmentValues)=>void;onCancel:()=>void}){
 const [form]=Form.useForm<AdjustmentValues>();
 const [id,setId]=useState<string>();
 const list=useQuery({queryKey:['inventory','adjustment-options'],queryFn:async()=>{
  const first=await inventoryApi.stock({page:1,pageSize:100});
  const rest=await Promise.all(Array.from({length:Math.max(0,Math.ceil(first.total/100)-1)},(_,i)=>inventoryApi.stock({page:i+2,pageSize:100})));
  return [...first.items,...rest.flatMap(p=>p.items)];
 }});
 const stock=useQuery({queryKey:['inventory','stock-detail',id],queryFn:()=>inventoryApi.getStock(id!),enabled:!!id});
 return <Modal open title="Lập phiếu kiểm kê" okText="Lưu nháp" cancelText="Hủy" confirmLoading={pending} okButtonProps={{disabled:!stock.data||stock.isFetching||stock.isError}} onOk={()=>form.submit()} onCancel={onCancel} closable={!pending} maskClosable={!pending}>
 {(list.isError||stock.isError)&&<Alert type="error" message="Không tải được dữ liệu tồn kho."/>}
 <Form form={form} layout="vertical" onFinish={v=>{if(stock.data)onSave({...v,expectedVersion:stock.data.version});}}>
 <Form.Item name="productId" label="Sản phẩm" rules={[{required:true}]}><Select showSearch optionFilterProp="label" loading={list.isFetching} options={(list.data??[]).map(s=>({value:s.productId,label:(s.productCode??'')+' – '+(s.productName??s.productId)}))} onChange={setId}/></Form.Item>
 {stock.data&&<Typography.Paragraph>Tồn hệ thống: {stock.data.onHand} · Đang giữ: {stock.data.reserved} · Phiên bản: {stock.data.version}</Typography.Paragraph>}
 <Form.Item name="counted" label="Số lượng kiểm kê" rules={[{required:true,type:'integer',min:0,max:2147483647}]}><InputNumber min={0} precision={0} style={{width:'100%'}}/></Form.Item>
 <Form.Item name="reason" label="Lý do" rules={[{required:true,whitespace:true,max:1000}]}><Input.TextArea/></Form.Item>
 </Form></Modal>;
}
