import type { Principal } from '@minimart/auth';
import type { IdentityUser } from '../../users/domain/user.repository';
export interface NewSession {
  id: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
}
export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
export interface SessionRepository {
  create(user: IdentityUser, session: NewSession): Promise<IdentityUser | null>;
  rotate(tokenHash: string, session: NewSession): Promise<IdentityUser | null>;
  revoke(tokenHash: string): Promise<void>;
  authenticate(principal: Principal): Promise<IdentityUser | null>;
  changePassword(
    userId: string,
    previousHash: string,
    passwordHash: string,
  ): Promise<boolean>;
}
