import { PassmintApp } from '../components/passmint-app';
import { HomePageContent } from '../components/home-page-content';
import { listEventsForPage } from '../server-events';
import { getInitialThemePreference } from '../server-theme';

export const dynamic = 'force-dynamic';

function getParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialEvents = await listEventsForPage();
  const initialThemePreference = await getInitialThemePreference();

  return (
    <PassmintApp
      initialEvents={initialEvents}
      initialThemePreference={initialThemePreference}
    >
      <HomePageContent
        events={initialEvents}
        filters={{
          q: getParam(params.q),
          start: getParam(params.start),
          end: getParam(params.end),
        }}
      />
    </PassmintApp>
  );
}
