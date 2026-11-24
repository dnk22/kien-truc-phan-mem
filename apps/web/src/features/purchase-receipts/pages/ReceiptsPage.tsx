import { useState } from 'react';
import { Button,Select } from 'antd';
import { useLocation,useNavigate,useSearchParams } from 'react-router-dom';
import type { PurchaseReceiptSummary } from '@minimart/contracts';
import { useAuthStore } from '../../auth/stores/auth.store';
import { inventoryApi,type ReceiptValues } from '../../inventory/api/inventory.api';
import { useInventoryList } from '../../inventory/hooks/useInventoryList';
import { useInventoryMutation } from '../../inventory/hooks/useInventoryMutation';
import { InventoryTable } from '../../inventory/components/InventoryTable';
import { PageHeader } from '../../../shared/components/PageHeader';
import { TableToolbar } from '../../../shared/components/TableToolbar';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { ReceiptForm } from '../components/ReceiptForm';
import { ReceiptDetail } from '../components/ReceiptDetail';
import { receiptColumns } from '../components/receiptColumns';
export default function ReceiptsPage(){
 const navigate=useNavigate();const location=useLocation();const [params]=useSearchParams();
 const supplierId=params.get('supplierId')??undefined;
 const manager=useAuthStore(s=>s.user?.role==='MANAGER');
 const {filters,setFilters,query,pagination}=useInventoryList('receipts:'+String(supplierId),p=>inventoryApi.receipts({...p,supplierId}));
 const [editor,setEditor]=useState<{item?:PurchaseReceiptSummary}|null>(null);
 const [detail,setDetail]=useState<PurchaseReceiptSummary|null>(null);
 const [target,setTarget]=useState<{item:PurchaseReceiptSummary;action:'confirm'|'cancel'}|null>(null);
 const creating=location.pathname.endsWith('/create');
 const close=()=>{setEditor(null);if(creating)navigate('/purchase-receipts');};
 const save=useInventoryMutation(({id,values}:{id?:string;values:ReceiptValues})=>inventoryApi.saveReceipt(id,values));
 const action=useInventoryMutation((t:{item:PurchaseReceiptSummary;action:'confirm'|'cancel'})=>inventoryApi.receiptAction(t.item.id,t.action));
 return <><PageHeader title="Phiếu nhập hàng" actions={<Button type="primary" onClick={()=>navigate('/purchase-receipts/create')}>+ Lập phiếu</Button>}/>
 <InventoryTable<PurchaseReceiptSummary> error={query.error} retry={()=>void query.refetch()} toolbar={<TableToolbar><Select allowClear placeholder="Trạng thái" value={filters.status} options={['DRAFT','CONFIRMED','CANCELLED'].map(value=>({value,label:({DRAFT:'Nháp',CONFIRMED:'Đã xác nhận',CANCELLED:'Đã hủy'})[value as 'DRAFT'|'CONFIRMED'|'CANCELLED']}))} onChange={status=>setFilters({...filters,status,page:1})}/>{supplierId&&<Button onClick={()=>navigate('/purchase-receipts')}>Bỏ lọc nhà cung cấp</Button>}</TableToolbar>} columns={receiptColumns(manager,item=>setEditor({item}),setDetail,(item,action)=>setTarget({item,action}))} dataSource={query.data?.items??[]} loading={query.isFetching} pagination={pagination}/>
 {(editor||creating)&&<ReceiptForm item={editor?.item} pending={save.isPending} onCancel={()=>{if(!save.isPending)close();}} onSave={values=>save.mutate({id:editor?.item?.id,values},{onSuccess:close})}/>}
 {detail&&<ReceiptDetail item={detail} onClose={()=>setDetail(null)}/>}
 <ConfirmDialog open={!!target} title={target?.action==='confirm'?'Xác nhận nhập kho':'Hủy phiếu nháp'} pending={action.isPending} onCancel={()=>setTarget(null)} onConfirm={()=>{if(target)action.mutate(target,{onSuccess:()=>setTarget(null)});}}>Phiếu {target?.item.id.slice(0,8)}. Xác nhận nhập sẽ tăng tồn kho.</ConfirmDialog></>;
}
