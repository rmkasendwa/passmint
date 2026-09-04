'use client';

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  Music2,
  Ticket as TicketIcon,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Event } from '../api';
import { eventCategory, eventStatus } from '../event-utils';
import { chipDate, money } from '../formatters';
import { EventImage } from './event-image';

const primaryAction = 'featured-carousel__cta';

const sectionKicker =
  'mb-2 text-[0.78rem] font-(--weight-semibold) uppercase tracking-[0.08em] text-[rgb(255_246_226/62%)]';

const ticketBadge = 'featured-carousel__badge';

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

  const renderEventCopy = (event: Event) => {
    const category = eventCategory(event);
    const CategoryIcon = category === 'Music' ? Music2 : TicketIcon;

    return (
      <>
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="featured-carousel__chip">
            <CategoryIcon size={18} />
            {category}
          </span>
          <span className={ticketBadge}>
            <CalendarDays size={15} />
            {eventStatus(event)}
          </span>
          <span className={ticketBadge}>
            {chipDate.format(new Date(event.startsAt))}
          </span>
        </div>
        <p className={sectionKicker}>Featured event</p>
        <h2
          className="mb-0 line-clamp-2 max-w-230 text-[clamp(3.1rem,6.2vw,5.6rem)] font-(--weight-bold) leading-[1.2] text-white max-[820px]:max-w-[min(100%,620px)] max-[820px]:text-5xl max-[820px]:leading-[1.08]"
          title={event.name}
        >
          {event.name}
        </h2>
        <p className="mb-0 mt-3 line-clamp-2 max-w-147.5 text-[1.08rem] leading-normal text-white/82">
          {event.description}
        </p>
        <div className="featured-carousel__meta">
          <span>
            <MapPin size={16} />
            {event.venue}
          </span>
          <span>
            <CircleDollarSign size={16} />
            {money.format(event.priceCents / 100)}
          </span>
          <span>
            <Users size={16} />
            {event.capacity?.toLocaleString('en-UG') ?? 'Unlimited'} spots
          </span>
        </div>
        <Link className={primaryAction} href={`/event/${event.id}`}>
          Get tickets
          <ArrowRight size={18} />
        </Link>
      </>
    );
  };

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
      className="featured-carousel"
      aria-label="Featured events"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {featuredEvents.map((event, index) => {
        const isActive = index === activeIndex;

        return (
          <div
            key={event.id}
            className="absolute inset-0 grid transition duration-700 ease-out data-[active=false]:pointer-events-none data-[active=false]:opacity-0 data-[active=false]:translate-x-6 data-[active=true]:opacity-100 data-[active=true]:translate-x-0 motion-reduce:transition-none"
            data-active={isActive}
            aria-hidden={!isActive}
          >
            <span className="featured-carousel__media" aria-hidden="true">
              <EventImage
                src={event.thumbnailUrl}
                name={event.name}
                fallbackClassName="featured-carousel__fallback"
              />
            </span>
            <span className="featured-carousel__sheen" aria-hidden="true" />
            <span className="featured-carousel__orb" aria-hidden="true" />
            <span className="featured-carousel__arc" aria-hidden="true" />
            <span className="featured-carousel__frame" aria-hidden="true" />
            <div
              className="absolute bottom-[clamp(30px,5vw,62px)] left-[clamp(26px,5vw,64px)] z-4 w-[min(1040px,calc(100%-56px))] transition duration-700 ease-out data-[active=false]:translate-y-4 data-[active=false]:opacity-0 data-[active=true]:translate-y-0 data-[active=true]:opacity-100 motion-reduce:transition-none max-[600px]:bottom-26"
              data-active={isActive}
            >
              {renderEventCopy(event)}
            </div>
          </div>
        );
      })}

      {hasMultiple && (
        <div className="absolute bottom-8.5 right-[clamp(142px,12vw,190px)] z-5 flex items-center gap-2 max-[600px]:bottom-8 max-[600px]:right-7">
          <button
            type="button"
            className="featured-carousel__nav-button"
            aria-label="Previous featured event"
            onClick={goToPrevious}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="featured-carousel__dots">
            {featuredEvents.map((event, index) => (
              <button
                type="button"
                key={event.id}
                className="size-2.5 rounded-full bg-[#f6c866] transition data-[active=false]:bg-[rgb(255_246_226/38%)] data-[active=true]:w-6"
                data-active={index === activeIndex}
                aria-label={`Show featured event ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="featured-carousel__nav-button"
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
