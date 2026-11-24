import { useState } from 'react';
import { Button, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { SupplierSummary } from '@minimart/contracts';
import {
  inventoryApi,
  type SupplierValues,
} from '../../inventory/api/inventory.api';
import { useInventoryList } from '../../inventory/hooks/useInventoryList';
import { useInventoryMutation } from '../../inventory/hooks/useInventoryMutation';
import { InventoryTable } from '../../inventory/components/InventoryTable';
import { PageHeader } from '../../../shared/components/PageHeader';
import { SearchInput } from '../../../shared/components/SearchInput';
import { TableToolbar } from '../../../shared/components/TableToolbar';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { SupplierForm } from '../components/SupplierForm';
import { supplierColumns } from '../components/supplierColumns';
export default function SuppliersPage() {
  const navigate = useNavigate();
  const { filters, setFilters, query, pagination } = useInventoryList(
    'suppliers',
    inventoryApi.suppliers,
  );
  const [editor, setEditor] = useState<{ item?: SupplierSummary } | null>(null);
  const [target, setTarget] = useState<SupplierSummary | null>(null);
  const save = useInventoryMutation(
    ({ id, values }: { id?: string; values: SupplierValues }) =>
      inventoryApi.saveSupplier(id, values),
  );
  const status = useInventoryMutation((item: SupplierSummary) =>
    inventoryApi.supplierStatus(
      item.id,
      item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    ),
  );
  return (
    <>
      <PageHeader
        title="Nhà cung cấp"
        actions={
          <Button type="primary" onClick={() => setEditor({})}>
            + Thêm nhà cung cấp
          </Button>
        }
      />
      <InventoryTable<SupplierSummary>
        error={query.error}
        retry={() => void query.refetch()}
        toolbar={
          <TableToolbar>
            <SearchInput
              value={filters.search ?? ''}
              onChange={(search) => setFilters({ ...filters, search, page: 1 })}
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              options={[
                { label: 'Hoạt động', value: 'ACTIVE' },
                { label: 'Ngừng', value: 'INACTIVE' },
              ]}
              value={filters.status}
              onChange={(status) => setFilters({ ...filters, status, page: 1 })}
            />
          </TableToolbar>
        }
        columns={supplierColumns(
          (item) => setEditor({ item }),
          setTarget,
          (item) => navigate('/purchase-receipts?supplierId=' + item.id),
        )}
        dataSource={query.data?.items ?? []}
        loading={query.isFetching}
        pagination={pagination}
      />
      {editor && (
        <SupplierForm
          item={editor.item}
          pending={save.isPending}
          onCancel={() => {
            if (!save.isPending) setEditor(null);
          }}
          onSave={(values) =>
            save.mutate(
              { id: editor.item?.id, values },
              { onSuccess: () => setEditor(null) },
            )
          }
        />
      )}
      <ConfirmDialog
        open={!!target}
        title="Đổi trạng thái nhà cung cấp"
        pending={status.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (target)
            status.mutate(target, { onSuccess: () => setTarget(null) });
        }}
      >
        {target?.name}
      </ConfirmDialog>
    </>
  );
}
