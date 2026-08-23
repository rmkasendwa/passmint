import { PassmintApp } from "../../features/passmint/passmint-app";
import { DashboardScreen } from "../../features/passmint/screens/dashboard-screen";
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
      <DashboardScreen />
    </PassmintApp>
  );
}
