import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};
import { DashboardWorkbench } from "../../../components/dashboard-workbench";

export default function Page() {
  return <DashboardWorkbench view="reports" />;
}
