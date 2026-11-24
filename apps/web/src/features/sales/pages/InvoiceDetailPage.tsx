import { Button,Card,Space } from 'antd';
import { Link,useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { salesApi } from '../api/sales.api';
import { InvoiceSummary } from '../components/InvoiceSummary';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { useAuthStore } from '../../auth/stores/auth.store';
import { isTerminal } from '../utils/sale-status';
export default function InvoiceDetailPage(){
 const {id}=useParams();
 const cashier=useAuthStore(s=>s.user?.role==='CASHIER');
 const query=useQuery({queryKey:['sales','invoice',id],queryFn:()=>salesApi.get(id!),enabled:!!id,refetchInterval:q=>q.state.data&&!isTerminal(q.state.data.status)?2000:false});
 if(query.isError)return <ErrorState error={query.error} retry={()=>void query.refetch()}/>;
 if(!query.data)return <LoadingState/>;
 const invoice=query.data;
 return <><PageHeader title="Chi tiết hóa đơn" actions={<Space><Link to="/invoices">Quay lại</Link>{invoice.status==='COMPLETED'&&<Button type="primary" onClick={()=>window.print()}>In hóa đơn</Button>}{cashier&&!isTerminal(invoice.status)&&<Link to={'/pos?invoiceId='+invoice.id}>Tiếp tục giao dịch</Link>}</Space>}/><Card><InvoiceSummary invoice={invoice}/></Card></>;
}
