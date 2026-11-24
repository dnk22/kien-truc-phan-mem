import { matchesServiceCredential } from './index';
it('rejects absent and different credentials and accepts exact matches', () => {
  expect(matchesServiceCredential(undefined, 'secret')).toBe(false);
  expect(matchesServiceCredential('a', 'secret')).toBe(false);
  expect(matchesServiceCredential('secRet', 'secret')).toBe(false);
  expect(matchesServiceCredential('secret', 'secret')).toBe(true);
  expect(matchesServiceCredential('', '')).toBe(false);
});
