import { PassmintApp } from "../features/passmint/passmint-app";
import { HomeScreen } from "../features/passmint/screens/home-screen";
import { listEventsForPage } from "../server-events";
import { getInitialThemePreference } from "../server-theme";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialEvents = await listEventsForPage();
  const initialThemePreference = await getInitialThemePreference();

  return (
    <PassmintApp
      initialEvents={initialEvents}
      initialThemePreference={initialThemePreference}
    >
      <HomeScreen />
    </PassmintApp>
  );
}
