import { Select } from 'antd';
import { ROLES, type Role, type UserStatus } from '@minimart/contracts';
import { roleLabels } from '../../auth/utils/roles';
import { SearchInput } from '../../../shared/components/SearchInput';
import { TableToolbar } from '../../../shared/components/TableToolbar';
export function UserFilters({
  search,
  role,
  status,
  onSearch,
  onRole,
  onStatus,
}: {
  search: string;
  role?: Role;
  status?: UserStatus;
  onSearch: (value: string) => void;
  onRole: (value?: Role) => void;
  onStatus: (value?: UserStatus) => void;
}) {
  return (
    <TableToolbar>
      <SearchInput
        value={search}
        onChange={onSearch}
        placeholder="Tìm tên đăng nhập, họ tên"
      />
      <Select
        aria-label="Lọc vai trò"
        allowClear
        placeholder="Tất cả vai trò"
        value={role}
        onChange={onRole}
        options={ROLES.map((value) => ({ value, label: roleLabels[value] }))}
        style={{ minWidth: 180 }}
      />
      <Select
        aria-label="Lọc trạng thái"
        allowClear
        placeholder="Tất cả trạng thái"
        value={status}
        onChange={onStatus}
        options={[
          { value: 'ACTIVE', label: 'Hoạt động' },
          { value: 'LOCKED', label: 'Đã khóa' },
        ]}
        style={{ minWidth: 160 }}
      />
    </TableToolbar>
  );
}
