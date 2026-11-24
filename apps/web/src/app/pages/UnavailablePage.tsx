import { useAuthStore } from '../../features/auth/stores/auth.store';
import { Card, Empty, Tag } from 'antd';
import { useLocation } from 'react-router-dom';
import { navigation, navigationLabel } from '../config/navigation';
import { PageHeader } from '../../shared/components/PageHeader';
export default function UnavailablePage() {
  const path = useLocation().pathname;
  const role = useAuthStore((s) => s.user?.role);
  const item = navigation.find((n) => n.path === path);
  return (
    <>
      <PageHeader
        title={item ? navigationLabel(item, role) : 'Chức năng'}
        actions={<Tag color="gold">Chưa khả dụng</Tag>}
      />
      <Card>
        <Empty description="Chức năng sẽ được triển khai ở milestone tiếp theo. Hiện chưa có dữ liệu nghiệp vụ." />
      </Card>
    </>
  );
}
