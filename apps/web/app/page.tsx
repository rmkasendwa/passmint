import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  Search,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { Event } from "../api";
import { EventThumbnail } from "../components/event-thumbnail";
import {
  categories,
  eventCategory,
  eventStatus,
  eventTone,
} from "../event-utils";
import { chipDate, dateTime, money, shortDate } from "../formatters";
import { listEventsForPage } from "../server-events";

export const dynamic = "force-dynamic";

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, events] = await Promise.all([
    searchParams,
    listEventsForPage(),
  ]);
  const query = getParam(params.q)?.trim() ?? "";
  const dateStart = getParam(params.start) ?? "";
  const dateEnd = getParam(params.end) ?? "";
  const visibleEvents = filterEvents(events, {
    q: query,
    start: dateStart,
    end: dateEnd,
  });
  const featuredEvent = visibleEvents[0] ?? events[0];
  const nextEvent =
    visibleEvents.find((event) => eventStatus(event) === "Upcoming") ??
    visibleEvents[0];

  return (
    <>
      <section className="discovery-bar" aria-label="Event discovery">
        <form className="search-panel" action="/" role="search">
          <label>
            <div className="input-shell">
              <Search size={18} />
              <input
                aria-label="Search by event or venue"
                name="q"
                placeholder="Event, venue, artist, team"
                defaultValue={query}
              />
            </div>
          </label>
          <label>
            <div className="input-shell date-range-fields">
              <CalendarDays size={18} />
              <input
                aria-label="Start date"
                name="start"
                type="date"
                defaultValue={dateStart}
              />
              <input
                aria-label="End date"
                name="end"
                type="date"
                defaultValue={dateEnd}
              />
            </div>
          </label>
          <button
            className="search-button"
            type="submit"
            aria-label="Search events"
          >
            <Search size={19} />
            Search events
          </button>
        </form>

        <form className="category-strip" aria-label="Event categories">
          {categories.map(({ label, query: categoryQuery, icon: Icon }) => (
            <button
              type="submit"
              key={label}
              name="q"
              value={categoryQuery}
              className={query === categoryQuery ? "selected" : ""}
            >
              <Icon size={20} />
              <strong>{label}</strong>
            </button>
          ))}
        </form>
      </section>

      <section
        className="market-layout public-market home-feed"
        aria-label="Event marketplace"
      >
        <div className="main-column">
          {featuredEvent && (
            <section className="featured-event hero-ticket">
              <EventThumbnail
                event={featuredEvent}
                tone={eventTone(0)}
                variant="featured"
              />
              <div className="featured-copy">
                <div className="ticket-badges">
                  <span>{eventStatus(featuredEvent)}</span>
                  <span>
                    {chipDate.format(new Date(featuredEvent.startsAt))}
                  </span>
                </div>
                <p className="section-kicker">Featured event</p>
                <h2>{featuredEvent.name}</h2>
                <p>{featuredEvent.description}</p>
                <div className="event-meta">
                  <span>
                    <MapPin size={16} />
                    {featuredEvent.venue}
                  </span>
                  <span>
                    <CircleDollarSign size={16} />
                    {money.format(featuredEvent.priceCents / 100)}
                  </span>
                  <span>
                    <Users size={16} />
                    {featuredEvent.capacity.toLocaleString("en-UG")} spots
                  </span>
                </div>
                <Link className="primary-action" href="/tickets">
                  <TicketIcon size={18} />
                  Get tickets
                </Link>
              </div>
            </section>
          )}

          <section>
            <div className="section-heading">
              <div>
                <p className="section-kicker">Fresh from the platform</p>
                <h2>Latest events</h2>
              </div>
              <Link href="/tickets">See everything</Link>
            </div>

            {visibleEvents.length === 0 ? (
              <p className="muted">No events match those filters.</p>
            ) : (
              <div className="event-grid">
                {visibleEvents.map((event, index) => (
                  <Link
                    className={`event-card ${eventTone(index)}`}
                    key={event.id}
                    href="/tickets"
                  >
                    <EventThumbnail event={event} tone={eventTone(index)} />
                    <span className="event-card-copy">
                      <span className="event-card-topline">
                        <span>{eventCategory(event)}</span>
                        <span>{eventStatus(event)}</span>
                      </span>
                      <strong>{event.name}</strong>
                      <small>{event.description}</small>
                      <span className="event-card-meta">
                        <span>
                          <CalendarDays size={15} />
                          {shortDate.format(new Date(event.startsAt))}
                        </span>
                        <span>
                          <MapPin size={15} />
                          {event.venue}
                        </span>
                      </span>
                      <span className="event-card-foot">
                        <span className="event-card-price">
                          {money.format(event.priceCents / 100)}
                        </span>
                        <span className="event-card-affordance">
                          <ArrowRight size={16} />
                        </span>
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {nextEvent && (
            <section className="ticket-cta">
              <div>
                <p className="section-kicker">Next event</p>
                <h2>{nextEvent.name}</h2>
                <div className="ticket-cta-meta">
                  <span>
                    <CalendarDays size={17} />
                    {dateTime.format(new Date(nextEvent.startsAt))}
                  </span>
                  <span>
                    <MapPin size={17} />
                    {nextEvent.venue}
                  </span>
                  <strong>{money.format(nextEvent.priceCents / 100)}</strong>
                </div>
              </div>
              <Link className="primary-action" href="/tickets">
                <TicketIcon size={18} />
                Reserve spot
              </Link>
            </section>
          )}
        </div>
      </section>
    </>
  );
}

function filterEvents(
  events: Event[],
  filters: { q: string; start: string; end: string },
) {
  const normalizedQuery = filters.q.trim().toLowerCase();
  const activeEnd = filters.end || filters.start;
  const rangeStart = filters.start <= activeEnd ? filters.start : activeEnd;
  const rangeEnd = filters.start <= activeEnd ? activeEnd : filters.start;

  return events.filter((event) => {
    const haystack =
      `${event.name} ${event.description} ${event.venue}`.toLowerCase();
    const matchesQuery = normalizedQuery
      ? haystack.includes(normalizedQuery)
      : true;
    const eventDate = event.startsAt.slice(0, 10);
    const matchesDate = filters.start
      ? eventDate >= rangeStart && eventDate <= rangeEnd
      : true;

    return matchesQuery && matchesDate;
  });
}
