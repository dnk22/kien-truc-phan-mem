import { useState } from 'react';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import axios from 'axios';
import type { SaleInvoice, SalePaymentInput } from '@minimart/contracts';
import { salesApi } from '../../sales/api/sales.api';
import { isTerminal } from '../../sales/utils/sale-status';
import { useCartStore } from '../stores/cart.store';
import { errorMessage } from '../../../shared/utils/errorMessage';
import { readPendingPrepare, writePendingPrepare, type PendingPrepare } from '../utils/pending-prepare';
import { useAuthStore } from '../../auth/stores/auth.store';
interface PendingConfirm { key:string; input:SalePaymentInput }
export function useCheckout(initialId?:string){
 const cache=useQueryClient();
 const actor=useAuthStore(s=>s.user?.id??'');
 const [id,setId]=useState<string|undefined>(initialId);
 const [pendingPrepare,setPendingPrepare]=useState<PendingPrepare|null>(()=>readPendingPrepare(actor));
 const [pendingConfirm,setPendingConfirm]=useState<PendingConfirm|null>(null);
 const [last,setLast]=useState<SaleInvoice|null>(null);
 const query=useQuery({queryKey:['sales','invoice',id],queryFn:()=>salesApi.get(id!),enabled:!!id,refetchInterval:q=>q.state.data&&!isTerminal(q.state.data.status)?2000:false});
 const accept=(invoice:SaleInvoice)=>{
  setId(invoice.id);setLast(invoice);setPendingPrepare(null);writePendingPrepare(actor,null);
  cache.setQueryData(['sales','invoice',invoice.id],invoice);
  void cache.invalidateQueries({queryKey:['sales','list']});
 };
 const prepare=useMutation({mutationFn:(request:PendingPrepare)=>salesApi.prepare(request.items,request.key),onSuccess:accept,onError:(error:unknown)=>{
  // A timeout is ambiguous. Keep the exact key and payload until reconciled.
  if(axios.isAxiosError(error)&&error.response&&[400,403,409].includes(error.response.status)){setPendingPrepare(null);writePendingPrepare(actor,null);}
  void message.error(errorMessage(error));
 }});
 const confirm=useMutation({mutationFn:(request:PendingConfirm)=>salesApi.confirm(id!,request.input,request.key),onSuccess:invoice=>{accept(invoice);setPendingConfirm(null);},onError:(error:unknown)=>{
  if(axios.isAxiosError(error)&&error.response&&[400,403].includes(error.response.status))setPendingConfirm(null);
  void message.error(errorMessage(error));
  void query.refetch();
 }});
 const cancel=useMutation({mutationFn:()=>salesApi.cancel(id!),onSuccess:accept,onError:(error:unknown)=>{void message.error(errorMessage(error));void query.refetch();}});
 const invoice=query.data??last;
 function start(){
  const request=pendingPrepare??{key:crypto.randomUUID(),items:useCartStore.getState().items.map(({productId,quantity})=>({productId,quantity}))};
  setPendingPrepare(request);writePendingPrepare(actor,request);prepare.mutate(request);
 }
 function pay(input?:SalePaymentInput){
  if(!pendingConfirm&&!input)return;
  const request=pendingConfirm??{key:crypto.randomUUID(),input:input!};
  setPendingConfirm(request);confirm.mutate(request);
 }
 function reset(){
  if(!invoice||!isTerminal(invoice.status))return;
  setId(undefined);setLast(null);setPendingPrepare(null);writePendingPrepare(actor,null);setPendingConfirm(null);
  if(invoice.status==='COMPLETED')useCartStore.getState().clear();
 }
 return {invoice,query,prepare,confirm,cancel,pendingPrepare,pendingConfirm,start,pay,reset,locked:!!id||!!pendingPrepare};
}
