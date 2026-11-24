import { useState } from 'react';
import { Button, Select } from 'antd';
import type { StockAdjustmentSummary } from '@minimart/contracts';
import { useAuthStore } from '../../auth/stores/auth.store';
import { inventoryApi, type AdjustmentValues } from '../api/inventory.api';
import { useInventoryList } from '../hooks/useInventoryList';
import { useInventoryMutation } from '../hooks/useInventoryMutation';
import { InventoryTable } from '../components/InventoryTable';
import { AdjustmentForm } from '../components/AdjustmentForm';
import { adjustmentColumns } from '../components/adjustmentColumns';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { TableToolbar } from '../../../shared/components/TableToolbar';
export default function AdjustmentsPage() {
  const manager = useAuthStore((s) => s.user?.role === 'MANAGER');
  const { filters, setFilters, query, pagination } = useInventoryList(
    'adjustments',
    inventoryApi.adjustments,
  );
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<{
    item: StockAdjustmentSummary;
    action: 'confirm' | 'cancel';
  } | null>(null);
  const save = useInventoryMutation((v: AdjustmentValues) =>
    inventoryApi.createAdjustment(v),
  );
  const action = useInventoryMutation(
    (v: { item: StockAdjustmentSummary; action: 'confirm' | 'cancel' }) =>
      inventoryApi.adjustmentAction(v.item.id, v.action),
  );
  return (
    <>
      <PageHeader
        title="Kiểm kê tồn kho"
        actions={
          <Button type="primary" onClick={() => setOpen(true)}>
            + Lập phiếu kiểm kê
          </Button>
        }
      />
      <InventoryTable<StockAdjustmentSummary>
        error={query.error}
        retry={() => void query.refetch()}
        toolbar={
          <TableToolbar>
            <Select
              allowClear
              placeholder="Trạng thái"
              options={[
                { label: 'Nháp', value: 'DRAFT' },
                { label: 'Đã xác nhận', value: 'CONFIRMED' },
                { label: 'Đã hủy', value: 'CANCELLED' },
              ]}
              value={filters.status}
              onChange={(status) => setFilters({ ...filters, status, page: 1 })}
            />
          </TableToolbar>
        }
        columns={adjustmentColumns(manager, (item, action) =>
          setTarget({ item, action }),
        )}
        dataSource={query.data?.items ?? []}
        loading={query.isFetching}
        pagination={pagination}
      />
      {open && (
        <AdjustmentForm
          pending={save.isPending}
          onCancel={() => {
            if (!save.isPending) setOpen(false);
          }}
          onSave={(v) => save.mutate(v, { onSuccess: () => setOpen(false) })}
        />
      )}
      <ConfirmDialog
        open={!!target}
        title={
          target?.action === 'confirm'
            ? 'Xác nhận điều chỉnh tồn'
            : 'Hủy phiếu kiểm kê'
        }
        pending={action.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (target)
            action.mutate(target, { onSuccess: () => setTarget(null) });
        }}
      >
        Phiếu {target?.item.id.slice(0, 8)}. Hệ thống kiểm tra lại phiên bản tồn
        kho trước khi cập nhật.
      </ConfirmDialog>
    </>
  );
}
