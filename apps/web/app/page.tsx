import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Ticket,
  ScanLine,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { DiscoveryFilters } from "../components/discovery-filters";
import { EventImage } from "../components/event-image";
import { categories, eventCategory, eventStatus } from "../event-utils";
import { filterEvents } from "../discovery-filter";
import { money, shortDate } from "../formatters";
import { listEventsForPage } from "../server-events";
export const dynamic = "force-dynamic";
type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
const param = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";
export async function generateMetadata({
  searchParams,
}: SearchProps): Promise<Metadata> {
  const q = param((await searchParams).q);
  return {
    title: {
      absolute:
        (q ? `Explore ${q} events` : "Discover your next great experience") +
        " | Passmint",
    },
    description:
      "Find live music, community gatherings, sports and more. Discover events and book your next experience with Passmint.",
  };
}
export default async function HomePage({ searchParams }: SearchProps) {
  const [params, events] = await Promise.all([
    searchParams,
    listEventsForPage(),
  ]);
  const query = param(params.q).trim(),
    start = param(params.start),
    end = param(params.end);
  const visibleEvents = filterEvents(events, { q: query, start, end });
  const heroEvent = events.find((event) => eventStatus(event) === "Upcoming");
  const upcoming = events
    .filter((event) => eventStatus(event) === "Upcoming")
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .slice(0, 3);
  return (
    <>
      <section className="discovery-hero site-container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> YOUR NEXT GREAT EXPERIENCE
          </p>
          <h1>
            Less scrolling.
            <br />
            More <em>being there.</em>
          </h1>
          <p className="hero-description">
            The live music. The new connections. The nights you'll talk about.
            Find your next good plan on Passmint.
          </p>
          <div className="action-row">
            <Link href="#events" className="button-primary">
              Explore events <ArrowRight size={18} />
            </Link>
            <Link href="/organizers" className="text-link">
              Hosting something? <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="hero-note">
            <Ticket size={17} />
            <span>Find your event. Get your ticket. Be part of it.</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-photo">
            <img
              src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=85"
              alt="A crowd sharing a moment at an outdoor live show"
            />
            <span className="photo-label">
              <span /> LIFE HAPPENS LIVE
            </span>
          </div>
          <span className="hero-stamp" aria-hidden="true">
            <Sparkles size={24} />
            Go make
            <br />a memory.
          </span>
          {heroEvent ? (
            <Link href={`/event/${heroEvent.id}`} className="hero-ticket">
              <span className="ticket-date">
                <strong>{new Date(heroEvent.startsAt).getDate()}</strong>
                {new Intl.DateTimeFormat("en", { month: "short" }).format(
                  new Date(heroEvent.startsAt),
                )}
              </span>
              <span>
                <small>ON THE HORIZON</small>
                <strong>{heroEvent.name}</strong>
                <span>{heroEvent.venue}</span>
              </span>
              <ArrowUpRight size={22} />
            </Link>
          ) : (
            <Link href="/organizers" className="hero-ticket">
              <Ticket size={30} />
              <span>
                <small>BRING PEOPLE TOGETHER</small>
                <strong>Your next event starts here.</strong>
                <span>Meet your organizer workspace</span>
              </span>
              <ArrowUpRight size={22} />
            </Link>
          )}
        </div>
      </section>
      <section
        className="experience-notes"
        aria-labelledby="experience-heading"
      >
        <div className="site-container">
          <div className="experience-intro">
            <p className="eyebrow">FROM FINDING YOUR PLAN TO BEING THERE</p>
            <h2 id="experience-heading">Good plans. Great memories.</h2>
            <p>
              Find something that feels like you. Get the details, grab your
              ticket, and look forward to being there.
            </p>
          </div>
          <ul>
            <li>
              <span className="experience-note-icon" aria-hidden="true">
                <Ticket size={21} />
              </span>
              <div>
                <h3>A ticket to your kind of thing</h3>
                <p>Big nights. New interests. Something for you.</p>
              </div>
            </li>
            <li>
              <span className="experience-note-icon" aria-hidden="true">
                <CalendarDays size={21} />
              </span>
              <div>
                <h3>Make a plan, then make it happen</h3>
                <p>The place, the time, the details. All in one spot.</p>
              </div>
            </li>
            <li>
              <span className="experience-note-icon" aria-hidden="true">
                <ScanLine size={21} />
              </span>
              <div>
                <h3>You're one scan away</h3>
                <p>Your QR ticket, ready when you arrive.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>
      <section id="events" className="site-container discovery-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR PEOPLE. FIND YOUR PLAN.</p>
            <h2>What are you into?</h2>
          </div>
          <span className="results-count">
            {visibleEvents.length}{" "}
            {visibleEvents.length === 1 ? "event" : "events"} to explore
          </span>
        </div>
        <div className="discovery-toolbar">
          <DiscoveryFilters
            key={`${query}-${start}-${end}`}
            query={query}
            start={start}
            end={end}
          />
        </div>
        <form
          action="/#events"
          className="category-navigation"
          aria-label="Event categories"
        >
          {start && <input type="hidden" name="start" value={start} />}{" "}
          {end && <input type="hidden" name="end" value={end} />}{" "}
          {categories.map(({ label, query: value, icon: Icon }) => (
            <button
              name="q"
              value={value}
              key={label}
              aria-pressed={query === value}
              className="discovery-category"
            >
              <Icon size={21} />
              <span>{label === "For you" ? "All events" : label}</span>
            </button>
          ))}
        </form>
        {visibleEvents.length ? (
          <div className="discovery-grid">
            {visibleEvents.map((event) => (
              <Link
                className="discovery-card"
                href={`/event/${event.id}`}
                key={event.id}
              >
                <div className="discovery-card-media">
                  <EventImage
                    src={event.thumbnailUrl}
                    name={event.name}
                    fallbackClassName="discovery-card-fallback"
                  />
                  <span className="event-category">{eventCategory(event)}</span>
                  <span className="card-arrow">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
                <div className="discovery-card-copy">
                  <span className="event-date">
                    <CalendarDays size={14} />
                    {shortDate.format(new Date(event.startsAt))}
                    <span>{eventStatus(event)}</span>
                  </span>
                  <h3>{event.name}</h3>
                  <p>
                    <MapPin size={14} />
                    {event.venue}
                  </p>
                  <div className="discovery-card-bottom">
                    <strong>
                      {event.priceCents === 0
                        ? "Free"
                        : money.format(event.priceCents / 100)}
                    </strong>
                    <span>
                      View event <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-discovery">
            <Ticket size={36} />
            <h3>
              {events.length
                ? "A different plan might be waiting."
                : "Good things are on their way."}
            </h3>
            <p>
              {events.length
                ? "Try another interest, a different date, or a venue nearby."
                : "There are no events listed yet. Have something in mind? Be the first to bring people together."}
            </p>
            <Link
              href={events.length ? "/#events" : "/organizers"}
              className="button-primary"
            >
              {events.length ? "Clear filters" : "Host an event"}
              <ArrowRight size={17} />
            </Link>
          </div>
        )}
      </section>
      {!query && !start && !end && upcoming.length > 0 && (
        <section
          className="upcoming-section"
          aria-labelledby="upcoming-heading"
        >
          <div className="site-container upcoming-layout">
            <div className="upcoming-intro">
              <p className="eyebrow">SOMETHING TO LOOK FORWARD TO</p>
              <h2 id="upcoming-heading">
                Make room for
                <br />
                <em>a good time.</em>
              </h2>
              <p>
                A few of the next experiences on the calendar. Find your people,
                pick your plan, and be there.
              </p>
              <span className="upcoming-note">
                <CalendarDays size={18} /> Coming up next
              </span>
            </div>
            <div className="upcoming-list">
              {upcoming.map((event) => (
                <Link
                  href={`/event/${event.id}`}
                  key={event.id}
                  className="upcoming-event"
                >
                  <div className="upcoming-image">
                    <EventImage
                      src={event.thumbnailUrl}
                      name={event.name}
                      fallbackClassName="upcoming-image-fallback"
                    />
                  </div>
                  <div className="upcoming-event-copy">
                    <span>{shortDate.format(new Date(event.startsAt))}</span>
                    <h3>{event.name}</h3>
                    <p>{event.venue}</p>
                  </div>
                  <ArrowUpRight size={22} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="organizer-section" aria-label="Host with Passmint">
        <div className="site-container organizer-banner">
          <div>
            <p className="eyebrow">FOR THE PEOPLE WHO BRING PEOPLE TOGETHER</p>
            <h2>
              You bring the idea.
              <br />
              We'll bring the tickets.
            </h2>
            <p>
              From your first gathering to your next big night. Publish your
              event, manage tickets, and welcome guests in one workspace.
            </p>
            <Link href="/organizers" className="button-primary">
              Meet your organizer toolkit <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="organizer-steps">
            {[
              [
                "01",
                "Make it yours",
                "Add your story, artwork, venue and ticket options.",
              ],
              [
                "02",
                "Open the doors",
                "Publish your event and share its page with your guests.",
              ],
              [
                "03",
                "Welcome everyone",
                "Follow ticket activity and scan guests in at the door.",
              ],
            ].map(([n, title, copy]) => (
              <div key={n}>
                <span>{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="site-container help-nudge">
        <div>
          <h2>A little help goes a long way.</h2>
          <p>
            Booking a ticket or planning an event? Start with our practical
            guides.
          </p>
        </div>
        <Link className="text-link" href="/help">
          Visit the help centre <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}
