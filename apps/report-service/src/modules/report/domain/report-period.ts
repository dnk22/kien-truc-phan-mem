import type { ReportPeriod } from './report.repository';
export function reportPeriod(from: string, to: string): ReportPeriod {
  const parse = (day: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Invalid date');
    const utc = new Date(day + 'T00:00:00.000Z');
    if (
      !Number.isFinite(utc.valueOf()) ||
      utc.toISOString().slice(0, 10) !== day
    )
      throw new Error('Invalid date');
    return new Date(utc.valueOf() - 7 * 3600000);
  };
  const start = parse(from),
    last = parse(to);
  const end = new Date(last.valueOf() + 86400000);
  if (end <= start || end.valueOf() - start.valueOf() > 366 * 86400000)
    throw new Error('Invalid range');
  return { from, to, start, end };
}
