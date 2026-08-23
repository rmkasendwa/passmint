import { PassmintApp } from "../../components/passmint-app";
import { TicketsPageContent } from "../../components/tickets-page-content";
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
      <TicketsPageContent />
    </PassmintApp>
  );
}
