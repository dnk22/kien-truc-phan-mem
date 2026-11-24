import { fixture,business } from './verification/dev6/business.mjs';
import { faults } from './verification/dev6/faults.mjs';
if(process.env.VERIFY_DISPOSABLE !== 'true')throw new Error('Set VERIFY_DISPOSABLE=true only on an isolated local demo stack. Tests create records and may stop containers.');
try{
 const f=await fixture();
 const invoice=await business(f);
 if(process.env.VERIFY_FAULTS==='true')await faults(f,invoice);
 else console.log('NOT RUN: Compose fault tests (VERIFY_FAULTS not enabled)');
 console.log('Completed requested DEV-6 checks.');
}catch(error){console.error('FAIL',error.message);process.exitCode=1;}
