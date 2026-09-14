import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Ticket, Users } from "lucide-react";
export const metadata: Metadata = {
  title: "About",
  description:
    "Passmint connects event discovery, ticket booking and organizer tools to help people come together.",
};
export default function AboutPage() {
  return (
    <div className="site-container">
      <header className="resource-hero">
        <p className="eyebrow">GOOD PLANS START HERE</p>
        <h1>
          The best part?
          <br />
          Being there together.
        </h1>
        <p>
          Passmint is a place to discover events and a workspace for the people
          creating them. We connect the journey from finding something
          interesting to welcoming guests at the door.
        </p>
      </header>
      <section className="resource-grid" aria-label="About Passmint">
        {(
          [
            [
              Compass,
              "Find your kind of thing",
              "A concert, a community gathering, a match or a conversation. Explore events by interest, search for a venue and find a date that works.",
            ],
            [
              Ticket,
              "Know your next step",
              "Review the event details, choose your tickets and follow your booking through checkout. Clear information helps you plan with confidence.",
            ],
            [
              Users,
              "Bring people together",
              "Organizers can publish listings, manage ticket options, follow attendance and verify tickets from the same workspace.",
            ],
          ] as const
        ).map(([Icon, title, copy]) => {
          return (
            <article className="resource-card" key={title}>
              <Icon size={30} />
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          );
        })}
      </section>
      <div className="help-nudge">
        <Link href="/#events" className="button-primary">
          Find your next event <ArrowRight size={18} />
        </Link>
        <Link href="/organizers" className="text-link">
          Bring your idea to life <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
