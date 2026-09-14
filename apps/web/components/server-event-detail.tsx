import type {
  Event,
  SalesSummary,
  AttendeePage,
  ScanMetrics,
  Ticket,
} from "../api";
import { getServerSession, serverPrivateData } from "../server-session";
import { EventDetail } from "./event-detail";

export async function ServerEventDetail({
  event,
  management = false,
}: {
  event: Event;
  management?: boolean;
}) {
  const session = await getServerSession();
  const owner = typeof event.owner === "string" ? event.owner : event.owner?.id;
  const isOwner =
    session && (session.user.role === "admin" || owner === session.user.id);
  const base = `/events/${encodeURIComponent(event.id)}`;
  const ticketsPromise = session
    ? serverPrivateData<Ticket[]>("/tickets/mine", session.token)
    : Promise.resolve([]);
  const reportsPromise = isOwner
    ? Promise.all([
        serverPrivateData<SalesSummary>(`${base}/sales-summary`, session.token),
        serverPrivateData<AttendeePage>(
          `${base}/attendees?search=&page=1`,
          session.token,
        ),
        serverPrivateData<ScanMetrics>(
          `${base}/scan-metrics?day=${new Date().toISOString().slice(0, 10)}`,
          session.token,
        ),
      ])
    : undefined;
  const [reports, tickets] = await Promise.all([
    reportsPromise,
    ticketsPromise,
  ]);
  return (
    <EventDetail
      event={event}
      initialNow={Date.now()}
      initialTickets={tickets.filter((ticket) => ticket.event.id === event.id)}
      management={management}
      initialReports={
        reports
          ? { sales: reports[0], attendees: reports[1], scans: reports[2] }
          : undefined
      }
    />
  );
}
