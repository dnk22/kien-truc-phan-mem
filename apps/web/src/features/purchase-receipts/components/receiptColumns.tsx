import { Button } from 'antd';
import type { TableColumnsType } from 'antd';
import type { PurchaseReceiptSummary } from '@minimart/contracts';
import { DocumentActions } from '../../inventory/components/DocumentActions';
import { DocumentStatusTag } from '../../inventory/components/DocumentStatusTag';
import { money, formatDate } from '../../inventory/utils/format';
export function receiptColumns(
  manager: boolean,
  edit: (r: PurchaseReceiptSummary) => void,
  view: (r: PurchaseReceiptSummary) => void,
  action: (r: PurchaseReceiptSummary, a: 'confirm' | 'cancel') => void,
): TableColumnsType<PurchaseReceiptSummary> {
  return [
    { title: 'Mã phiếu', render: (_, r) => r.id.slice(0, 8) },
    { title: 'Nhà cung cấp', render: (_, r) => r.supplier.name },
    { title: 'Ngày lập', render: (_, r) => formatDate(r.createdAt) },
    {
      title: 'Tổng tiền',
      render: (_, r) =>
        money(r.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0)),
    },
    {
      title: 'Trạng thái',
      render: (_, r) => <DocumentStatusTag status={r.status} />,
    },
    {
      title: 'Thao tác',
      render: (_, r) =>
        r.status === 'DRAFT' ? (
          <DocumentActions
            canConfirm={manager}
            onView={() => view(r)}
            onEdit={() => edit(r)}
            onConfirm={() => action(r, 'confirm')}
            onCancel={() => action(r, 'cancel')}
          />
        ) : (
          <Button type="link" onClick={() => view(r)}>
            Chi tiết
          </Button>
        ),
    },
  ];
}
