import { Event, getApiUrl } from './api';
import { demoEvents } from './event-utils';

const fallbackEvents = process.env.NODE_ENV === 'production' ? [] : demoEvents;
const internalApiUrl = () => process.env.API_INTERNAL_URL ?? getApiUrl();

export async function listEventsForPage(): Promise<Event[]> {
  try {
    const response = await fetch(`${internalApiUrl()}/events`, {
      cache: 'no-store',
    });

    if (!response.ok) throw new Error('Event API unavailable');

    return (await response.json()) as Event[];
  } catch (error) {
    if (process.env.NODE_ENV === 'production') throw error;
    return fallbackEvents;
  }
}

export async function getEventForPage(eventId: string): Promise<Event | null> {
  try {
    const response = await fetch(`${internalApiUrl()}/events/${eventId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Event API unavailable');
    }

    return (await response.json()) as Event;
  } catch (error) {
    if (process.env.NODE_ENV === 'production') throw error;
    return fallbackEvents.find((event) => event.id === eventId) ?? null;
  }
}
