import { Tag } from 'antd';
import type { SaleStatus } from '@minimart/contracts';
import { saleStatusLabels } from '../utils/sale-status';
export function SaleStatusTag({ status }: { status: SaleStatus }) {
  return (
    <Tag
      color={
        status === 'COMPLETED'
          ? 'green'
          : status === 'FAILED'
            ? 'red'
            : status === 'RECOVERY'
              ? 'orange'
              : status === 'CANCELLED'
                ? 'default'
                : 'blue'
      }
    >
      {saleStatusLabels[status]}
    </Tag>
  );
}
