import type { ScanMetrics } from './api';

export function scanMetricsCsv(report: ScanMetrics): string {
  const cell = (value: string | number | null) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows: (string | number | null)[][] = [
    ['Hour (UTC)', 'Known-ticket attempts', 'Accepted', 'Failed (includes duplicates)', 'Duplicates', 'Timed scans', 'Average server decision time (ms)', 'Report generated at (UTC)'],
    ...report.hourly.map(row => [row.hour, row.attempts, row.accepted, row.failed, row.duplicates, row.timedScans, row.averageDecisionMs, report.generatedAt]),
  ];
  return rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
