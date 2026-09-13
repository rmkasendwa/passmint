'use client';

import { useEffect, useState } from 'react';
import { api, ScanMetrics } from '../api';
import { scanMetricsCsv } from '../scan-metrics-csv';
import { dateTime } from '../formatters';

const button = 'min-h-11 rounded-lg border border-border bg-surface-muted px-4 disabled:opacity-50';
const duration = (value: number | null) => value === null ? 'Not recorded' : `${value.toFixed(1)} ms`;
const hourLabel = (hour: string) => `${hour.slice(11, 16)} UTC`;

export function EventScanMetrics({ eventId, token }: { eventId: string; token: string }) {
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  return <section aria-label="Check-in performance" className="mb-4.5 grid min-w-0 gap-4 rounded-lg border border-border bg-surface-raised p-4.5 text-text">
    <h2 className="m-0 text-[1.55rem]">Check-in performance</h2>
    <label className="grid justify-self-start gap-2">Report date (UTC)
      <input type="date" required value={day} max="9999-12-31" min="0001-01-01" className={`${button} bg-surface-muted text-text`} onChange={event => { if (event.target.value && event.target.validity.valid) setDay(event.target.value); }} />
    </label>
    <ScanMetricsReport key={`${eventId}:${token}:${day}`} eventId={eventId} token={token} day={day} />
  </section>;
}

function ScanMetricsReport({ eventId, token, day }: { eventId: string; token: string; day: string }) {
  const [data, setData] = useState<ScanMetrics | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true, pending = false;
    const refresh = async () => {
      if (document.hidden || pending) return;
      pending = true; setRefreshing(true);
      try {
        const value = await api.scanMetrics(eventId, day, token);
        if (active) { setData(value); setError(''); }
      } catch { if (active) setError('Unable to refresh scan metrics. Any figures shown are from the last successful update.'); }
      finally { pending = false; if (active) setRefreshing(false); }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [eventId, token, day, reload]);
  function download() {
    if (!data) return;
    const url = URL.createObjectURL(new Blob([scanMetricsCsv(data)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `scan-metrics-${eventId.replace(/[^a-zA-Z0-9_-]/g, '')}-${data.day}.csv`;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const maximum = Math.max(1, ...(data?.hourly.map(row => row.attempts) ?? []));
  return <>
    <div className="flex flex-wrap gap-3">
      <button className={button} type="button" disabled={refreshing} onClick={() => setReload(value => value + 1)}>{refreshing ? 'Refreshing…' : 'Refresh metrics'}</button>
      <button className={button} type="button" disabled={!data || refreshing || Boolean(error)} onClick={download}>Export hourly CSV</button>
    </div>
    {error && <p role="alert" className="m-0">{error}</p>}
    {!data && !error && <p role="status" className="m-0">Loading scan metrics…</p>}
    {data && <>
      <dl className="m-0 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          ['Scan attempts', data.attempts.toLocaleString('en-UG')], ['Accepted check-ins', data.accepted.toLocaleString('en-UG')],
          ['Failed attempts', data.failed.toLocaleString('en-UG')], ['Duplicate attempts', data.duplicates.toLocaleString('en-UG')],
          ['Average server decision time', duration(data.averageDecisionMs)],
          ['Peak check-ins per hour', data.peakCheckInHour ? `${data.peakCheckIns} at ${hourLabel(data.peakCheckInHour)}` : 'No check-ins'],
        ].map(([label, value]) => <div key={label} className="min-w-0 rounded-lg border border-border bg-surface-muted p-3"><dt className="text-sm text-text-muted">{label}</dt><dd className="m-0 mt-2 break-words text-xl font-semibold">{value}</dd></div>)}
      </dl>
      <p className="m-0 text-sm text-text-muted">Known-ticket attempts only; unknown QR codes cannot be assigned to this event. Failed attempts include duplicates. Earlier scans were not recorded. Timing covers the server decision, including database waiting, and excludes camera reading, network travel and response generation. Timing is available for {data.timedScans} of {data.attempts} attempts.</p>
      <figure className="m-0 min-w-0">
        <figcaption className="mb-3 font-semibold">Hourly scan throughput · {data.day} (UTC)</figcaption>
        <div className="overflow-x-auto"><div role="img" aria-label="Scan attempts per UTC hour, split into accepted and failed. Exact values are in the table below." className="grid h-36 min-w-75 items-end gap-1 border-b border-border" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
          {data.hourly.map(row => <div key={row.hour} className="flex h-full flex-col justify-end" title={`${hourLabel(row.hour)}: ${row.accepted} accepted, ${row.failed} failed`}>
            <div className="bg-amber-600" style={{ height: `${row.failed / maximum * 100}%` }} />
            <div className="bg-accent" style={{ height: `${row.accepted / maximum * 100}%` }} />
          </div>)}
        </div></div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-text-muted"><span>00:00</span><span>Teal: accepted · Amber: failed · Maximum: {maximum === 1 && data.attempts === 0 ? 0 : maximum} attempts/hour</span><span>23:00</span></div>
      </figure>
      {data.attempts === 0 && <p className="m-0" role="status">No recorded scan attempts for this date.</p>}
      <p className="m-0 text-sm text-text-muted">The current hour may be incomplete. If check-in peaks tie, the earliest hour is shown.</p>
      <details><summary className="cursor-pointer">View hourly values</summary><div className="overflow-x-auto"><table className="mt-2 w-full text-left text-sm">
        <thead><tr>{['Hour (UTC)', 'Attempts', 'Accepted', 'Failed', 'Duplicates', 'Timed scans', 'Average decision time'].map(label => <th scope="col" className="p-2" key={label}>{label}</th>)}</tr></thead>
        <tbody>{data.hourly.map(row => <tr key={row.hour}><th scope="row" className="p-2 font-normal">{hourLabel(row.hour)}</th>{[row.attempts, row.accepted, row.failed, row.duplicates, row.timedScans, duration(row.averageDecisionMs)].map((value, index) => <td className="p-2" key={index}>{value}</td>)}</tr>)}</tbody>
      </table></div></details>
      <p className="m-0 text-xs text-text-muted">Updated {dateTime.format(new Date(data.generatedAt))}. Refreshes every 30 seconds while visible. CSV contains the hourly values from this update.</p>
    </>}
  </>;
}
