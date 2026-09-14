import { requireServerSession } from "../../../../server-session";

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Create an event",
  robots: { index: false, follow: false },
};
import { CreateEventForm } from "../../../../components/create-event-form";

export default async function Page() {
  await requireServerSession("/dashboard/events/new");
  return (
    <div className="site-container event-create-page">
      <CreateEventForm />
    </div>
  );
}
