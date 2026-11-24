import { useState } from 'react';
import { Alert,Button,Card,Checkbox,InputNumber,Radio,Space,Typography } from 'antd';
import type { SaleInvoice,SalePaymentInput } from '@minimart/contracts';
import { money } from '../../inventory/utils/format';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
export function PaymentPanel({invoice,pending,uncertain,onPay,onCancel}:{invoice:SaleInvoice;pending:boolean;uncertain:boolean;onPay:(input?:SalePaymentInput)=>void;onCancel:()=>void}){
 const [method,setMethod]=useState<'CASH'|'BANK_TRANSFER'>('CASH');
 const [amount,setAmount]=useState<number|null>(null);
 const [confirmed,setConfirmed]=useState(false);
 const [review,setReview]=useState<SalePaymentInput|null>(null);
 const [cancel,setCancel]=useState(false);
 const valid=method==='CASH'?amount!==null&&Number.isSafeInteger(amount)&&amount>=invoice.totalAmount:confirmed;
 return <Card title="Xác nhận giá và thanh toán">
 <Alert type="info" showIcon message="Giá chính thức đã được hệ thống kiểm tra. Chỉ ghi nhận sau khi đã nhận đủ tiền."/>
 <Typography.Title level={4}>Phải thu: {money(invoice.totalAmount)}</Typography.Title>
 <Space direction="vertical" style={{width:'100%'}}>
 <Radio.Group value={method} disabled={pending||uncertain} onChange={e=>setMethod(e.target.value)} options={[{label:'Tiền mặt',value:'CASH'},{label:'Chuyển khoản',value:'BANK_TRANSFER'}]}/>
 {method==='CASH'?<><InputNumber value={amount} onChange={setAmount} min={0} precision={0} disabled={pending||uncertain} placeholder="Tiền khách đưa" style={{width:'100%'}}/><span>Tiền thừa: {money(Math.max(0,(amount??0)-invoice.totalAmount))}</span></>:<Checkbox checked={confirmed} disabled={pending||uncertain} onChange={e=>setConfirmed(e.target.checked)}>Đã kiểm tra và nhận đủ tiền chuyển khoản</Checkbox>}
 {uncertain?<Alert type="warning" message="Kết quả yêu cầu trước chưa rõ. Thử lại cùng giao dịch, không nhận tiền lần nữa."/>:null}
 <Button type="primary" block loading={pending} disabled={!uncertain&&!valid} onClick={()=>uncertain?onPay():setReview(method==='CASH'?{method,amountReceived:amount!}:{method,confirmed:true})}>{uncertain?'Thử lại yêu cầu thanh toán':'Xác nhận đã nhận tiền'}</Button>
 <Button danger block disabled={pending||uncertain} onClick={()=>setCancel(true)}>Hủy giao dịch và giải phóng hàng</Button>
 </Space>
 <ConfirmDialog open={!!review} title="Xác nhận đã nhận đủ tiền" pending={pending} onCancel={()=>setReview(null)} onConfirm={()=>{if(review){onPay(review);setReview(null);}}}>Tổng thanh toán: {money(invoice.totalAmount)}. Không thể hủy sau khi ghi nhận tiền.</ConfirmDialog>
 <ConfirmDialog open={cancel} title="Hủy giao dịch" onCancel={()=>setCancel(false)} onConfirm={()=>{setCancel(false);onCancel();}}>Chỉ hủy khi chưa nhận tiền.</ConfirmDialog>
 </Card>;
}
