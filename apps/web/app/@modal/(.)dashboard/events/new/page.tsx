import { requireServerSession } from "../../../../../server-session";
import { CreateEventModal } from "../../../../../components/create-event-modal";
export default async function Page() {
  await requireServerSession("/dashboard/events/new");
  return <CreateEventModal />;
}
