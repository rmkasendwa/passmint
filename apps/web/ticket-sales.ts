import type { Event, TicketType } from './api';

export type SalesState = 'available' | 'upcoming' | 'ended' | 'sold_out' | 'unavailable';

export function ticketSalesState(event: Event | undefined, type: TicketType | undefined, now: number | null): SalesState {
  if (!event || !type || event.status === 'draft' || event.status === 'cancelled') return 'unavailable';
  if (event.soldOut || event.remainingCapacity === 0 || type.remainingCapacity === 0) return 'sold_out';
  if (now === null) return type.available ? 'available' : 'unavailable';
  const start = type.salesStart ? Date.parse(type.salesStart) : null;
  const end = type.salesEnd ? Date.parse(type.salesEnd) : null;
  if ((start !== null && !Number.isFinite(start)) || (end !== null && !Number.isFinite(end))) return 'unavailable';
  if (end !== null && now >= end) return 'ended';
  if (start !== null && now < start) return 'upcoming';
  return 'available';
}

export const salesStateLabels: Record<SalesState, string> = {
  available: 'Available', upcoming: 'Sales not yet open', ended: 'Sales ended', sold_out: 'Sold out', unavailable: 'Unavailable',
};
