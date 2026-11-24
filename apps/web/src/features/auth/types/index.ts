export type {
  AuthResult,
  UserProfile,
  Role,
  UserStatus,
} from '@minimart/contracts';
export interface LoginInput {
  username: string;
  password: string;
}
export interface PasswordInput {
  currentPassword: string;
  newPassword: string;
}
