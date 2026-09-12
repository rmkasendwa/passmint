import type { Event } from './api';

export type HostedEventStatus = 'all' | 'upcoming' | 'past' | 'draft' | 'cancelled';
export type HostedEventFilters = { search: string; status: HostedEventStatus; from: string; to: string; sort: 'soonest' | 'latest' };
export const emptyHostedEventFilters: HostedEventFilters = { search: '', status: 'all', from: '', to: '', sort: 'soonest' };

export function hostedEventStatus(event: Event, now: number) {
  if (event.status === 'draft' || event.status === 'cancelled') return event.status;
  return Date.parse(event.startsAt) >= now ? 'upcoming' : 'past';
}

export function filterHostedEvents(events: Event[], filters: HostedEventFilters, now: number) {
  if (filters.from && filters.to && filters.from > filters.to) return [];
  const query = filters.search.trim().toLowerCase();
  return events.filter(event => {
    if (query && !`${event.name} ${event.venue} ${event.description}`.toLowerCase().includes(query)) return false;
    if (filters.status !== 'all' && hostedEventStatus(event, now) !== filters.status) return false;
    if (filters.from || filters.to) {
      const date = new Date(event.startsAt);
      if (!Number.isFinite(date.getTime()) || date.getTime() === 0) return false;
      const localDay = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (filters.from && localDay < filters.from) return false;
      if (filters.to && localDay > filters.to) return false;
    }
    return true;
  }).sort((a, b) => {
    const left = Date.parse(a.startsAt), right = Date.parse(b.startsAt);
    // Undated drafts always follow dated events, regardless of sort direction.
    const leftMissing = !Number.isFinite(left) || left === 0;
    const rightMissing = !Number.isFinite(right) || right === 0;
    if (leftMissing !== rightMissing) return leftMissing ? 1 : -1;
    return (leftMissing ? 0 : (left - right) * (filters.sort === 'latest' ? -1 : 1)) || a.id.localeCompare(b.id);
  });
}
