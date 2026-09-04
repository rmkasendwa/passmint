import { EventManager } from '../../../../components/event-manager';

export default async function ManagedEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <EventManager eventId={eventId} />;
}
