import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Manage event",
  robots: { index: false, follow: false },
};
import { ServerEventDetail } from "../../../../components/server-event-detail";
import {
  requireServerSession,
  serverPrivateData,
} from "../../../../server-session";
import type { Event } from "../../../../api";

export default async function ManagedEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await requireServerSession(
    `/dashboard/events/${encodeURIComponent(eventId)}`,
  );
  const event = await serverPrivateData<Event>(
    `/events/${encodeURIComponent(eventId)}`,
    session.token,
  );
  return <ServerEventDetail key={event.id} event={event} management />;
}
