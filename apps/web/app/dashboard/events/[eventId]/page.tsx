import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Manage event",
  robots: { index: false, follow: false },
};
import { EventManager } from "../../../../components/event-manager";

export default async function ManagedEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <EventManager eventId={eventId} />;
}
