import { Event, getApiUrl } from './api';

export async function listEventsForPage(): Promise<Event[]> {
  try {
    const response = await fetch(`${getApiUrl()}/events`, {
      cache: 'no-store',
    });

    if (!response.ok) return [];

    return (await response.json()) as Event[];
  } catch {
    return [];
  }
}
