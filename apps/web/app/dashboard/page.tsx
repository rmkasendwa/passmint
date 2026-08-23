import { PassmintApp } from "../../components/passmint-app";
import { DashboardPageContent } from "../../components/dashboard-page-content";
import { listEventsForPage } from "../../server-events";
import { getInitialThemePreference } from "../../server-theme";

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
