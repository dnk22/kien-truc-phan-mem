import { z } from 'zod';
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  SERVICE_CREDENTIAL: z.string().min(32),
});
export function readEnvironment(defaultPort: number, databaseName?: string) {
  const result = schema.safeParse({
    ...process.env,
    PORT: process.env.PORT ?? defaultPort,
  });
  if (!result.success)
    throw new Error(
      `Invalid environment: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}`,
    );
  if (databaseName) {
    const parsed = z.string().url().safeParse(process.env.DATABASE_URL);
    if (!parsed.success) throw new Error('Invalid environment: DATABASE_URL');
    const url = new URL(parsed.data);
    if (
      !['postgresql:', 'postgres:'].includes(url.protocol) ||
      url.pathname !== `/${databaseName}`
    )
      throw new Error('DATABASE_URL must target the owning service database');
  }
  return result.data;
}
