import { Card } from 'antd';
import type { TableProps } from 'antd';
import type { ReactNode } from 'react';
import { DataTable } from '../../../shared/components/DataTable';
import { ErrorState } from '../../../shared/components/ErrorState';
export function InventoryTable<T extends { id: string }>({
  error,
  retry,
  toolbar,
  ...props
}: TableProps<T> & { error: unknown; retry: () => void; toolbar?: ReactNode }) {
  return (
    <Card>
      {toolbar}
      {error ? (
        <ErrorState error={error} retry={retry} />
      ) : (
        <DataTable<T> {...props} />
      )}
    </Card>
  );
}
