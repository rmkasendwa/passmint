import { requireServerSession } from "../../../server-session";

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Event check-in",
  robots: { index: false, follow: false },
};
import { DashboardWorkbench } from "../../../components/dashboard-workbench";

export default async function Page() {
  await requireServerSession("/dashboard/check-in");
  return <DashboardWorkbench view="scan" />;
}
