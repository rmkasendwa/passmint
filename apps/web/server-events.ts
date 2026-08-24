import { Event, getApiUrl } from './api';
import { demoEvents } from './event-utils';

export async function listEventsForPage(): Promise<Event[]> {
  try {
    const response = await fetch(`${getApiUrl()}/events`, {
      cache: 'no-store',
    });

    if (!response.ok) return demoEvents;

    return (await response.json()) as Event[];
  } catch {
    return demoEvents;
  }
}

export async function getEventForPage(eventId: string): Promise<Event | null> {
  try {
    const response = await fetch(`${getApiUrl()}/events/${eventId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return demoEvents.find((event) => event.id === eventId) ?? null;
    }

    return (await response.json()) as Event;
  } catch {
    return demoEvents.find((event) => event.id === eventId) ?? null;
  }
}
