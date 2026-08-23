import { PassmintApp } from "../../features/passmint/passmint-app";
import { TicketsScreen } from "../../features/passmint/screens/tickets-screen";
import { listEventsForPage } from "../../server-events";
import { getInitialThemePreference } from "../../server-theme";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const initialEvents = await listEventsForPage();
  const initialThemePreference = await getInitialThemePreference();

  return (
    <PassmintApp
      initialEvents={initialEvents}
      initialThemePreference={initialThemePreference}
    >
      <TicketsScreen />
    </PassmintApp>
  );
}
