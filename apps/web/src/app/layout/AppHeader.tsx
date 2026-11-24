import { Avatar, Breadcrumb, Button, Dropdown, Space, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { useLogout } from '../../features/auth/hooks/useAuth';
import { roleLabels } from '../../features/auth/utils/roles';
import { navigation, navigationLabel } from '../config/navigation';
export function AppHeader({ toggle }: { toggle: () => void }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogout();
  const item = navigation.find((item) => item.path === location.pathname);
  const title = item ? navigationLabel(item, user?.role) : 'MiniMart';
  return (
    <header className="app-header">
      <Space size="middle">
        <Button aria-label="Mở hoặc thu gọn menu" onClick={toggle}>
          ☰
        </Button>
        <Breadcrumb items={[{ title: 'MiniMart' }, { title }]} />
      </Space>
      <Dropdown
        menu={{
          items: [
            { key: 'profile', label: 'Thông tin cá nhân' },
            {
              key: 'logout',
              label: logout.isPending ? 'Đang đăng xuất…' : 'Đăng xuất',
              disabled: logout.isPending,
            },
          ],
          onClick: ({ key }) =>
            key === 'logout' ? logout.mutate() : navigate('/profile'),
        }}
        trigger={['click']}
      >
        <Button
          type="text"
          className="user-dropdown"
          aria-label="Tài khoản người dùng"
        >
          <Space>
            <Avatar style={{ background: '#e2f3eb', color: '#146b4a' }}>
              {user?.fullName.charAt(0)}
            </Avatar>
            <div className="user-label">
              <strong>{user?.fullName}</strong>
              <Typography.Text type="secondary">
                {user ? roleLabels[user.role] : ''}
              </Typography.Text>
            </div>
            <span aria-hidden>⌄</span>
          </Space>
        </Button>
      </Dropdown>
    </header>
  );
}
