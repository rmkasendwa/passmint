import {
  requireServerSession,
  serverPrivateData,
} from "../../../server-session";
import type { Event } from "../../../api";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Your events",
  robots: { index: false, follow: false },
};
import { DashboardWorkbench } from "../../../components/dashboard-workbench";

export default async function Page() {
  const session = await requireServerSession("/dashboard/events");
  const initialEvents = await serverPrivateData<Event[]>(
    "/events/mine",
    session.token,
  );
  return <DashboardWorkbench initialEvents={initialEvents} view="events" />;
}
