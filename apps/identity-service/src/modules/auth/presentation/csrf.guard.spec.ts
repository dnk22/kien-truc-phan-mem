import type { ExecutionContext } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';
function context(origin: string | undefined, header: string | undefined = '1') {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { origin, 'x-csrf-protection': header } }),
    }),
  } as ExecutionContext;
}
describe('cookie action CSRF guard', () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });
  it('allows only explicit frontend/Swagger origins with the custom header', () => {
    process.env.CSRF_ALLOWED_ORIGINS =
      'http://localhost:3000, http://localhost:8080';
    const guard = new CsrfGuard();
    expect(guard.canActivate(context('http://localhost:3000'))).toBe(true);
    expect(guard.canActivate(context('http://localhost:8080'))).toBe(true);
    expect(() =>
      guard.canActivate(context('https://attacker.example')),
    ).toThrow();
    expect(() => guard.canActivate(context(undefined))).toThrow();
    expect(() =>
      guard.canActivate(context('http://localhost:3000', '')),
    ).toThrow();
  });
  it('falls back to the frontend CORS origin when no extra origins are configured', () => {
    delete process.env.CSRF_ALLOWED_ORIGINS;
    process.env.CORS_ORIGIN = 'https://frontend.example';
    const guard = new CsrfGuard();
    expect(guard.canActivate(context('https://frontend.example'))).toBe(true);
    expect(() => guard.canActivate(context('http://localhost:8080'))).toThrow();
  });
});
