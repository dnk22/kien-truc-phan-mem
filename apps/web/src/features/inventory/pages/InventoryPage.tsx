import { Checkbox } from 'antd';
import { inventoryApi } from '../api/inventory.api';
import { useInventoryList } from '../hooks/useInventoryList';
import { InventoryTable } from '../components/InventoryTable';
import { stockColumns,type StockTableRow } from '../components/stockColumns';
import { PageHeader } from '../../../shared/components/PageHeader';
import { SearchInput } from '../../../shared/components/SearchInput';
import { TableToolbar } from '../../../shared/components/TableToolbar';
export default function InventoryPage(){
 const {filters,setFilters,query,pagination}=useInventoryList('stock',inventoryApi.stock);
 return <><PageHeader title="Tồn kho" description="Tồn thực tế, hàng đang giữ và số lượng có thể bán"/>
 <InventoryTable<StockTableRow> error={query.error} retry={()=>void query.refetch()} toolbar={<TableToolbar><SearchInput value={filters.search??''} onChange={search=>setFilters({...filters,search,page:1})}/><Checkbox checked={!!filters.lowStock} onChange={e=>setFilters({...filters,lowStock:e.target.checked,page:1})}>Chỉ hiện tồn thấp</Checkbox></TableToolbar>} columns={stockColumns} dataSource={(query.data?.items??[]).map(r=>({...r,id:r.productId}))} loading={query.isFetching} pagination={pagination}/></>;
}
