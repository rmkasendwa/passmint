import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Ticket as TicketIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { Event } from '../api';
import { DiscoveryFilters } from '../components/discovery-filters';
import { EventThumbnail } from '../components/event-thumbnail';
import { FeaturedEventCarousel } from '../components/featured-event-carousel';
import {
  categories,
  eventCategory,
  eventStatus,
  eventTone,
} from '../event-utils';
import { dateTime, money, shortDate } from '../formatters';
import { listEventsForPage } from '../server-events';

export const dynamic = 'force-dynamic';

const sectionKicker =
  'mb-2 text-[0.78rem] font-(weight:--weight-semibold) uppercase tracking-[0.08em] text-(color:--text-soft)';
const primaryAction =
  'inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-(color:--button-bg) px-4 font-(weight:--weight-bold) text-(color:--button-text) hover:bg-[#fa5b2d]';
const pillPrimaryAction = `${primaryAction} justify-self-start rounded-full hover:bg-(color:--accent) hover:text-[#081010]`;
const eventCardBase =
  'group relative isolate grid min-h-[548px] grid-rows-[minmax(236px,42%)_1fr] overflow-hidden rounded-[22px] border text-(color:--text) transition duration-300 max-[820px]:min-h-[500px] max-[600px]:min-h-0 max-[600px]:grid-rows-[228px_1fr] [&_.event-thumbnail-card]:max-[600px]:min-h-[340px]';
const eventCardStandard = `${eventCardBase} border-[rgb(73_210_190/34%)] bg-[radial-gradient(circle_at_82%_18%,rgb(102_255_226/16%),transparent_30%),linear-gradient(180deg,#071614,#06100f)] shadow-[0_22px_64px_rgb(0_0_0/30%),inset_0_1px_0_rgb(255_255_255/8%)] hover:border-[rgb(119_238_219/58%)] hover:shadow-[0_34px_90px_rgb(0_0_0/46%),0_0_0_1px_rgb(121_230_217/12%)]`;
const eventCardFeatured = `${eventCardBase} border-[rgb(246_181_61/62%)] bg-[radial-gradient(circle_at_72%_30%,rgb(246_181_61/28%),transparent_34%),radial-gradient(circle_at_20%_100%,rgb(246_181_61/14%),transparent_34%),linear-gradient(180deg,#1b130c,#0f0d0b_58%,#090908)] shadow-[0_26px_84px_rgb(0_0_0/42%),0_0_0_1px_rgb(246_181_61/13%),inset_0_1px_0_rgb(255_255_255/11%)] hover:border-[rgb(246_200_104/82%)] hover:shadow-[0_38px_110px_rgb(0_0_0/54%),0_0_38px_rgb(246_181_61/18%)]`;
const eventCardSheen =
  'pointer-events-none absolute inset-0 z-[1] opacity-95 mix-blend-screen transition duration-300 group-hover:opacity-100';
const eventCardArc =
  'pointer-events-none absolute z-[1] rounded-full border transition duration-500 group-hover:scale-[1.03]';
const eventCardCopy =
  'relative z-[3] grid grid-rows-[auto_auto_auto_1fr_auto] gap-4 px-[26px] pb-[26px] pt-[42px] max-[820px]:px-[22px] max-[820px]:pb-[22px]';
const eventMeta =
  'grid gap-2 [&_span]:inline-flex [&_span]:items-center [&_span]:gap-[7px] [&_span]:text-[0.94rem] [&_span]:font-(weight:--weight-medium) [&_span]:leading-[1.34] [&_span]:text-(color:--text-muted)';
