import { notFound } from "next/navigation";
import { EventDetail } from "../../../components/event-detail";
import { getEventForPage } from "../../../server-events";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEventForPage(eventId);

  if (!event) notFound();

  return <EventDetail event={event} />;
}
