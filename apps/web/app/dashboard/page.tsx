import { PassmintApp } from "../../components/passmint-app";
import { listEventsForPage } from "../../server-events";
import { getInitialThemePreference } from "../../server-theme";
import { DashboardPageContent } from "./dashboard-page-content";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const initialEvents = await listEventsForPage();
  const initialThemePreference = await getInitialThemePreference();

  return (
    <PassmintApp
      initialEvents={initialEvents}
      initialThemePreference={initialThemePreference}
    >
      <DashboardPageContent />
    </PassmintApp>
  );
}
