import { PassmintApp } from "../components/passmint-app";
import { listEventsForPage } from "../server-events";
import { getInitialThemePreference } from "../server-theme";
import { HomePageContent } from "./home-page-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialEvents = await listEventsForPage();
  const initialThemePreference = await getInitialThemePreference();

  return (
    <PassmintApp
      initialEvents={initialEvents}
      initialThemePreference={initialThemePreference}
    >
      <HomePageContent />
    </PassmintApp>
  );
}
