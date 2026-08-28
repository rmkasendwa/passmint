import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Ticket as TicketIcon,
} from 'lucide-react';
import Link from 'next/link';
import { EventImage } from '../components/event-image';
import { eventStatus } from '../event-utils';
import { money, shortDate } from '../formatters';
import { listEventsForPage } from '../server-events';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const events = await listEventsForPage();
  const featuredEvents = events
    .filter((event) => eventStatus(event) === 'Upcoming')
    .slice(0, 3);
  const heroEvent = featuredEvents[0] ?? events[0];

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border bg-surface-raised">
        {heroEvent && (
          <span className="absolute inset-0 -z-10 opacity-[0.42]" aria-hidden="true">
            <EventImage
              src={heroEvent.thumbnailUrl}
              name={heroEvent.name}
              fallbackClassName="event-list-card__fallback"
            />
          </span>
        )}
        <span
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--page-solid)_0%,rgb(9_10_16/88%)_42%,rgb(9_10_16/44%)_100%),linear-gradient(180deg,rgb(9_10_16/18%),var(--page-solid)_100%)]"
          aria-hidden="true"
        />

        <div className="mx-auto grid min-h-[calc(100vh-64px)] w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] content-center gap-10 py-16 max-[820px]:min-h-[680px]">
          <div className="max-w-185">
            <p className="mb-3 text-[0.78rem] font-(weight:--weight-semibold) uppercase tracking-[0.08em] text-(color:--text-soft)">
              Passmint
            </p>
            <h1 className="mb-0 text-[clamp(3.2rem,7.3vw,7.8rem)] font-(--weight-bold) leading-[0.92] text-text">
              Tickets, events, and the door in one account.
            </h1>
            <p className="mb-0 mt-5 max-w-150 text-[1.1rem] leading-normal text-text-muted">
              Discover events, reserve tickets, publish your own night, and verify entry without stitching tools together.
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
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface-muted px-5 text-[0.95rem] font-(--weight-semibold) text-text hover:border-border-strong"
              >
                <TicketIcon size={18} />
                Host an event
              </Link>
            </div>
          </div>

          {featuredEvents.length > 0 && (
            <div className="grid grid-cols-3 gap-3.5 max-[860px]:grid-cols-1">
              {featuredEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/event/${event.id}`}
                  className="grid min-h-33 grid-cols-[96px_1fr] gap-3 rounded-lg border border-border bg-[color-mix(in_srgb,var(--surface-raised)_86%,transparent)] p-2.5 text-text backdrop-blur-[18px] hover:border-border-strong max-[420px]:grid-cols-1"
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
                      <small className="mb-1 flex items-center gap-1.5 text-[0.75rem] font-(--weight-semibold) uppercase text-accent">
                        <CalendarDays size={14} />
                        {shortDate.format(new Date(event.startsAt))}
                      </small>
                      <strong className="line-clamp-2 text-[1rem] leading-tight">
                        {event.name}
                      </strong>
                    </span>
                    <span className="flex items-center justify-between gap-2 text-[0.82rem] text-text-muted">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <MapPin size={14} />
                        <span className="truncate">{event.venue}</span>
                      </span>
                      <strong className="shrink-0 text-price">
                        {money.format(event.priceCents / 100)}
                      </strong>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
