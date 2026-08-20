import { App } from '../../App';
import { listEventsForPage } from '../../server-events';
import { getInitialThemePreference } from '../../server-theme';

export const dynamic = 'force-dynamic';

export default async function VerifyPage() {
  const initialEvents = await listEventsForPage();
  const initialThemePreference = await getInitialThemePreference();

  return (
    <App
      initialEvents={initialEvents}
      initialThemePreference={initialThemePreference}
    />
  );
}
