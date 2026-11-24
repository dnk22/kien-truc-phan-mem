import { boundaries } from './verification/final/boundaries.mjs';
import { reporting } from './verification/final/reporting.mjs';
import { identity } from './verification/final/identity.mjs';
import { foundation } from './verification/final/foundation.mjs';
import { writeFileSync } from 'node:fs';
import {
  verifyDisposable,
  results,
  evidence,
  login,
} from './verification/final/context.mjs';
import { business } from './verification/final/business.mjs';
import { faults } from './verification/final/faults.mjs';
import {
  consistency,
  performanceCheck,
} from './verification/final/invariants.mjs';
import { browserCheck } from './verification/final/browser.mjs';
try {
  await verifyDisposable();
  if (process.env.VERIFY_STAGE === 'browser') {
    const fixture = {
      manager: (await login('manager')).data.accessToken,
      cashier: (await login('cashier')).data.accessToken,
    };
    await browserCheck(fixture);
  } else {
    await foundation();
    const fixture = await business();
    await identity(fixture);
    await boundaries(fixture);
    if (process.env.VERIFY_FAULTS === 'true') await faults(fixture);
    else
      console.log(
        'NOT_RUN fault injection: set VERIFY_FAULTS=true on the disposable project.',
      );
    await browserCheck(fixture);
    await consistency(fixture);
    await reporting(fixture);
    await performanceCheck(fixture);
    console.log(
      'FINAL acceptance completed: ' + results.length + ' executed cases.',
    );
  }
} catch (error) {
  console.error('FAIL ' + error.message);
  process.exitCode = 1;
} finally {
  writeFileSync(
    evidence +
      (process.env.VERIFY_STAGE === 'browser'
        ? '/acceptance-browser.json'
        : '/acceptance.json'),
    JSON.stringify(results, null, 2) + '\n',
  );
}
