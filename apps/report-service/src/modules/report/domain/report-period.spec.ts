import { reportPeriod } from './report-period';
describe('report timezone',()=>{
 it('uses inclusive Vietnam days and exclusive next midnight',()=>{
  const p=reportPeriod('2026-11-24','2026-11-24');
  expect(p.start.toISOString()).toBe('2026-11-23T17:00:00.000Z');
  expect(p.end.toISOString()).toBe('2026-11-24T17:00:00.000Z');
 });
 it('rejects invalid dates or reversed ranges',()=>{
  expect(()=>reportPeriod('2026-02-30','2026-03-01')).toThrow();
  expect(()=>reportPeriod('2026-11-25','2026-11-24')).toThrow();
 });
});
