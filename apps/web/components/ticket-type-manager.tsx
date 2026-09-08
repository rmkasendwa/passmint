'use client';
import { FormEvent, useState } from 'react';
import { Event, TicketType, request } from '../api';
import { money } from '../formatters';

function localDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
export function TicketTypeManager({ event, token, onSaved }: { event: Event; token: string; onSaved: () => Promise<void> }) {
  return <section className="grid gap-3 rounded-lg border border-border bg-surface-raised p-4 text-text">
    <h2>Ticket categories</h2>
    <p>Create General admission, VIP, Early bird, or free tickets with separate inventory.</p>
    {event.ticketTypes?.map(type => <details key={type.id} className="rounded-lg border border-border p-3">
      <summary>{type.name} · {money.format(type.priceCents / 100)} · {type.remainingCapacity ?? 'Unlimited'} remaining</summary>
      <TicketTypeForm eventId={event.id} token={token} initial={type} onSaved={onSaved} />
    </details>)}
    <details><summary>Add ticket category</summary><TicketTypeForm eventId={event.id} token={token} onSaved={onSaved} /></details>
  </section>;
}
function TicketTypeForm({ eventId, token, initial, onSaved }: { eventId: string; token: string; initial?: TicketType; onSaved: () => Promise<void> }) {
  const [values, setValues] = useState<Record<string, string>>({ name: initial?.name ?? '', price: String((initial?.priceCents ?? 0) / 100), capacity: initial?.capacity?.toString() ?? '', maxPerOrder: String(initial?.maxPerOrder ?? 10), salesStart: localDate(initial?.salesStart), salesEnd: localDate(initial?.salesEnd) });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      await request(`/events/${eventId}/ticket-types${initial ? `/${initial.id}` : ''}`, { method: initial ? 'PATCH' : 'POST', body: JSON.stringify({
        name: values.name, priceCents: Math.round(Number(values.price) * 100), capacity: values.capacity ? Number(values.capacity) : null, maxPerOrder: Number(values.maxPerOrder),
        salesStart: values.salesStart ? new Date(values.salesStart).toISOString() : null, salesEnd: values.salesEnd ? new Date(values.salesEnd).toISOString() : null,
      }) }, token);
      await onSaved(); setMessage('Ticket category saved.');
    } catch (error) { setMessage((error as { message?: string }).message ?? 'Unable to save ticket category.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-2">
    {[
      ['name', 'Category name', 'text'], ['price', 'Price in UGX (0 for free)', 'number'], ['capacity', 'Capacity (blank for unlimited)', 'number'], ['maxPerOrder', 'Maximum per order', 'number'], ['salesStart', 'Sales start (optional)', 'datetime-local'], ['salesEnd', 'Sales end (optional)', 'datetime-local'],
    ].map(([key, label, type]) => <label key={key} className="grid gap-1">{label}<input className="rounded-lg border border-border bg-surface-muted p-2 text-text" type={type} value={values[key]} onChange={e => setValues(current => ({ ...current, [key]: e.target.value }))} required={['name', 'price', 'maxPerOrder'].includes(key)} min={key === 'price' ? 0 : type === 'number' ? 1 : undefined} max={key === 'maxPerOrder' ? 100 : undefined} step={key === 'price' ? '0.01' : undefined} /></label>)}
    <button disabled={busy} className="rounded-lg bg-accent p-3 text-white">{busy ? 'Saving...' : 'Save category'}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
