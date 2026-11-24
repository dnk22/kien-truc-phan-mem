import { Input } from 'antd';
import type { StockMovementSummary } from '@minimart/contracts';
import { inventoryApi } from '../api/inventory.api';
import { useInventoryList } from '../hooks/useInventoryList';
import { InventoryTable } from '../components/InventoryTable';
import { movementColumns } from '../components/movementColumns';
import { PageHeader } from '../../../shared/components/PageHeader';
import { TableToolbar } from '../../../shared/components/TableToolbar';
export default function MovementsPage() {
  const { filters, setFilters, query, pagination } = useInventoryList(
    'movements',
    inventoryApi.movements,
  );
  return (
    <>
      <PageHeader title="Lịch sử biến động kho" />
      <InventoryTable<StockMovementSummary>
        error={query.error}
        retry={() => void query.refetch()}
        toolbar={
          <TableToolbar>
            <Input.Search
              allowClear
              placeholder="UUID sản phẩm"
              onSearch={(value) =>
                setFilters({
                  ...filters,
                  productId: value.trim() || undefined,
                  page: 1,
                })
              }
              style={{ maxWidth: 360 }}
            />
          </TableToolbar>
        }
        columns={movementColumns}
        dataSource={query.data?.items ?? []}
        loading={query.isFetching}
        pagination={pagination}
      />
    </>
  );
}
