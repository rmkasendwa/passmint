import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServerEventDetail } from "../../../components/server-event-detail";
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

  return <ServerEventDetail event={event} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const event = await getEventForPage((await params).eventId);
  if (!event) return { title: "Event not found" };
  return {
    title: event.name,
    description: event.description.slice(0, 160),
    openGraph: {
      title: event.name + " | Passmint",
      description: event.description.slice(0, 160),
      type: "website",
      ...(event.thumbnailUrl
        ? { images: [{ url: event.thumbnailUrl, alt: event.name }] }
        : {}),
    },
  };
}
