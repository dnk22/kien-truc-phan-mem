import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  HEALTH_PROBE,
  correlationMiddleware,
  HttpErrorFilter,
} from '@minimart/config';
import { AppModule } from './app.module';
describe('foundation HTTP contract', () => {
  it('returns liveness, readiness errors and correlation ID', async () => {
    const probe = { check: jest.fn().mockResolvedValue(undefined) };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(HEALTH_PROBE)
      .useValue(probe)
      .compile();
    const app = module.createNestApplication();
    app.use(correlationMiddleware);
    app.useGlobalFilters(new HttpErrorFilter());
    await app.init();
    try {
      await request(app.getHttpServer())
        .get('/health/live')
        .set('X-Correlation-Id', 'foundation-test')
        .expect(200)
        .expect('x-correlation-id', 'foundation-test');
      await request(app.getHttpServer()).get('/health/ready').expect(200);
      probe.check.mockRejectedValue(new Error('private database URL'));
      const failed = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(503);
      expect(failed.body.error.code).toBe('DEPENDENCY_UNAVAILABLE');
      expect(JSON.stringify(failed.body)).not.toContain('private database URL');
      await request(app.getHttpServer())
        .get('/internal/v1/anything')
        .expect(404);
    } finally {
      await app.close();
    }
  });
});
