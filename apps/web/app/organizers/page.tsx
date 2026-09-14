import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  ChartNoAxesCombined,
  ScanLine,
} from "lucide-react";
export const metadata: Metadata = {
  title: "For organizers",
  description:
    "Publish events, manage ticket sales and welcome your guests with Passmint's organizer workspace.",
};
export default function OrganizersPage() {
  return (
    <div className="site-container">
      <header className="resource-hero">
        <p className="eyebrow">YOUR IDEA. YOUR CROWD. YOUR EVENT.</p>
        <h1>
          Make something
          <br />
          worth showing up for.
        </h1>
        <p>
          You focus on the experience. Passmint brings your event page, ticket
          options, attendee list and check-in together in one place.
        </p>
        <div className="action-row mt-7">
          <Link href="/events/new" className="button-primary">
            Create your event <ArrowRight size={18} />
          </Link>
          <Link href="/help#organizers" className="text-link">
            Read the organizer guide <ArrowRight size={16} />
          </Link>
        </div>
      </header>
      <section className="resource-grid" aria-label="Organizer tools">
        {[
          {
            icon: CalendarPlus,
            title: "A page that feels like your event",
            copy: "Set the scene with your artwork and description. Add the venue, date and ticket types, then save a draft until you're ready to publish.",
            link: "/events/new",
            label: "Start creating",
          },
          {
            icon: ChartNoAxesCombined,
            title: "Know how your event is doing",
            copy: "Keep your events organized, review ticket activity and see sales reports from your workspace. Open an event to manage its ticket options and attendees.",
            link: "/reports",
            label: "Explore your reports",
          },
          {
            icon: ScanLine,
            title: "A warmer welcome at the door",
            copy: "Scan a guest's QR ticket or enter its code to check admission. See the verification result before admitting your guest.",
            link: "/check-in",
            label: "Open check-in",
          },
        ].map(({ icon: Icon, title, copy, link, label }) => (
          <article className="resource-card" key={title}>
            <Icon size={30} />
            <h2>{title}</h2>
            <p>{copy}</p>
            <Link href={link} className="text-link">
              {label}
              <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </section>
      <section className="help-nudge">
        <div>
          <h2>First event? Start with the essentials.</h2>
          <p>
            A clear description, accurate venue, great artwork and the right
            ticket options.
          </p>
        </div>
        <Link href="/help#organizers" className="text-link">
          Plan your listing <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  );
}
