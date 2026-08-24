import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Music2,
  Ticket as TicketIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { Event } from '../api';
import { DiscoveryFilters } from '../components/discovery-filters';
import { FeaturedEventCarousel } from '../components/featured-event-carousel';
import {
  categories,
  eventCategory,
  eventStatus,
} from '../event-utils';
import { dateTime, money, shortDate } from '../formatters';
import { listEventsForPage } from '../server-events';

export const dynamic = 'force-dynamic';

const sectionKicker =
  'mb-2 text-[0.78rem] font-(weight:--weight-semibold) uppercase tracking-[0.08em] text-(color:--text-soft)';

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
  const query = getParam(params.q)?.trim() ?? '';
  const dateStart = getParam(params.start) ?? '';
  const dateEnd = getParam(params.end) ?? '';
  const visibleEvents = filterEvents(events, {
    q: query,
    start: dateStart,
    end: dateEnd,
  });
  const featuredEvents =
    visibleEvents.length > 0 ? visibleEvents.slice(0, 5) : events.slice(0, 5);
  const nextEvent =
    visibleEvents.find((event) => eventStatus(event) === 'Upcoming') ??
    visibleEvents[0];

  return (
    <>
      <section
        className="sticky top-16 z-20 grid justify-items-center gap-2.5 border-b border-border bg-[color-mix(in_srgb,var(--surface-raised)_90%,transparent)] px-0 py-3 backdrop-blur-[18px] max-[820px]:top-28.25 max-[820px]:px-4"
        aria-label="Event discovery"
      >
        <DiscoveryFilters query={query} start={dateStart} end={dateEnd} />

        <form
          className="flex w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] justify-center gap-1.75 overflow-x-auto pb-0.5 max-[820px]:w-full max-[820px]:justify-start"
          aria-label="Event categories"
        >
          {categories.map(({ label, query: categoryQuery, icon: Icon }) => (
            <button
              type="submit"
              key={label}
              name="q"
              value={categoryQuery}
              data-selected={query === categoryQuery}
              className="category-pill flex min-h-8.5 flex-none items-center gap-3 rounded-full border px-3 py-0 pl-1.75 text-left shadow-none [&_svg]:size-5.75 [&_svg]:rounded-full [&_svg]:p-1.25 [&_strong]:block [&_strong]:text-[0.82rem] [&_strong]:font-(--weight-medium)"
            >
              <Icon size={20} />
              <strong>{label}</strong>
            </button>
          ))}
        </form>
      </section>

      <section
        className="mx-auto mt-6.5 grid w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] max-w-(--content-max) grid-cols-1 gap-4.5"
        aria-label="Event marketplace"
      >
        <div className="grid content-start gap-15">
          {featuredEvents.length > 0 && (
            <FeaturedEventCarousel events={featuredEvents} />
          )}

            <section>
            <div id="events" className="mb-6.5 flex items-end justify-between gap-4">
              <div>
                <p className={sectionKicker}>Fresh from the platform</p>
                <h2 className="mb-0 text-[clamp(2rem,3vw,3.15rem)] font-(--weight-bold) leading-none text-text">
                  Latest events
                </h2>
              </div>
              <Link
                className="text-base font-(--weight-semibold) text-text-muted after:content-['_->_'] hover:text-text"
                href="#events"
              >
                See everything
              </Link>
            </div>

            {visibleEvents.length === 0 ? (
              <p className="mb-0 text-text-muted">
                No events match those filters.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-5.5 max-[1120px]:grid-cols-2 max-[600px]:grid-cols-1">
                {visibleEvents.map((event, index) => {
                  const isFeaturedCard = index === 0;
                  const category = eventCategory(event);
                  const CategoryIcon =
                    category === 'Music' ? Music2 : TicketIcon;

                  return (
                    <Link
                      className={`event-list-card ${
                        isFeaturedCard
                          ? 'event-list-card--gold'
                          : 'event-list-card--green'
                      }`}
                      key={event.id}
                      href={`/event/${event.id}`}
                    >
                      <span className="event-list-card__media" aria-hidden="true">
                        {event.thumbnailUrl ? (
                          <img src={event.thumbnailUrl} alt="" />
                        ) : (
                          <span className="event-list-card__fallback">
                            {event.name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="event-list-card__sheen" aria-hidden="true" />
                      <span className="event-list-card__orb" aria-hidden="true" />
                      <span className="event-list-card__arc" aria-hidden="true" />
                      <span className="event-list-card__frame" aria-hidden="true" />
                      <span className="event-list-card__chip">
                        <CategoryIcon size={17} />
                        {category}
                      </span>
                      <span className="event-list-card__content">
                        <strong className="event-list-card__title">
                          {event.name}
                        </strong>
                        <small className="event-list-card__description">
                          {event.description}
                        </small>
                        <span className="event-list-card__meta">
                          <span>
                            <CalendarDays size={15} />
                            {shortDate.format(new Date(event.startsAt))}
                          </span>
                          <span>
                            <MapPin size={15} />
                            {event.venue}
                          </span>
                        </span>
                        <span className="event-list-card__footer">
                          <span className="event-list-card__price">
                            {money.format(event.priceCents / 100)}
                          </span>
                          <span className="event-list-card__cta">
                            Get tickets
                            <ArrowRight size={16} />
                          </span>
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
          )}
        </section>

          {nextEvent && (
            <section className="next-event-panel">
              <span className="next-event-panel__sheen" aria-hidden="true" />
              <span className="next-event-panel__arc" aria-hidden="true" />
              <div className="next-event-panel__content">
                <p className="next-event-panel__kicker">Next event</p>
                <h2 className="next-event-panel__title">
                  {nextEvent.name}
                </h2>
                <div className="next-event-panel__meta">
                  <span>
                    <CalendarDays size={17} />
                    {dateTime.format(new Date(nextEvent.startsAt))}
                  </span>
                  <span>
                    <MapPin size={17} />
                    {nextEvent.venue}
                  </span>
                  <strong>
                    {money.format(nextEvent.priceCents / 100)}
                  </strong>
                </div>
              </div>
              <Link className="next-event-panel__cta" href={`/event/${nextEvent.id}`}>
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
