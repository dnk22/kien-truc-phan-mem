import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import * as api from '../api/users.api';
import type { UserFormValues, UserAction } from '../types';
import { profileInput } from '../utils/mapping';
import { errorMessage } from '../../../shared/utils/errorMessage';
export function useUserMutations() {
  const queries = useQueryClient();
  const onSuccess = () => {
    void Promise.all([
      queries.invalidateQueries({ queryKey: ['users'] }),
      queries.invalidateQueries({ queryKey: ['profile'] }),
    ]);
    void message.success('Đã cập nhật tài khoản.');
  };
  const onError = (error: unknown) => {
    void message.error(errorMessage(error));
  };
  const save = useMutation({
    mutationFn: ({ id, values }: { id?: string; values: UserFormValues }) =>
      id ? api.updateUser(id, profileInput(values)) : api.createUser(values),
    onSuccess,
    onError,
  });
  const action = useMutation({
    mutationFn: (action: UserAction) =>
      action.kind === 'status'
        ? api.changeStatus(action.user.id, action.status)
        : api.changeRole(action.user.id, action.role),
    onSuccess,
    onError,
  });
  return { save, action };
}
