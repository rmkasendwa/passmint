import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { Event } from "../api";
import { DiscoveryFilters } from "../components/discovery-filters";
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

const sectionKicker =
  "mb-2 text-[0.78rem] font-[var(--weight-semibold)] uppercase tracking-[0.08em] text-[var(--text-soft)]";
const primaryAction =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-[var(--button-bg)] px-4 font-[var(--weight-bold)] text-[var(--button-text)] hover:bg-[#fa5b2d]";
const pillPrimaryAction = `${primaryAction} justify-self-start rounded-full hover:bg-[var(--accent)] hover:text-[#081010]`;
const eventCard =
  "grid min-h-[560px] grid-rows-[minmax(238px,42%)_1fr] rounded-[20px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[0_20px_58px_rgb(0_0_0/22%)] transition hover:border-[var(--border-strong)] hover:shadow-[0_34px_90px_rgb(0_0_0/40%)] max-[820px]:min-h-[500px] max-[600px]:min-h-0 max-[600px]:grid-rows-[220px_1fr] [&_.event-card-affordance]:hover:bg-[var(--accent)] [&_.event-card-affordance]:hover:text-[#081010] [&_.event-thumbnail-card]:max-[600px]:min-h-[220px]";
const eventCardCopy =
  "grid grid-rows-[auto_auto_auto_1fr_auto] gap-4 p-[26px] max-[820px]:p-[22px]";
const eventMeta =
  "grid gap-2 [&_span]:inline-flex [&_span]:items-center [&_span]:gap-[7px] [&_span]:text-[0.94rem] [&_span]:font-[var(--weight-medium)] [&_span]:leading-[1.34] [&_span]:text-[var(--text-muted)] [&_svg]:text-[var(--accent)]";
const ticketBadge =
  "inline-flex min-h-[34px] items-center rounded-full border border-[rgb(255_255_255/14%)] bg-[rgb(0_0_0/38%)] px-3.5 text-[0.82rem] font-[var(--weight-semibold)] uppercase text-white";

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
      <section
        className="sticky top-16 z-20 grid justify-items-center gap-2.5 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-raised)_90%,transparent)] px-0 py-3 backdrop-blur-[18px] max-[820px]:top-[113px] max-[820px]:px-4"
        aria-label="Event discovery"
      >
        <DiscoveryFilters query={query} start={dateStart} end={dateEnd} />

        <form
          className="flex w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] justify-center gap-[7px] overflow-x-auto pb-0.5 max-[820px]:w-full max-[820px]:justify-start"
          aria-label="Event categories"
        >
          {categories.map(({ label, query: categoryQuery, icon: Icon }) => (
            <button
              type="submit"
              key={label}
              name="q"
              value={categoryQuery}
              data-selected={query === categoryQuery}
              className="category-pill flex min-h-[34px] flex-none items-center gap-3 rounded-full border px-3 py-0 pl-[7px] text-left shadow-none [&_svg]:size-[23px] [&_svg]:rounded-full [&_svg]:p-[5px] [&_strong]:block [&_strong]:text-[0.82rem] [&_strong]:font-[var(--weight-medium)]"
            >
              <Icon size={20} />
              <strong>{label}</strong>
            </button>
          ))}
        </form>
      </section>

      <section
        className="mx-auto mt-[26px] grid w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] max-w-[var(--content-max)] grid-cols-1 gap-[18px]"
        aria-label="Event marketplace"
      >
        <div className="grid content-start gap-[60px]">
          {featuredEvent && (
            <section className="relative grid min-h-[580px] grid-cols-1 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[0_28px_100px_rgb(0_0_0/34%)] max-[820px]:min-h-[500px] max-[820px]:rounded-[18px]">
              <EventThumbnail
                event={featuredEvent}
                tone={eventTone(0)}
                variant="featured"
              />
              <div className="absolute bottom-[clamp(28px,5vw,58px)] left-[clamp(28px,5vw,64px)] z-[4] w-[min(620px,calc(100%-56px))]">
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className={ticketBadge}>{eventStatus(featuredEvent)}</span>
                  <span className={ticketBadge}>
                    {chipDate.format(new Date(featuredEvent.startsAt))}
                  </span>
                </div>
                <p className={sectionKicker}>Featured event</p>
                <h2 className="mb-0 text-[clamp(3.2rem,7vw,6.2rem)] font-[var(--weight-bold)] leading-[0.93] text-white max-[820px]:text-5xl">
                  {featuredEvent.name}
                </h2>
                <p className="mb-0 text-[1.08rem] leading-[1.55] text-[rgb(255_255_255/78%)]">
                  {featuredEvent.description}
                </p>
                <div className="my-5 flex flex-wrap gap-2.5 [&_span]:inline-flex [&_span]:min-h-[38px] [&_span]:items-center [&_span]:gap-2 [&_span]:rounded-full [&_span]:bg-[rgb(255_255_255/12%)] [&_span]:px-[13px] [&_span]:text-[0.95rem] [&_span]:font-[var(--weight-medium)] [&_span]:text-[rgb(255_255_255/88%)]">
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
                <Link className={pillPrimaryAction} href="/tickets">
                  <TicketIcon size={18} />
                  Get tickets
                </Link>
              </div>
            </section>
          )}

          <section>
            <div className="mb-[26px] flex items-end justify-between gap-4">
              <div>
                <p className={sectionKicker}>Fresh from the platform</p>
                <h2 className="mb-0 text-[clamp(2rem,3vw,3.15rem)] font-[var(--weight-bold)] leading-none text-[var(--text)]">
                  Latest events
                </h2>
              </div>
              <Link
                className="text-base font-[var(--weight-semibold)] text-[var(--text-muted)] after:content-['_->_'] hover:text-[var(--text)]"
                href="/tickets"
              >
                See everything
              </Link>
            </div>

            {visibleEvents.length === 0 ? (
              <p className="mb-0 text-[var(--text-muted)]">
                No events match those filters.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-[22px] max-[1120px]:grid-cols-2 max-[600px]:grid-cols-1">
                {visibleEvents.map((event, index) => (
                  <Link
                    className={eventCard}
                    key={event.id}
                    href="/tickets"
                  >
                    <EventThumbnail event={event} tone={eventTone(index)} />
                    <span className={eventCardCopy}>
                      <span className="flex min-w-0 items-center justify-between gap-3 max-[600px]:gap-2">
                        <span className="inline-flex min-h-[30px] items-center rounded-full bg-[var(--accent-soft)] px-3 text-[0.76rem] font-[var(--weight-semibold)] uppercase text-[var(--accent)]">
                          {eventCategory(event)}
                        </span>
                        <span className="inline-flex min-h-[30px] flex-none items-center rounded-full text-[0.76rem] font-[var(--weight-medium)] uppercase text-[var(--text-soft)]">
                          {eventStatus(event)}
                        </span>
                      </span>
                      <strong className="min-h-[2.08em] text-[clamp(1.95rem,2.4vw,3rem)] font-[var(--weight-bold)] leading-[1.04] text-[var(--text)] max-[820px]:text-[clamp(1.7rem,8vw,2.45rem)]">
                        {event.name}
                      </strong>
                      <small className="min-h-[3.1em] text-[1.02rem] font-[var(--weight-regular)] leading-[1.55] text-[var(--text-muted)]">
                        {event.description}
                      </small>
                      <span className={eventMeta}>
                        <span>
                          <CalendarDays size={15} />
                          {shortDate.format(new Date(event.startsAt))}
                        </span>
                        <span>
                          <MapPin size={15} />
                          {event.venue}
                        </span>
                      </span>
                      <span className="mt-1.5 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-[18px]">
                        <span className="self-center text-[1.4rem] font-[var(--weight-bold)] text-[var(--price)]">
                          {money.format(event.priceCents / 100)}
                        </span>
                        <span className="event-card-affordance inline-grid size-10 flex-none place-items-center rounded-full bg-[var(--button-bg)] text-[var(--button-text)]">
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
            <section className="relative flex items-center justify-between gap-7 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[linear-gradient(135deg,rgb(121_230_217/20%),transparent_52%),linear-gradient(90deg,var(--surface-elevated),var(--surface-raised))] px-[clamp(28px,5vw,52px)] py-[clamp(28px,4vw,44px)] shadow-[inset_0_1px_0_rgb(255_255_255/7%)] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgb(255_255_255/10%),transparent_18%),linear-gradient(180deg,rgb(255_255_255/5%),transparent_42%)] max-[820px]:flex-col max-[820px]:items-stretch max-[820px]:rounded-[18px]">
              <div className="relative z-[1]">
                <p className={sectionKicker}>Next event</p>
                <h2 className="mb-2.5 max-w-[760px] text-[clamp(2.4rem,4.8vw,4.4rem)] font-[var(--weight-bold)] leading-[0.98] text-[var(--text)]">
                  {nextEvent.name}
                </h2>
                <div className="flex flex-wrap gap-2.5 max-[600px]:flex-col max-[600px]:items-start [&_span]:inline-flex [&_span]:min-h-[38px] [&_span]:items-center [&_span]:gap-2 [&_span]:rounded-full [&_span]:bg-[var(--surface-muted)] [&_span]:px-[13px] [&_span]:text-[0.95rem] [&_span]:font-[var(--weight-medium)] [&_span]:text-[var(--text-muted)] [&_svg]:text-[var(--accent)]">
                  <span>
                    <CalendarDays size={17} />
                    {dateTime.format(new Date(nextEvent.startsAt))}
                  </span>
                  <span>
                    <MapPin size={17} />
                    {nextEvent.venue}
                  </span>
                  <strong className="inline-flex min-h-[38px] items-center gap-2 rounded-full bg-[rgb(248_200_104/14%)] px-[13px] text-[0.95rem] font-[var(--weight-semibold)] text-[var(--price)]">
                    {money.format(nextEvent.priceCents / 100)}
                  </strong>
                </div>
              </div>
              <Link className={`${pillPrimaryAction} relative z-[1]`} href="/tickets">
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
