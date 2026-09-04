'use client';
import { useEffect, useState } from 'react';
import { api, Event } from '../api';
import { useAppContext } from './app-provider';
import { EventDetail } from './event-detail';

export function EventManager({ eventId }: { eventId: string }) {
  const { session } = useAppContext();
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setEvent(null);
    setError('');
    if (session) void api.getEvent(eventId, session.token).then(value => { if (active) setEvent(value); }).catch(() => { if (active) setError('Event not found or access denied.'); });
    return () => { active = false; };
  }, [eventId, session?.token]);
  if (!session) return <p className="m-8 text-text">Sign in to manage your event.</p>;
  if (!event) return <p role="status" className="m-8 text-text">{error || 'Loading event...'}</p>;
  return <EventDetail key={event.id} event={event} />;
}
