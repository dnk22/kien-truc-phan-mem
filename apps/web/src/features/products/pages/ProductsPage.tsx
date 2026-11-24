import { useState } from 'react';
import { Button,Card } from 'antd';
import type { ProductSummary } from '@minimart/contracts';
import type { ProductValues } from '../../catalog/types';
import { useCatalog } from '../../catalog/hooks/useCatalog';
import { CatalogToolbar } from '../../catalog/components/CatalogToolbar';
import { ProductForm } from '../components/ProductForm';
import { ProductDetail } from '../components/ProductDetail';
import { productColumns } from '../components/productColumns';
import { useCategories } from '../hooks/useCategories';
import { useAuthStore } from '../../auth/stores/auth.store';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { ErrorState } from '../../../shared/components/ErrorState';
export default function ProductsPage(){
 const {filters,setFilters,query,save,status}=useCatalog<ProductSummary,ProductValues>('products');
 const categories=useCategories();
 const canWrite=useAuthStore(s=>s.user?.role==='MANAGER');
 const [editor,setEditor]=useState<{item?:ProductSummary}|null>(null);
 const [target,setTarget]=useState<ProductSummary|null>(null);
 const [detail,setDetail]=useState<ProductSummary|null>(null);
 const options=(categories.data??[]).map(c=>({label:c.name,value:c.id}));
 const names=new Map(options.map(c=>[c.value,c.label]));
 return <><PageHeader title={canWrite?'Quản lý sản phẩm':'Tra cứu sản phẩm'} actions={canWrite&&<Button type="primary" disabled={!categories.isSuccess} onClick={()=>setEditor({})}>+ Thêm sản phẩm</Button>}/>
 <Card><CatalogToolbar filters={filters} onChange={setFilters} categories={options}/>
 {categories.isError&&<ErrorState error={categories.error} retry={()=>void categories.refetch()}/>}
 {query.isError?<ErrorState error={query.error} retry={()=>void query.refetch()}/>:<DataTable<ProductSummary> columns={productColumns(names,canWrite,item=>setEditor({item}),setTarget,setDetail)} dataSource={query.data?.items??[]} loading={query.isFetching} pagination={{current:filters.page,pageSize:filters.pageSize,total:query.data?.total??0,showSizeChanger:true,onChange:(page,pageSize)=>setFilters({...filters,page:pageSize!==filters.pageSize?1:page,pageSize})}}/>}</Card>
 {editor&&canWrite&&<ProductForm item={editor.item} categories={categories.data??[]} pending={save.isPending} onCancel={()=>{if(!save.isPending)setEditor(null);}} onSave={values=>save.mutate({id:editor.item?.id,values},{onSuccess:()=>setEditor(null)})}/>}
 <ConfirmDialog open={!!target&&canWrite} title="Xác nhận đổi trạng thái" pending={status.isPending} onCancel={()=>setTarget(null)} onConfirm={()=>{if(target)status.mutate({id:target.id,status:target.status==='ACTIVE'?'INACTIVE':'ACTIVE'},{onSuccess:()=>setTarget(null)});}}>{target?.name}</ConfirmDialog>
 {detail&&<ProductDetail item={detail} category={names.get(detail.categoryId)} onClose={()=>setDetail(null)}/>}</>;
}
