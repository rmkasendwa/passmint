'use client';

import { useEffect, useRef, useState } from 'react';
import { api, TicketActivityPage } from '../api';
const dateTime = new Intl.DateTimeFormat('en-UG', { dateStyle: 'medium', timeStyle: 'long' });

const labels: Record<string, string> = {
  accepted: 'Check-in accepted', duplicate: 'Duplicate scan rejected',
  cancelled: 'Cancelled ticket rejected', event_cancelled: 'Cancelled event rejected',
  forbidden: 'Unauthorized operator rejected',
};

export function TicketActivity({ ticketId, token, buyerName, onClose }: { ticketId: string; token: string; buyerName: string; onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const [query, setQuery] = useState({ page: 1, refresh: 0 });
  const [data, setData] = useState<TicketActivityPage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true); setData(null); setError('');
    void api.ticketActivity(ticketId, query.page, token)
      .then(value => { if (active) setData(value); })
      .catch(reason => { if (active) setError(reason?.message ?? 'Unable to load ticket activity.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [ticketId, token, query]);
  const button = 'min-h-11 rounded-lg border border-border bg-surface-muted px-4 text-text disabled:opacity-50';
  return <section className="grid min-w-0 gap-3 rounded-lg border border-border p-4 text-text" aria-label={`Ticket activity for ${buyerName}`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="m-0" ref={heading} tabIndex={-1}>Ticket activity · {buyerName}</h3>
      <button className={button} type="button" onClick={onClose}>Close history</button>
    </div>
    <p className="m-0 text-text-muted">Scan attempts appear newest first. Device information is reported by the browser and is not a verified device identity. Earlier rejected scans were not recorded. Transfers are not yet available.</p>
    <button className={`${button} justify-self-start`} type="button" disabled={loading} onClick={() => setQuery(current => ({ page: 1, refresh: current.refresh + 1 }))}>Refresh history</button>
    {loading && <p role="status">Loading ticket activity…</p>}
    {error && <p role="alert">{error}</p>}
    {data && <>
      <p className="m-0">Ticket issued: {dateTime.format(new Date(data.issuedAt))}. Issuance does not confirm payment.</p>
      {data.legacyCheckedInAt && <p className="m-0">Earlier check-in: {dateTime.format(new Date(data.legacyCheckedInAt))}. Operator and device were not recorded.</p>}
      {data.activities.length === 0 ? <p role="status">No recorded scans on this page.</p> : <ol className="m-0 grid list-none gap-3 p-0">{data.activities.map(activity => <li className="grid gap-1 border-b border-border pb-3" key={activity.id}>
        <strong>{labels[activity.kind] ?? activity.kind}</strong>
        <time dateTime={activity.createdAt}>{dateTime.format(new Date(activity.createdAt))}</time>
        <span>Operator: {activity.operatorName} <span className="break-all text-text-muted">({activity.operatorId})</span></span>
        <span className="break-all text-text-muted">Device: {activity.device ?? 'Not reported'}</span>
      </li>)}</ol>}
      <nav className="flex flex-wrap items-center gap-3" aria-label="Ticket activity pages">
        <button className={button} type="button" disabled={query.page === 1} onClick={() => setQuery(current => ({ ...current, page: current.page - 1 }))}>Newer</button>
        <span role="status">Page {data.page}</span>
        <button className={button} type="button" disabled={!data.hasMore} onClick={() => setQuery(current => ({ ...current, page: current.page + 1 }))}>Older</button>
      </nav>
    </>}
  </section>;
}
