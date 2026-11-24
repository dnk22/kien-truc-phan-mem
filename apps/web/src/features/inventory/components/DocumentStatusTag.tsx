import { Tag } from 'antd';
import type { InventoryDocumentStatus } from '@minimart/contracts';
const labels = { DRAFT: 'Nháp', CONFIRMED: 'Đã xác nhận', CANCELLED: 'Đã hủy' };
export function DocumentStatusTag({
  status,
}: {
  status: InventoryDocumentStatus;
}) {
  return (
    <Tag
      color={
        status === 'CONFIRMED'
          ? 'green'
          : status === 'DRAFT'
            ? 'gold'
            : 'default'
      }
    >
      {labels[status]}
    </Tag>
  );
}
