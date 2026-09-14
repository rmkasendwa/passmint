import { requireServerSession } from "../../../../server-session";

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Create an event",
  robots: { index: false, follow: false },
};
import { DashboardWorkbench } from "../../../../components/dashboard-workbench";

export default async function Page() {
  await requireServerSession("/dashboard/events/new");
  return <DashboardWorkbench view="create" />;
}
