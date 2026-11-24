import { useState } from 'react';
import { Button, Card } from 'antd';
import type { Role, UserProfile, UserStatus } from '@minimart/contracts';
import { useUsers } from '../hooks/useUsers';
import { useUserMutations } from '../hooks/useUserMutations';
import type { UserAction, UserFormValues } from '../types';
import { userColumns } from '../components/userColumns';
import { UserForm } from '../components/UserForm';
import { UserFilters } from '../components/UserFilters';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataTable } from '../../../shared/components/DataTable';
import { ErrorState } from '../../../shared/components/ErrorState';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { roleLabels } from '../../auth/utils/roles';
export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role>();
  const [status, setStatus] = useState<UserStatus>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editor, setEditor] = useState<{ user?: UserProfile } | null>(null);
  const [action, setAction] = useState<UserAction | null>(null);
  const [pendingValues, setPendingValues] = useState<UserFormValues | null>(
    null,
  );
  const debounced = useDebounce(search.trim());
  const query = useUsers({
    page,
    pageSize,
    search: debounced || undefined,
    role,
    status,
  });
  const mutations = useUserMutations();
  const edit = (user: UserProfile) => {
    mutations.save.reset();
    setEditor({ user });
  };
  const save = (values: UserFormValues) => {
    if (editor?.user) {
      setPendingValues(values);
      return;
    }
    mutations.save.mutate({ values }, { onSuccess: () => setEditor(null) });
  };
  const confirmUpdate = () => {
    if (!pendingValues || !editor?.user) return;
    mutations.save.mutate(
      { id: editor.user.id, values: pendingValues },
      {
        onSuccess: () => {
          setEditor(null);
          setPendingValues(null);
        },
      },
    );
  };
  return (
    <>
      <PageHeader
        title="Quản lý nhân viên"
        description="Quản lý tài khoản, phân quyền và trạng thái truy cập"
        actions={
          <Button
            type="primary"
            onClick={() => {
              mutations.save.reset();
              setEditor({});
            }}
          >
            + Thêm nhân viên
          </Button>
        }
      />
      <Card>
        <UserFilters
          search={search}
          role={role}
          status={status}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onRole={(value) => {
            setRole(value);
            setPage(1);
          }}
          onStatus={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        {query.isError ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : (
          <DataTable<UserProfile>
            columns={userColumns(edit, setAction)}
            dataSource={query.data?.items ?? []}
            loading={query.isPending || query.isFetching}
            pagination={{
              current: page,
              pageSize,
              total: query.data?.total ?? 0,
              showSizeChanger: true,
              showTotal: (total) => `${total} tài khoản`,
              onChange: (next, size) => {
                setPage(size !== pageSize ? 1 : next);
                setPageSize(size);
              },
            }}
          />
        )}
      </Card>
      <UserForm
        open={Boolean(editor)}
        user={editor?.user}
        pending={mutations.save.isPending}
        error={mutations.save.error}
        onSave={save}
        onCancel={() => setEditor(null)}
      />
      <ConfirmDialog
        open={Boolean(action)}
        title={
          action?.kind === 'role'
            ? 'Xác nhận thay đổi vai trò'
            : 'Xác nhận trạng thái tài khoản'
        }
        pending={mutations.action.isPending}
        onCancel={() => setAction(null)}
        onConfirm={() => {
          if (action)
            mutations.action.mutate(action, {
              onSuccess: () => setAction(null),
            });
        }}
      >
        {action ? (
          <p>
            {action.user.username}:{' '}
            {action.kind === 'role'
              ? `chuyển sang ${roleLabels[action.role]}`
              : action.status === 'LOCKED'
                ? 'khóa tài khoản'
                : 'mở khóa tài khoản'}
            . Thay đổi quyền hoặc trạng thái sẽ kết thúc các phiên đăng nhập
            hiện tại của người này.
          </p>
        ) : null}
      </ConfirmDialog>
      <ConfirmDialog
        open={Boolean(pendingValues)}
        title="Xác nhận cập nhật thông tin"
        pending={mutations.save.isPending}
        onCancel={() => setPendingValues(null)}
        onConfirm={confirmUpdate}
      >
        <p>Lưu thay đổi thông tin của {editor?.user?.username}?</p>
      </ConfirmDialog>
    </>
  );
}
