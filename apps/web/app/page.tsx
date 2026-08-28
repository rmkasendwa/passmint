import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ScanLine,
  Ticket as TicketIcon,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { EventImage } from '../components/event-image';
import { FeaturedEventCarousel } from '../components/featured-event-carousel';
import { categories, eventCategory, eventStatus } from '../event-utils';
import { money, shortDate } from '../formatters';
import { listEventsForPage } from '../server-events';

export const dynamic = 'force-dynamic';

const sectionKicker =
  'mb-2 text-[0.78rem] font-(--weight-semibold) uppercase tracking-[0.08em] text-text-soft';

export default async function HomePage() {
  const events = await listEventsForPage();
  const upcomingEvents = events.filter(
    (event) => eventStatus(event) === 'Upcoming',
  );
  const featuredEvents = upcomingEvents.length > 0 ? upcomingEvents : events;
  const heroEvent = featuredEvents[0];
  const previewEvents = featuredEvents.slice(0, 6);
  const venueCount = new Set(events.map((event) => event.venue)).size;
  const capacityTotal = events.reduce((total, event) => total + event.capacity, 0);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border bg-surface-raised">
        {heroEvent && (
          <span className="absolute inset-0 -z-10 opacity-[0.36]" aria-hidden="true">
            <EventImage
              src={heroEvent.thumbnailUrl}
              name={heroEvent.name}
              fallbackClassName="event-list-card__fallback"
            />
          </span>
        )}
        <span
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--page-solid)_0%,rgb(9_10_16/86%)_47%,rgb(9_10_16/46%)_100%),linear-gradient(180deg,rgb(9_10_16/14%),var(--page-solid)_100%)]"
          aria-hidden="true"
        />

        <div className="mx-auto grid min-h-[min(740px,calc(100vh-64px))] w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] grid-cols-[minmax(0,1fr)_360px] items-center gap-12 py-14 max-[960px]:min-h-0 max-[960px]:grid-cols-1 max-[960px]:py-12">
          <div className="max-w-165">
            <p className={sectionKicker}>Passmint</p>
            <h1 className="mb-0 text-[clamp(2.7rem,5vw,5.7rem)] font-(--weight-bold) leading-[0.98] text-text">
              Events you can find, book, and enter from one place.
            </h1>
            <p className="mb-0 mt-5 max-w-145 text-[1.08rem] leading-normal text-text-muted">
              Passmint brings discovery, ticket checkout, host publishing, and gate verification into one smooth event flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/discover"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-(--button-bg) px-5 text-[0.95rem] font-(--weight-semibold) text-(--button-text) hover:opacity-[0.92]"
              >
                Discover events
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface-muted px-5 text-[0.95rem] font-(--weight-semibold) text-text hover:border-border-strong"
              >
                Sign in
              </Link>
            </div>
          </div>

          {heroEvent && (
            <Link
              href={`/event/${heroEvent.id}`}
              className="grid gap-4 rounded-lg border border-border bg-[color-mix(in_srgb,var(--surface-raised)_88%,transparent)] p-3 text-text shadow-[0_24px_80px_rgb(0_0_0/26%)] backdrop-blur-[18px] hover:border-border-strong"
            >
              <span className="relative block aspect-[4/3] overflow-hidden rounded-md bg-surface-muted">
                <EventImage
                  src={heroEvent.thumbnailUrl}
                  name={heroEvent.name}
                  fallbackClassName="event-list-card__fallback"
                />
              </span>
              <span className="grid gap-3">
                <small className="inline-flex items-center gap-1.5 text-[0.76rem] font-(--weight-semibold) uppercase text-accent">
                  <CalendarDays size={14} />
                  {shortDate.format(new Date(heroEvent.startsAt))}
                </small>
                <strong className="text-[1.45rem] leading-tight">
                  {heroEvent.name}
                </strong>
                <span className="flex min-w-0 items-center gap-2 text-[0.9rem] text-text-muted">
                  <MapPin size={15} />
                  <span className="truncate">{heroEvent.venue}</span>
                </span>
                <span className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  <strong className="text-price">
                    {money.format(heroEvent.priceCents / 100)}
                  </strong>
                  <span className="inline-flex items-center gap-1.5 text-[0.88rem] font-(--weight-semibold)">
                    View event
                    <ArrowRight size={15} />
                  </span>
                </span>
              </span>
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto grid w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] gap-15 py-14">
        {featuredEvents.length > 0 && (
          <section aria-label="Featured events">
            <div className="mb-6 flex items-end justify-between gap-4 max-[700px]:grid">
              <div>
                <p className={sectionKicker}>Featured</p>
                <h2 className="mb-0 text-[clamp(2rem,3vw,3.15rem)] font-(--weight-bold) leading-none text-text">
                  Start with these events
                </h2>
              </div>
              <Link
                href="/discover"
                className="inline-flex items-center gap-1.5 text-[0.95rem] font-(--weight-semibold) text-text-muted hover:text-text"
              >
                Full discovery
                <ArrowRight size={16} />
              </Link>
            </div>
            <FeaturedEventCarousel events={featuredEvents.slice(0, 5)} />
          </section>
        )}

        <section aria-label="Passmint overview">
          <div className="grid grid-cols-[0.8fr_1.2fr] gap-5 max-[920px]:grid-cols-1">
            <div className="rounded-lg border border-border bg-surface-raised p-6">
              <p className={sectionKicker}>At a glance</p>
              <h2 className="mb-4 text-[clamp(1.8rem,2.6vw,2.8rem)] font-(--weight-bold) leading-tight text-text">
                Built around the whole event day.
              </h2>
              <p className="mb-0 text-base leading-normal text-text-muted">
                Guests can find a plan for the weekend, organizers can publish the next one, and door teams can keep entry moving.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
              <HomeStat
                icon={<TicketIcon size={18} />}
                label="Events"
                value={events.length.toLocaleString('en-UG')}
              />
              <HomeStat
                icon={<MapPin size={18} />}
                label="Venues"
                value={venueCount.toLocaleString('en-UG')}
              />
              <HomeStat
                icon={<Users size={18} />}
                label="Ticket spots"
                value={capacityTotal.toLocaleString('en-UG')}
              />
            </div>
          </div>
        </section>

        {previewEvents.length > 0 && (
          <section aria-label="Upcoming events">
            <div className="mb-6 flex items-end justify-between gap-4 max-[700px]:grid">
              <div>
                <p className={sectionKicker}>Upcoming</p>
                <h2 className="mb-0 text-[clamp(2rem,3vw,3.15rem)] font-(--weight-bold) leading-none text-text">
                  On the calendar
                </h2>
              </div>
              <Link
                href="/discover#events"
                className="inline-flex items-center gap-1.5 text-[0.95rem] font-(--weight-semibold) text-text-muted hover:text-text"
              >
                Browse all
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3.5 max-[980px]:grid-cols-2 max-[620px]:grid-cols-1">
              {previewEvents.map((event) => {
                const category = eventCategory(event);

                return (
                  <Link
                    key={event.id}
                    href={`/event/${event.id}`}
                    className="grid min-h-36 grid-cols-[108px_1fr] gap-3 rounded-lg border border-border bg-surface-raised p-2.5 text-text hover:border-border-strong max-[420px]:grid-cols-1"
                  >
                    <span className="relative block overflow-hidden rounded-md bg-surface-muted max-[420px]:aspect-[16/9]">
                      <EventImage
                        src={event.thumbnailUrl}
                        name={event.name}
                        fallbackClassName="event-list-card__fallback"
                      />
                    </span>
                    <span className="grid content-between gap-4 py-1">
                      <span>
                        <small className="mb-1 text-[0.72rem] font-(--weight-semibold) uppercase text-accent">
                          {category}
                        </small>
                        <strong className="line-clamp-2 text-[1.02rem] leading-tight">
                          {event.name}
                        </strong>
                      </span>
                      <span className="grid gap-1.5 text-[0.82rem] text-text-muted">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          {shortDate.format(new Date(event.startsAt))}
                        </span>
                        <span className="flex min-w-0 items-center gap-1.5">
                          <MapPin size={14} />
                          <span className="truncate">{event.venue}</span>
                        </span>
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section aria-label="Event categories">
          <div className="mb-6">
            <p className={sectionKicker}>Browse by mood</p>
            <h2 className="mb-0 text-[clamp(2rem,3vw,3.15rem)] font-(--weight-bold) leading-none text-text">
              Pick a lane
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-3 max-[920px]:grid-cols-2 max-[520px]:grid-cols-1">
            {categories.slice(0, 4).map(({ label, query, icon: Icon }) => (
              <Link
                key={label}
                href={`/discover?q=${encodeURIComponent(query)}`}
                className="grid min-h-34 gap-5 rounded-lg border border-border bg-surface-raised p-4 text-text hover:border-border-strong"
              >
                <Icon className="text-accent" size={24} />
                <span>
                  <strong className="block text-[1.2rem] leading-tight">
                    {label}
                  </strong>
                  <small className="mt-1 block text-[0.86rem] leading-normal text-text-muted">
                    See what is live now.
                  </small>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface-raised p-6" aria-label="How Passmint works">
          <div className="mb-6 max-w-150">
            <p className={sectionKicker}>Flow</p>
            <h2 className="mb-0 text-[clamp(2rem,3vw,3.15rem)] font-(--weight-bold) leading-none text-text">
              From listing to entry.
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3 max-[820px]:grid-cols-1">
            <FlowStep
              icon={<TicketIcon size={20} />}
              title="Publish"
              copy="Create a listing with the event details, pricing, capacity, and artwork."
            />
            <FlowStep
              icon={<CheckCircle2 size={20} />}
              title="Checkout"
              copy="Guests reserve tickets and keep their booking connected to their account."
            />
            <FlowStep
              icon={<ScanLine size={20} />}
              title="Verify"
              copy="Hosts scan tickets at the door and see entry status immediately."
            />
          </div>
        </section>
      </section>
    </>
  );
}

function HomeStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid content-between rounded-lg border border-border bg-surface-raised p-5">
      <span className="mb-8 text-accent">{icon}</span>
      <strong className="text-[2rem] leading-none text-text">{value}</strong>
      <small className="mt-2 text-xs font-(--weight-semibold) uppercase text-text-soft">
        {label}
      </small>
    </div>
  );
}

function FlowStep({
  copy,
  icon,
  title,
}: {
  copy: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="grid gap-4 rounded-md bg-surface-muted p-4">
      <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
        {icon}
      </span>
      <span>
        <strong className="block text-[1.1rem] text-text">{title}</strong>
        <small className="mt-1 block text-[0.9rem] leading-normal text-text-muted">
          {copy}
        </small>
      </span>
    </div>
  );
}
