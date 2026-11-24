import type { ApiSuccess, AuthResult, UserProfile } from '@minimart/contracts';
import { client, sessionClient } from '../../../shared/api/client';
import type { LoginInput, PasswordInput } from '../types';
export async function login(input: LoginInput) {
  return (
    await sessionClient.post<ApiSuccess<AuthResult>>(
      '/api/v1/auth/login',
      input,
    )
  ).data.data;
}
export async function logout() {
  await sessionClient.post('/api/v1/auth/logout');
}
export async function getMe() {
  return (await client.get<ApiSuccess<UserProfile>>('/api/v1/auth/me')).data
    .data;
}
export async function changePassword(input: PasswordInput) {
  await client.post('/api/v1/auth/change-password', input);
}
