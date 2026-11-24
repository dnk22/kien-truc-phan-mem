import { Menu, Tag } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigation, navigationLabel } from '../config/navigation';
import { useAuthStore } from '../../features/auth/stores/auth.store';
export function SidebarNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const role = useAuthStore((s) => s.user?.role);
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <div className="sidebar-brand">
        <span className="brand-mark">M</span>
        <div>
          MiniMart<small>QUẢN LÝ CỬA HÀNG</small>
        </div>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={navigation
          .filter((item) => role && item.roles.includes(role))
          .map((item) => ({
            key: item.path,
            label: (
              <span className="nav-label">
                {navigationLabel(item, role)}
                {item.available ? null : <Tag bordered={false}>Sắp có</Tag>}
              </span>
            ),
          }))}
        onClick={({ key }) => {
          navigate(key);
          onNavigate?.();
        }}
      />
    </>
  );
}
