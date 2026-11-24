import { HttpException, Injectable } from '@nestjs/common';
@Injectable()
export class LoginRateLimiter {
  private readonly attempts = new Map<
    string,
    { count: number; until: number }
  >();
  consume(key: string): void {
    const now = Date.now();
    const max = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 10);
    const windowMs =
      Number(process.env.LOGIN_RATE_LIMIT_WINDOW_SECONDS ?? 60) * 1000;
    if (
      !Number.isInteger(max) ||
      max < 1 ||
      !Number.isFinite(windowMs) ||
      windowMs < 1000
    )
      throw new Error('Invalid login rate limit configuration');
    for (const [id, entry] of this.attempts)
      if (entry.until <= now) this.attempts.delete(id);
    const entry = this.attempts.get(key) ?? { count: 0, until: now + windowMs };
    if (
      entry.count >= max ||
      (!this.attempts.has(key) && this.attempts.size >= 10000)
    )
      throw new HttpException(
        {
          code: 'LOGIN_RATE_LIMITED',
          message: 'Quá nhiều lần thử. Vui lòng thử lại sau.',
        },
        429,
      );
    entry.count++;
    this.attempts.set(key, entry);
  }
}
