import { requireServerSession, serverPrivateData } from "../../server-session";
import type { SalesSummary } from "../../api";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};
import { DashboardWorkbench } from "../../components/dashboard-workbench";

export default async function Page() {
  const session = await requireServerSession("/reports");
  const initialSales = await serverPrivateData<SalesSummary>(
    "/events/sales-summary",
    session.token,
  );
  return <DashboardWorkbench initialSales={initialSales} view="reports" />;
}
