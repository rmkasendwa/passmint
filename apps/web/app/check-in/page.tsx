import { requireServerSession } from "../../server-session";

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Event check-in",
  robots: { index: false, follow: false },
};
import { DashboardWorkbench } from "../../components/dashboard-workbench";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireServerSession("/check-in");
  const eventIdParam = (await searchParams).eventId;
  const focusEventId = Array.isArray(eventIdParam)
    ? eventIdParam[0]
    : eventIdParam;
  return <DashboardWorkbench view="scan" focusEventId={focusEventId} />;
}
