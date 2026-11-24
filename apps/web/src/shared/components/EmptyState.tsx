import { Empty } from 'antd';
export function EmptyState({
  description = 'Chưa có dữ liệu',
}: {
  description?: string;
}) {
  return (
    <Empty description={description} image={Empty.PRESENTED_IMAGE_SIMPLE} />
  );
}
