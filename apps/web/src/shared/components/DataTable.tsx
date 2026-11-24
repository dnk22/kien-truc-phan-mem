import { Table, type TableProps } from 'antd';
import { EmptyState } from './EmptyState';
export function DataTable<T extends { id: string }>(props: TableProps<T>) {
  return (
    <Table<T>
      rowKey="id"
      size="middle"
      scroll={{ x: 900 }}
      locale={{ emptyText: <EmptyState /> }}
      {...props}
    />
  );
}
