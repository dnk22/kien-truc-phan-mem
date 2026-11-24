import { Card, Descriptions, Tabs } from 'antd';
import { useProfile } from '../hooks/useAuth';
import { roleLabels } from '../utils/roles';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingState } from '../../../shared/components/LoadingState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { StatusBadge } from '../../../shared/components/StatusBadge';
export default function ProfilePage() {
  const query = useProfile();
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const user = query.data;
  return (
    <>
      <PageHeader
        title="Thông tin cá nhân"
        description="Thông tin tài khoản và bảo mật phiên đăng nhập"
      />
      <Card>
        <Tabs
          items={[
            {
              key: 'profile',
              label: 'Hồ sơ',
              children: (
                <Descriptions
                  column={{ xs: 1, md: 2 }}
                  items={[
                    {
                      key: 'name',
                      label: 'Họ và tên',
                      children: user.fullName,
                    },
                    {
                      key: 'username',
                      label: 'Tên đăng nhập',
                      children: user.username,
                    },
                    {
                      key: 'role',
                      label: 'Vai trò',
                      children: roleLabels[user.role],
                    },
                    {
                      key: 'status',
                      label: 'Trạng thái',
                      children: (
                        <StatusBadge active={user.status === 'ACTIVE'} />
                      ),
                    },
                    {
                      key: 'email',
                      label: 'Email',
                      children: user.email || 'Chưa cập nhật',
                    },
                    {
                      key: 'phone',
                      label: 'Điện thoại',
                      children: user.phone || 'Chưa cập nhật',
                    },
                  ]}
                />
              ),
            },
            {
              key: 'password',
              label: 'Đổi mật khẩu',
              children: (
                <div className="password-form">
                  <ChangePasswordForm />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
