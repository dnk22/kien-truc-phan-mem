import { Button, Select, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ROLES, type UserProfile } from '@minimart/contracts';
import { roleLabels } from '../../auth/utils/roles';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import type { UserAction } from '../types';
export function userColumns(
  onEdit: (user: UserProfile) => void,
  onAction: (action: UserAction) => void,
): ColumnsType<UserProfile> {
  return [
    {
      title: 'Nhân viên',
      key: 'name',
      render: (_, user) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{user.fullName}</Typography.Text>
          <Typography.Text type="secondary">@{user.username}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      render: (_, user) => (
        <Space direction="vertical" size={0}>
          <span>{user.email || '—'}</span>
          <Typography.Text type="secondary">
            {user.phone || '—'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      key: 'role',
      render: (_, user) => (
        <Select
          aria-label={`Vai trò ${user.username}`}
          value={user.role}
          style={{ width: 160 }}
          options={ROLES.map((value) => ({ value, label: roleLabels[value] }))}
          onChange={(role) => onAction({ kind: 'role', user, role })}
        />
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, user) => <StatusBadge active={user.status === 'ACTIVE'} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, user) => (
        <Space>
          <Button size="small" onClick={() => onEdit(user)}>
            Sửa
          </Button>
          <Button
            size="small"
            danger={user.status === 'ACTIVE'}
            onClick={() =>
              onAction({
                kind: 'status',
                user,
                status: user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE',
              })
            }
          >
            {user.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
          </Button>
        </Space>
      ),
    },
  ];
}