const eventCta =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-[0.92rem] font-(--weight-bold) transition group-hover:translate-x-0.5';

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
            <div className="mb-6.5 flex items-end justify-between gap-4">
              <div>
                <p className={sectionKicker}>Fresh from the platform</p>
                <h2 className="mb-0 text-[clamp(2rem,3vw,3.15rem)] font-(--weight-bold) leading-none text-text">
                  Latest events
                </h2>
              </div>
              <Link
                className="text-base font-(--weight-semibold) text-text-muted after:content-['_->_'] hover:text-text"
                href="/tickets"
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
                  const mood = isFeaturedCard ? 'gold' : 'green';

                  return (
                    <Link
                      className={
                        isFeaturedCard ? eventCardFeatured : eventCardStandard
                      }
                      key={event.id}
                      href="/tickets"
                    >
                      <span
                        aria-hidden="true"
                        className={`${eventCardSheen} ${
                          isFeaturedCard
                            ? 'bg-[radial-gradient(circle_at_84%_4%,rgb(255_218_142/48%),transparent_24%),radial-gradient(circle_at_50%_39%,rgb(246_181_61/34%),transparent_33%),linear-gradient(115deg,transparent_0%,rgb(255_232_184/16%)_45%,transparent_58%)]'
                            : 'bg-[radial-gradient(circle_at_82%_4%,rgb(132_255_236/28%),transparent_24%),linear-gradient(115deg,transparent_0%,rgb(132_255_236/10%)_43%,transparent_58%)]'
                        }`}
                      />
                      <span
                        aria-hidden="true"
                        className={`${eventCardArc} ${
                          isFeaturedCard
                            ? '-left-14.5 top-46.25 size-77.5 border-[rgb(246_181_61/34%)] shadow-[0_0_44px_rgb(246_181_61/22%)] max-[600px]:top-42.5'
                            : '-right-19 top-41 size-62.5 border-[rgb(94_226_204/17%)] shadow-[0_0_34px_rgb(94_226_204/12%)] max-[600px]:top-39.5'
                        }`}
                      />
                      <span className="relative z-2 -mb-28 min-w-0">
                        <EventThumbnail
                          event={event}
                          tone={eventTone(index)}
                          mood={mood}
                        />
                      </span>
                      <span className={eventCardCopy}>
                        <span className="flex min-w-0 items-center justify-between gap-3 max-[600px]:gap-2">
                          <span
                            className={
                              isFeaturedCard
                                ? 'inline-flex min-h-7.5 items-center rounded-full border border-[rgb(246_181_61/28%)] bg-[rgb(246_181_61/12%)] px-3 text-[0.76rem] font-(--weight-semibold) uppercase text-[#f6c866]'
                                : 'inline-flex min-h-7.5 items-center rounded-full border border-[rgb(94_226_204/22%)] bg-[rgb(94_226_204/12%)] px-3 text-[0.76rem] font-(--weight-semibold) uppercase text-[#94f0e5]'
                            }
                          >
                            {isFeaturedCard ? 'Featured' : eventCategory(event)}
                          </span>
                          <span
                            className={
                              isFeaturedCard
                                ? 'inline-flex min-h-7.5 flex-none items-center rounded-full text-[0.76rem] font-(--weight-medium) uppercase text-[rgb(255_238_198/66%)]'
                                : 'inline-flex min-h-7.5 flex-none items-center rounded-full text-[0.76rem] font-(--weight-medium) uppercase text-[rgb(213_255_248/56%)]'
                            }
                          >
                            {eventStatus(event)}
                          </span>
                        </span>
                        <strong className="min-h-[2.08em] text-[clamp(1.95rem,2.4vw,3rem)] font-(--weight-bold) leading-[1.04] text-[#fffaf0] max-[820px]:text-[clamp(1.7rem,8vw,2.45rem)]">
                          {event.name}
                        </strong>
                        <small
                          className={
                            isFeaturedCard
                              ? 'min-h-[3.1em] text-[1.02rem] font-(--weight-regular) leading-[1.55] text-[rgb(255_246_226/74%)]'
                              : 'min-h-[3.1em] text-[1.02rem] font-(--weight-regular) leading-[1.55] text-[rgb(222_244_240/72%)]'
                          }
                        >
                          {event.description}
                        </small>
                        <span
                          className={`${eventMeta} ${
                            isFeaturedCard
                              ? '[&_span]:text-[rgb(255_246_226/76%)] [&_svg]:text-[#f6c866]'
                              : '[&_span]:text-[rgb(222_244_240/72%)] [&_svg]:text-[#5ee2cc]'
                          }`}
                        >
                          <span>
                            <CalendarDays size={15} />
                            {shortDate.format(new Date(event.startsAt))}
                          </span>
                          <span>
                            <MapPin size={15} />
                            {event.venue}
                          </span>
                        </span>
                        <span
                          className={
                            isFeaturedCard
                              ? 'mt-1.5 flex items-center justify-between gap-4 border-t border-[rgb(246_181_61/24%)] pt-4.5'
                              : 'mt-1.5 flex items-center justify-between gap-4 border-t border-[rgb(94_226_204/18%)] pt-4.5'
                          }
                        >
                          <span className="self-center text-[1.4rem] font-(--weight-bold) text-[#f6c866]">
                            {money.format(event.priceCents / 100)}
                          </span>
                          <span
                            className={`${eventCta} ${
                              isFeaturedCard
                                ? 'bg-[#f3b64b] text-[#18120a] shadow-[0_14px_32px_rgb(246_181_61/20%)] group-hover:bg-[#ffd37a]'
                                : 'bg-[rgb(17_103_89/92%)] text-[#ecfffb] shadow-[0_14px_32px_rgb(0_0_0/22%)] group-hover:bg-[#79e6d9] group-hover:text-[#07100f]'
                            }`}
                          >
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
            <section className="relative flex items-center justify-between gap-7 overflow-hidden rounded-[20px] border border-border bg-[linear-gradient(135deg,rgb(121_230_217/20%),transparent_52%),linear-gradient(90deg,var(--surface-elevated),var(--surface-raised))] px-[clamp(28px,5vw,52px)] py-[clamp(28px,4vw,44px)] shadow-[inset_0_1px_0_rgb(255_255_255/7%)] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgb(255_255_255/10%),transparent_18%),linear-gradient(180deg,rgb(255_255_255/5%),transparent_42%)] max-[820px]:flex-col max-[820px]:items-stretch max-[820px]:rounded-[18px]">
              <div className="relative z-1">
                <p className={sectionKicker}>Next event</p>
                <h2 className="mb-2.5 max-w-190 text-[clamp(2.4rem,4.8vw,4.4rem)] font-(--weight-bold) leading-[0.98] text-text">
                  {nextEvent.name}
                </h2>
                <div className="flex flex-wrap gap-2.5 max-[600px]:flex-col max-[600px]:items-start [&_span]:inline-flex [&_span]:min-h-9.5 [&_span]:items-center [&_span]:gap-2 [&_span]:rounded-full [&_span]:bg-surface-muted [&_span]:px-3.25 [&_span]:text-[0.95rem] [&_span]:font-(--weight-medium) [&_span]:text-text-muted [&_svg]:text-accent">
                  <span>
                    <CalendarDays size={17} />
                    {dateTime.format(new Date(nextEvent.startsAt))}
                  </span>
                  <span>
                    <MapPin size={17} />
                    {nextEvent.venue}
                  </span>
                  <strong className="inline-flex min-h-9.5 items-center gap-2 rounded-full bg-[rgb(248_200_104/14%)] px-3.25 text-[0.95rem] font-(--weight-semibold) text-price">
                    {money.format(nextEvent.priceCents / 100)}
                  </strong>
                </div>
              </div>
              <Link
                className={`${pillPrimaryAction} relative z-1`}
                href="/tickets"
              >
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
