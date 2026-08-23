import { PassmintApp } from "../../components/passmint-app";
import { listEventsForPage } from "../../server-events";
import { getInitialThemePreference } from "../../server-theme";
import { AuthPageContent } from "../auth-page-content";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const initialEvents = await listEventsForPage();
  const initialThemePreference = await getInitialThemePreference();

  return (
    <PassmintApp
      initialEvents={initialEvents}
      initialThemePreference={initialThemePreference}
    >
      <AuthPageContent />
    </PassmintApp>
  );
}
