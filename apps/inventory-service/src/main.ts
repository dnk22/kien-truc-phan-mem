import { bootstrap } from '@minimart/config';
import { AppModule } from './app.module';
void bootstrap(AppModule, 'inventory-service', 3003, 'inventory_db').catch(
  () => {
    process.stderr.write(
      'Startup failed: verify environment and dependencies\n',
    );
    process.exitCode = 1;
  },
);
