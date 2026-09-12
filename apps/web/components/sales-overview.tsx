'use client';

import { useEffect, useState } from 'react';
import { api, SalesSummary } from '../api';
import { dateTime, money } from '../formatters';

export function SalesOverview({ token, eventId }: { token: string; eventId?: string }) {
  const [data, setData] = useState<SalesSummary | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (document.hidden || pending) return;
      pending = true; setRefreshing(true);
      try {
        const value = await api.salesSummary(token, eventId);
        if (active) { setData(value); setError(''); }
      } catch { if (active) setError('Unable to refresh sales. Try again; any figures shown are from the last successful update.'); }
      finally { pending = false; if (active) setRefreshing(false); }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [token, eventId, reload]);
  const peak = Math.max(1, ...(data?.daily.map(day => day.ticketsIssued) ?? []));
  return <section aria-label="Sales overview" className="mb-4.5 grid min-w-0 gap-4 rounded-lg border border-border bg-surface-raised p-4.5 text-text">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="m-0 text-[1.55rem]">Sales overview</h2><p className="m-0 text-text-muted">{eventId ? 'This event' : 'All your events'} · All-time totals</p></div>
      <button type="button" disabled={refreshing} onClick={() => setReload(value => value + 1)} className="min-h-11 rounded-lg border border-border bg-surface-muted px-4 disabled:opacity-50">{refreshing ? 'Refreshing…' : 'Refresh'}</button>
    </div>
    {error && <p role="alert" className="m-0">{error}</p>}
    {!data && !error && <p role="status" className="m-0">Loading sales…</p>}
    {data && <>
      <dl className="m-0 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          ['Tickets issued', data.ticketsIssued.toLocaleString('en-UG')],
          ['Check-ins recorded', data.checkedIn.toLocaleString('en-UG')],
          ['Cancelled tickets', data.ticketsCancelled.toLocaleString('en-UG')],
          ['Remaining event capacity', `${data.remainingCapacity.toLocaleString('en-UG')}${data.unlimitedEvents ? ` + ${data.unlimitedEvents} unlimited` : ''}`],
          ['Issued face value', money.format(data.faceValueCents / 100)],
          ['Verified revenue', 'Not available'],
        ].map(([label, value]) => <div key={label} className="min-w-0 rounded-lg border border-border bg-surface-muted p-3"><dt className="text-sm text-text-muted">{label}</dt><dd className="m-0 mt-2 break-words text-xl font-semibold">{value}</dd></div>)}
      </dl>
      <p className="m-0 text-sm text-text-muted">Issued totals and face value include cancelled tickets. Face value uses saved ticket prices and is not payment received. Payment confirmation is not yet available. Remaining capacity covers published events; ticket categories and sales windows can further restrict availability.</p>
      {data.unpricedTickets > 0 && <p className="m-0 text-sm">{data.unpricedTickets} legacy ticket(s) have no saved price and are excluded from face value.</p>}
      <figure className="m-0 min-w-0">
        <figcaption className="mb-3 font-semibold">Tickets issued per day · Last 30 days (UTC)</figcaption>
        <div className="overflow-x-auto">
          <div role="img" aria-label={`Daily ticket issuance from ${data.daily[0].day} to ${data.daily[data.daily.length - 1].day}. Exact values are available in the table below.`} className="grid h-36 min-w-75 items-end gap-1 border-b border-border" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}>
            {data.daily.map(day => <div key={day.day} title={`${day.day}: ${day.ticketsIssued} tickets`} className="rounded-t bg-accent" style={{ height: `${day.ticketsIssued / peak * 100}%` }} />)}
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-text-muted"><span>{data.daily[0].day}</span><span>Peak: {peak === 1 && data.daily.every(day => day.ticketsIssued === 0) ? 0 : peak}</span><span>{data.daily[data.daily.length - 1].day}</span></div>
      </figure>
      {data.ticketsIssued === 0 && <p className="m-0">No tickets issued yet.</p>}
      <details><summary className="cursor-pointer">View daily values</summary><table className="mt-2 w-full text-left text-sm"><thead><tr><th scope="col">Date (UTC)</th><th scope="col">Tickets issued</th></tr></thead><tbody>{data.daily.map(day => <tr key={day.day}><th scope="row" className="font-normal">{day.day}</th><td>{day.ticketsIssued}</td></tr>)}</tbody></table></details>
      <p className="m-0 text-xs text-text-muted">Updated {dateTime.format(new Date(data.generatedAt))}. Refreshes every 30 seconds while visible.</p>
    </>}
  </section>;
}
