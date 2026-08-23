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
