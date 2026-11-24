import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { refreshSession } from '../../../shared/api/client';
import * as api from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';
import { roleHome } from '../utils/roles';
import { errorMessage } from '../../../shared/utils/errorMessage';
export function useRestoreSession() {
  useEffect(() => {
    void refreshSession()
      .catch(() => {})
      .finally(() => useAuthStore.getState().finishRestoring());
  }, []);
}
export function useLogin() {
  const navigate = useNavigate();
  const queries = useQueryClient();
  return useMutation({
    mutationFn: api.login,
    onSuccess: (data) => {
      queries.clear();
      useAuthStore.getState().setSession(data.accessToken, data.user);
      navigate(roleHome[data.user.role], { replace: true });
    },
  });
}
export function useLogout() {
  const navigate = useNavigate();
  const queries = useQueryClient();
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      useAuthStore.getState().clear();
      queries.clear();
      navigate('/login', { replace: true });
    },
    onError: (error) => {
      void message.error(errorMessage(error));
    },
  });
}
export function useProfile() {
  const id = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['profile', id],
    queryFn: api.getMe,
    enabled: Boolean(id),
    retry: false,
  });
}
export function useChangePassword() {
  const navigate = useNavigate();
  const queries = useQueryClient();
  return useMutation({
    mutationFn: api.changePassword,
    onSuccess: () => {
      useAuthStore.getState().clear();
      queries.clear();
      void message.success('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
      navigate('/login', { replace: true });
    },
  });
}
