import { timingSafeEqual } from 'node:crypto';
/** Technical credential comparison only; JWT/RBAC implementation belongs to DEV-1. */
export function matchesServiceCredential(
  actual: string | undefined,
  expected: string,
): boolean {
  if (!actual || !expected) return false;
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export * from './jwt';
export * from './guards';
export * from './rate-limit';
