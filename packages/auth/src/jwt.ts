import { UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { ROLES, type Role } from '@minimart/contracts';
export interface Principal {
  sub: string;
  role: Role;
  sid: string;
  version: number;
}
export function jwtSettings() {
  const secret = process.env.JWT_SECRET;
  const ttl = Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 300);
  if (
    !secret ||
    secret.length < 32 ||
    (process.env.NODE_ENV === 'production' &&
      secret.startsWith('local-demo-')) ||
    !Number.isInteger(ttl) ||
    ttl < 1 ||
    ttl > 900
  )
    throw new Error('Invalid JWT_SECRET or JWT_ACCESS_TTL_SECONDS');
  return {
    secret,
    ttl,
    issuer: process.env.JWT_ISSUER || 'minimart-identity',
    audience: process.env.JWT_AUDIENCE || 'minimart-api',
  };
}
export function signAccessToken(principal: Principal): string {
  const settings = jwtSettings();
  return jwt.sign(principal, settings.secret, {
    algorithm: 'HS256',
    expiresIn: settings.ttl,
    issuer: settings.issuer,
    audience: settings.audience,
  });
}
export function verifyAccessToken(
  authorization: string | undefined,
): Principal {
  try {
    if (!authorization?.startsWith('Bearer ')) throw new Error();
    const settings = jwtSettings();
    const value = jwt.verify(authorization.slice(7), settings.secret, {
      algorithms: ['HS256'],
      issuer: settings.issuer,
      audience: settings.audience,
    });
    if (
      typeof value === 'string' ||
      typeof value.sub !== 'string' ||
      typeof value.sid !== 'string' ||
      !ROLES.includes(value.role) ||
      !Number.isInteger(value.version) ||
      typeof value.exp !== 'number'
    )
      throw new Error();
    return {
      sub: value.sub,
      role: value.role,
      sid: value.sid,
      version: value.version,
    };
  } catch {
    throw new UnauthorizedException({
      code: 'INVALID_ACCESS_TOKEN',
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
    });
  }
}
