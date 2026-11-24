import { readEnvironment } from './env';
describe('environment validation', () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });
  it('rejects missing service credentials and wrong owning database', () => {
    delete process.env.SERVICE_CREDENTIAL;
    expect(() => readEnvironment(3001)).toThrow('SERVICE_CREDENTIAL');
    process.env.SERVICE_CREDENTIAL = 'x'.repeat(32);
    process.env.DATABASE_URL = 'postgresql://user:private@localhost/product_db';
    expect(() => readEnvironment(3001, 'identity_db')).toThrow(
      'owning service database',
    );
  });
  it('validates port without leaking input values', () => {
    process.env.SERVICE_CREDENTIAL = 'x'.repeat(32);
    process.env.PORT = 'private-invalid';
    expect(() => readEnvironment(3001)).toThrow('Invalid environment: PORT');
    delete process.env.PORT;
    expect(readEnvironment(3001).PORT).toBe(3001);
  });
});
