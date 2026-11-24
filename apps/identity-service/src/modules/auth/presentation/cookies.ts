import { parse, serialize } from 'cookie';
import type { Request, Response } from 'express';
import { sessionLifetime } from '../application/auth.service';
const NAME = 'minimart_refresh';
export function refreshCookie(req: Request) {
  return parse(req.headers.cookie ?? '')[NAME];
}
export function writeRefreshCookie(
  res: Response,
  token: string,
  clear = false,
) {
  res.setHeader(
    'Set-Cookie',
    serialize(NAME, token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: clear ? 0 : sessionLifetime(),
    }),
  );
  res.setHeader('Cache-Control', 'no-store');
}
