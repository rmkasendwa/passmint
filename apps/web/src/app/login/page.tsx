import { PassmintApp } from "../../features/passmint/passmint-app";
import { AuthScreen } from "../../features/passmint/screens/auth-screen";
import { listEventsForPage } from "../../server-events";
import { getInitialThemePreference } from "../../server-theme";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const initialEvents = await listEventsForPage();
  const initialThemePreference = await getInitialThemePreference();

  return (
    <PassmintApp
      initialEvents={initialEvents}
      initialThemePreference={initialThemePreference}
    >
      <AuthScreen />
    </PassmintApp>
  );
}
