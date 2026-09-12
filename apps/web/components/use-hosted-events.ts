'use client';

import { useEffect, useState } from 'react';
import { api, Event } from '../api';

export function useHostedEvents(token?: string, revision?: unknown) {
  const [state, setState] = useState<{ token?: string; events: Event[]; error: string; loading: boolean; refreshing: boolean }>({ events: [], error: '', loading: true, refreshing: true });
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (document.hidden || pending) return;
      pending = true;
      setState(current => current.token === token ? { ...current, refreshing: true } : { token, events: [], error: '', loading: true, refreshing: true });
      try {
        const events = await api.myEvents(token);
        if (active) setState({ token, events, error: '', loading: false, refreshing: false });
      } catch {
        if (active) setState(current => ({ ...current, loading: false, refreshing: false, error: 'Unable to refresh your events. Any events shown are from the last successful update.' }));
      } finally { pending = false; }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [token, reload, revision]);
  // Never render the previous account's cached event list while a new request runs.
  const current = state.token === token ? state : { events: [], error: '', loading: true, refreshing: true };
  return { ...current, refresh: () => setReload(value => value + 1) };
}
