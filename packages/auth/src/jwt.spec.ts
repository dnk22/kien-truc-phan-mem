import jwt from 'jsonwebtoken';
import { signAccessToken, verifyAccessToken, jwtSettings } from './jwt';
import { LoginRateLimiter } from './rate-limit';
const claims = {
  sub: 'user-id',
  role: 'ADMIN' as const,
  sid: 'session-id',
  version: 1,
};
describe('JWT validation', () => {
  const original = { ...process.env };
  beforeEach(() => {
    process.env.JWT_SECRET = 'unit-test-signing-secret-at-least-32-chars';
  });
  afterEach(() => {
    process.env = { ...original };
  });
  it('signs and verifies required claims', () => {
    expect(verifyAccessToken(`Bearer ${signAccessToken(claims)}`)).toEqual(
      claims,
    );
  });
  it.each([
    'absent',
    'expired',
    'issuer',
    'audience',
    'signature',
    'algorithm',
  ])('rejects %s tokens', (condition) => {
    const settings = jwtSettings();
    const token =
      condition === 'absent'
        ? undefined
        : `Bearer ${jwt.sign(claims, condition === 'signature' ? 'wrong-signature' : settings.secret, { algorithm: condition === 'algorithm' ? 'HS384' : 'HS256', expiresIn: condition === 'expired' ? -1 : 60, issuer: condition === 'issuer' ? 'wrong-issuer' : settings.issuer, audience: condition === 'audience' ? 'wrong-audience' : settings.audience })}`;
    expect(() => verifyAccessToken(token)).toThrow();
  });
  it('rejects insecure settings', () => {
    process.env.JWT_SECRET = 'short';
    expect(jwtSettings).toThrow();
  });
});
describe('login rate limit', () => {
  it('limits, expires and isolates keys', () => {
    const env = { ...process.env };
    process.env.LOGIN_RATE_LIMIT_MAX = '2';
    process.env.LOGIN_RATE_LIMIT_WINDOW_SECONDS = '1';
    jest.useFakeTimers();
    try {
      const limiter = new LoginRateLimiter();
      limiter.consume('a');
      limiter.consume('a');
      expect(() => limiter.consume('a')).toThrow();
      expect(() => limiter.consume('b')).not.toThrow();
      jest.advanceTimersByTime(1001);
      expect(() => limiter.consume('a')).not.toThrow();
    } finally {
      jest.useRealTimers();
      process.env = env;
    }
  });
});
