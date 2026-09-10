'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../api';

export function EventDuplicate({ eventId, token }: { eventId: string; token: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [startsAt, setStartsAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function duplicate(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    const date = new Date(startsAt);
    if (!Number.isFinite(date.getTime()) || date <= new Date()) {
      setError('Choose a future date for the new event.');
      return;
    }
    setBusy(true);
    try {
      const copy = await api.duplicateEvent(eventId, date.toISOString(), token);
      router.push(`/dashboard/events/${copy.id}`);
    } catch (error) {
      setError((error as { message?: string }).message ?? 'Unable to duplicate event.');
      setBusy(false);
    }
  }
  const action = 'min-h-12 rounded-lg border border-border bg-surface-muted px-4 font-(--weight-bold) text-text';
  return <section className="grid gap-3 rounded-lg border border-border bg-surface-raised p-4.5">
    <button className={action} type="button" aria-expanded={open} onClick={() => setOpen(!open)} disabled={busy}>Duplicate event</button>
    {open && <form onSubmit={duplicate} className="grid gap-3">
      <p className="m-0 text-text-muted">Copy details and ticket categories into a private draft. Sales and attendees stay with the original event. Ticket sales windows shift by the change in event date; review them before publishing.</p>
      <label className="grid gap-2 text-text">New event date and time (your local time)
        <input className="min-h-11 rounded-lg border border-border bg-surface-muted px-3 text-text" type="datetime-local" required value={startsAt} onChange={event => setStartsAt(event.target.value)} disabled={busy} />
      </label>
      <button className={action} type="submit" disabled={busy}>{busy ? 'Creating draft…' : 'Create duplicate draft'}</button>
      {error && <p role="alert" className="m-0 text-text">{error}</p>}
    </form>}
  </section>;
}
