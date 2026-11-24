import { hash } from 'bcrypt';
import { AuthService, hashRefresh } from './auth.service';
import type {
  IdentityUser,
  UserRepository,
} from '../../users/domain/user.repository';
import type { SessionRepository } from '../../sessions/domain/session.repository';
import { userProfile } from '../../users/application/user.mapper';
describe('authentication application', () => {
  let user: IdentityUser;
  let users: jest.Mocked<UserRepository>;
  let sessions: jest.Mocked<SessionRepository>;
  let service: AuthService;
  beforeAll(async () => {
    user = {
      id: 'test-user',
      username: 'admin',
      passwordHash: await hash('CorrectPassword!2026', 4),
      role: 'ADMIN',
      status: 'ACTIVE',
      tokenVersion: 0,
      fullName: 'Quản trị',
      email: null,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };
  });
  beforeEach(() => {
    users = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    sessions = {
      create: jest.fn(),
      rotate: jest.fn(),
      revoke: jest.fn(),
      authenticate: jest.fn(),
      changePassword: jest.fn(),
    };
    service = new AuthService(users, sessions);
  });
  it.each(['missing', 'wrong', 'locked'])(
    'rejects %s credentials',
    async (kind) => {
      users.findByUsername.mockResolvedValue(
        kind === 'missing'
          ? null
          : { ...user, status: kind === 'locked' ? 'LOCKED' : 'ACTIVE' },
      );
      await expect(
        service.login(
          'admin',
          kind === 'wrong' ? 'WrongPassword' : 'CorrectPassword!2026',
        ),
      ).rejects.toThrow();
      expect(sessions.create).not.toHaveBeenCalled();
    },
  );
  it('does not expose authentication data in profiles', () => {
    expect(userProfile(user)).not.toHaveProperty('passwordHash');
    expect(userProfile(user)).not.toHaveProperty('tokenVersion');
  });
  it('rejects a wrong current password without writing', async () => {
    users.findById.mockResolvedValue(user);
    await expect(
      service.changePassword(user.id, 'wrong', 'NewPassword!2026'),
    ).rejects.toThrow();
    expect(sessions.changePassword).not.toHaveBeenCalled();
  });
  it('updates only after validating the current password', async () => {
    users.findById.mockResolvedValue(user);
    sessions.changePassword.mockResolvedValue(true);
    await expect(
      service.changePassword(
        user.id,
        'CorrectPassword!2026',
        'NewPassword!2026',
      ),
    ).resolves.toBeDefined();
    expect(sessions.changePassword).toHaveBeenCalledWith(
      user.id,
      user.passwordHash,
      expect.not.stringContaining('NewPassword'),
    );
  });
  it('hashes refresh tokens before repository calls', async () => {
    await service.logout('opaque-token');
    expect(sessions.revoke).toHaveBeenCalledWith(hashRefresh('opaque-token'));
    expect(hashRefresh('opaque-token')).toHaveLength(64);
  });
});
