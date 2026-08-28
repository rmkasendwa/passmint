import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Music2,
  Ticket as TicketIcon,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Event } from '../../api';
import { DiscoveryFilters } from '../../components/discovery-filters';
import { EventImage } from '../../components/event-image';
import { FeaturedEventCarousel } from '../../components/featured-event-carousel';
import {
  categories,
  eventCategory,
  eventStatus,
} from '../../event-utils';
import { dateTime, money, shortDate } from '../../formatters';
import { listEventsForPage } from '../../server-events';

export const dynamic = 'force-dynamic';

const sectionKicker =
  'mb-2 text-[0.78rem] font-(weight:--weight-semibold) uppercase tracking-[0.08em] text-(color:--text-soft)';

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DiscoverPage({
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
  const upcomingEvents = visibleEvents.filter(
    (event) => eventStatus(event) === 'Upcoming',
  );
  const nextEvent = upcomingEvents[0] ?? visibleEvents[0];
  const venueCount = new Set(events.map((event) => event.venue)).size;
  const capacityTotal = events.reduce((total, event) => total + event.capacity, 0);

  return (
    <>
      <section className="border-b border-border bg-surface-raised">
        <div className="mx-auto grid w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] gap-6 py-8 max-[820px]:py-6">
          <div className="grid grid-cols-[1fr_auto] items-end gap-6 max-[820px]:grid-cols-1">
            <div>
              <p className={sectionKicker}>Discover Passmint</p>
              <h1 className="mb-0 max-w-180 text-[clamp(2.6rem,5.3vw,5.8rem)] font-(--weight-bold) leading-[0.98] text-text">
                Find the next room worth being in.
              </h1>
              <p className="mb-0 mt-4 max-w-160 text-[1.05rem] leading-normal text-text-muted">
                Browse live shows, community sessions, and hosted experiences with tickets ready at the door.
              </p>
            </div>

            <div className="grid min-w-70 grid-cols-3 gap-2 rounded-lg border border-border bg-surface p-2 max-[820px]:min-w-0">
              <DiscoverStat
                icon={<TicketIcon size={17} />}
                label="Events"
                value={events.length.toLocaleString('en-UG')}
              />
              <DiscoverStat
                icon={<MapPin size={17} />}
                label="Venues"
                value={venueCount.toLocaleString('en-UG')}
              />
              <DiscoverStat
                icon={<Users size={17} />}
                label="Spots"
                value={capacityTotal.toLocaleString('en-UG')}
              />
            </div>
          </div>
        </div>
      </section>

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

          {upcomingEvents.length > 0 && (
            <section aria-label="Upcoming highlights">
              <div className="mb-6.5 flex items-end justify-between gap-4">
                <div>
                  <p className={sectionKicker}>Time-sensitive picks</p>
                  <h2 className="mb-0 text-[clamp(2rem,3vw,3.15rem)] font-(--weight-bold) leading-none text-text">
                    Coming up
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5 max-[920px]:grid-cols-1">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <Link
                    key={event.id}
                    href={`/event/${event.id}`}
                    className="grid min-h-32 grid-cols-[104px_1fr] gap-3 rounded-lg border border-border bg-surface-raised p-2.5 text-text hover:border-border-strong max-[440px]:grid-cols-1"
                  >
                    <span className="relative block overflow-hidden rounded-md bg-surface-muted max-[440px]:aspect-[16/9]">
                      <EventImage
                        src={event.thumbnailUrl}
                        name={event.name}
                        fallbackClassName="event-list-card__fallback"
                      />
                    </span>
                    <span className="grid content-between gap-4 py-1">
                      <span>
                        <small className="mb-1 flex items-center gap-1.5 text-[0.75rem] font-(--weight-semibold) uppercase text-accent">
                          <CalendarDays size={14} />
                          {shortDate.format(new Date(event.startsAt))}
                        </small>
                        <strong className="line-clamp-2 text-[1.02rem] leading-tight">
                          {event.name}
                        </strong>
                      </span>
                      <span className="flex min-w-0 items-center gap-1.5 text-[0.82rem] text-text-muted">
                        <MapPin size={14} />
                        <span className="truncate">{event.venue}</span>
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
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
                        <EventImage
                          src={event.thumbnailUrl}
                          name={event.name}
                          fallbackClassName="event-list-card__fallback"
                        />
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

function DiscoverStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-2 rounded-md bg-surface-muted p-3">
      <span className="text-accent">{icon}</span>
      <strong className="text-[1.25rem] leading-none text-text">{value}</strong>
      <small className="text-[0.72rem] font-(--weight-semibold) uppercase text-text-soft">
        {label}
      </small>
    </div>
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
