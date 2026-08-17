import { App } from '../../App';
import { listEventsForPage } from '../../server-events';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const initialEvents = await listEventsForPage();

  return <App initialEvents={initialEvents} />;
}
