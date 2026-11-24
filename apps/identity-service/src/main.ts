import { jwtSettings } from '@minimart/auth';
import { bootstrap } from '@minimart/config';
import { AppModule } from './app.module';
jwtSettings();
if (
  process.env.NODE_ENV === 'production' &&
  process.env.COOKIE_SECURE !== 'true'
)
  throw new Error('Production requires COOKIE_SECURE=true and HTTPS');
void bootstrap(AppModule, 'identity-service', 3001, 'identity_db').catch(() => {
  process.stderr.write('Startup failed: verify environment and dependencies\n');
  process.exitCode = 1;
});
