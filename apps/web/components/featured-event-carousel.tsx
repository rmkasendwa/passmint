"use client";

import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  MapPin,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Event } from "../api";
import { eventStatus, eventTone } from "../event-utils";
import { chipDate, money } from "../formatters";
import { EventThumbnail } from "./event-thumbnail";

const primaryAction =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-[var(--button-bg)] px-4 font-[var(--weight-bold)] text-[var(--button-text)] shadow-[0_16px_38px_rgb(0_0_0/24%)] hover:bg-[#fa5b2d]";

const sectionKicker =
  "mb-2 text-[0.78rem] font-[var(--weight-semibold)] uppercase tracking-[0.08em] text-[rgb(255_255_255/58%)]";

const ticketBadge =
  "inline-flex min-h-[34px] items-center rounded-full border border-[rgb(255_255_255/14%)] bg-[rgb(0_0_0/38%)] px-3.5 text-[0.82rem] font-[var(--weight-semibold)] uppercase text-white";

export function FeaturedEventCarousel({ events }: { events: Event[] }) {
  const featuredEvents = useMemo(() => events.slice(0, 5), [events]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeEvent = featuredEvents[activeIndex];
  const hasMultiple = featuredEvents.length > 1;

  useEffect(() => {
    if (!hasMultiple || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % featuredEvents.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [featuredEvents.length, hasMultiple, isPaused]);

  if (!activeEvent) return null;

  const goToPrevious = () => {
    setActiveIndex(
      (current) =>
        (current - 1 + featuredEvents.length) % featuredEvents.length,
    );
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % featuredEvents.length);
  };

  return (
    <section
      className="relative grid min-h-[600px] grid-cols-1 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[0_28px_100px_rgb(0_0_0/34%)] max-[820px]:min-h-[520px] max-[820px]:rounded-[18px] max-[600px]:min-h-[560px]"
      aria-label="Featured events"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <EventThumbnail
        event={activeEvent}
        tone={eventTone(activeIndex)}
        variant="featured"
      />
      <div className="absolute bottom-[clamp(30px,5vw,62px)] left-[clamp(26px,5vw,64px)] z-[4] w-[min(660px,calc(100%-56px))] max-[600px]:bottom-28">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className={ticketBadge}>{eventStatus(activeEvent)}</span>
          <span className={ticketBadge}>
            {chipDate.format(new Date(activeEvent.startsAt))}
          </span>
        </div>
        <p className={sectionKicker}>Featured event</p>
        <h2 className="mb-0 text-[clamp(3.35rem,7.2vw,6.35rem)] font-[var(--weight-bold)] leading-[0.92] text-white max-[820px]:text-5xl">
          {activeEvent.name}
        </h2>
        <p className="mb-0 mt-3 max-w-[590px] text-[1.08rem] leading-[1.5] text-[rgb(255_255_255/82%)]">
          {activeEvent.description}
        </p>
        <div className="my-5 flex flex-wrap gap-2.5 [&_span]:inline-flex [&_span]:min-h-[40px] [&_span]:items-center [&_span]:gap-2 [&_span]:rounded-full [&_span]:bg-[rgb(255_255_255/14%)] [&_span]:px-3.5 [&_span]:text-[0.95rem] [&_span]:font-[var(--weight-semibold)] [&_span]:text-[rgb(255_255_255/90%)] [&_span]:backdrop-blur-md">
          <span>
            <MapPin size={16} />
            {activeEvent.venue}
          </span>
          <span>
            <CircleDollarSign size={16} />
            {money.format(activeEvent.priceCents / 100)}
          </span>
          <span>
            <Users size={16} />
            {activeEvent.capacity.toLocaleString("en-UG")} spots
          </span>
        </div>
        <Link className={primaryAction} href="/tickets">
          <TicketIcon size={18} />
          Get tickets
        </Link>
      </div>

      {hasMultiple && (
        <div className="absolute bottom-[34px] right-[clamp(114px,9vw,132px)] z-[5] flex items-center gap-2 max-[600px]:bottom-8 max-[600px]:right-7">
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-[rgb(255_255_255/22%)] bg-[rgb(0_0_0/36%)] text-white backdrop-blur-xl transition hover:border-[rgb(255_255_255/44%)] hover:bg-[rgb(255_255_255/16%)]"
            aria-label="Previous featured event"
            onClick={goToPrevious}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-1.5 rounded-full border border-[rgb(255_255_255/16%)] bg-[rgb(0_0_0/34%)] px-2.5 py-2 backdrop-blur-xl">
            {featuredEvents.map((event, index) => (
              <button
                type="button"
                key={event.id}
                className="size-2.5 rounded-full bg-white transition data-[active=false]:bg-[rgb(255_255_255/38%)] data-[active=true]:w-6"
                data-active={index === activeIndex}
                aria-label={`Show featured event ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-[rgb(255_255_255/22%)] bg-[rgb(0_0_0/36%)] text-white backdrop-blur-xl transition hover:border-[rgb(255_255_255/44%)] hover:bg-[rgb(255_255_255/16%)]"
            aria-label="Next featured event"
            onClick={goToNext}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}
