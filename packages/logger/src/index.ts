import pino from 'pino';
export function createLogger(service: string) {
  return pino({
    name: service,
    level: process.env.LOG_LEVEL ?? 'info',
    redact: {
      paths: [
        'password',
        'passwordHash',
        'currentPassword',
        'newPassword',
        'accessToken',
        'refreshToken',
        'tokenHash',
        'token',
        'authorization',
        'cookie',
        'databaseUrl',
        'rabbitmqUrl',
        'serviceCredential',
        'req.headers.authorization',
        'req.headers.cookie',
      ],
      censor: '[REDACTED]',
    },
  });
}
