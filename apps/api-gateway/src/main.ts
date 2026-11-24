import { completePublicDocument } from './openapi';
import { jwtSettings } from '@minimart/auth';
import { bootstrap } from '@minimart/config';
import { AppModule } from './app.module';
jwtSettings();
void bootstrap(
  AppModule,
  'api-gateway',
  8080,
  undefined,
  completePublicDocument,
).catch(() => {
  process.stderr.write('Startup failed: verify environment and dependencies\n');
  process.exitCode = 1;
});
