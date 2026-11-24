import { Badge } from 'antd';
export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      status={active ? 'success' : 'error'}
      text={active ? 'Hoạt động' : 'Đã khóa'}
    />
  );
}
