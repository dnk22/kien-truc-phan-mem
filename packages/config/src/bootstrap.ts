import 'reflect-metadata';
import { BadRequestException, Type, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import { createLogger } from '@minimart/logger';
import { readEnvironment } from './env';
import { correlationMiddleware, HttpErrorFilter } from './http';
export async function bootstrap(
  module: Type<unknown>,
  name: string,
  port: number,
  databaseName?: string,
  configureDocument?: (document: OpenAPIObject) => void,
) {
  const env = readEnvironment(port, databaseName);
  process.env.SERVICE_NAME = name;
  const logger = createLogger(name);
  const app = await NestFactory.create(module, {
    logger: {
      log: (m) => logger.info(String(m)),
      error: () =>
        logger.error('Nest error; inspect service health/configuration'),
      warn: (m) => logger.warn(String(m)),
    },
  });
  app.enableShutdownHooks();
  app.use(correlationMiddleware);
  app.use(
    (
      req: { method: string; correlationId?: string },
      res: {
        statusCode: number;
        on: (event: string, callback: () => void) => void;
      },
      next: () => void,
    ) => {
      const start = performance.now();
      res.on('finish', () =>
        logger.info(
          {
            method: req.method,
            status: res.statusCode,
            correlationId: req.correlationId,
            durationMs: Math.round(performance.now() - start),
          },
          'request completed',
        ),
      );
      next();
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: () =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu không hợp lệ. Kiểm tra thông tin đã nhập.',
        }),
    }),
  );
  app.useGlobalFilters(new HttpErrorFilter());
  if (name === 'api-gateway')
    app.enableCors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Idempotency-Key',
        'X-Correlation-Id',
        'X-CSRF-Protection',
      ],
      exposedHeaders: ['X-Correlation-Id'],
    });
  const config = new DocumentBuilder()
    .setTitle(`MiniMart ${name}`)
    .setVersion(
      name === 'api-gateway' || name === 'identity-service' ? '0.1.0' : '0.0.0',
    )
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  configureDocument?.(document);
  SwaggerModule.setup('docs', app, document);
  await app.listen(env.PORT, '0.0.0.0');
  logger.info({ port: env.PORT }, 'service started');
  return app;
}
