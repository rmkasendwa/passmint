import { PassmintApp } from "../../components/passmint-app";
import { AuthPageContent } from "../../components/auth-page-content";
import { listEventsForPage } from "../../server-events";
import { getInitialThemePreference } from "../../server-theme";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
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
