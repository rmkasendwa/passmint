import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServerEventDetail } from "../../../components/server-event-detail";
import { getEventForPage } from "../../../server-events";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const returnToParam = (await searchParams).returnTo;
  const returnTo = Array.isArray(returnToParam)
    ? returnToParam[0]
    : returnToParam;
  const event = await getEventForPage(eventId);

  if (!event) notFound();

  return <ServerEventDetail event={event} returnTo={returnTo} />;
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
