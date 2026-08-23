"use client";

import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  MapPin,
  Search,
  Ticket as TicketIcon,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { EventThumbnail } from "../components/event-thumbnail";
import {
  categories,
  dateFilterLabel,
  eventCategory,
  eventStatus,
  eventTone,
  toDateKey,
} from "../event-utils";
import { chipDate, dateTime, money, shortDate } from "../formatters";
import { usePassmint } from "../components/passmint-app";

export function HomePageContent() {
  const dateWidgetRef = useRef<HTMLDivElement | null>(null);
  const {
    calendarMonth,
    calendarMonthLabel,
    chooseCalendarDate,
    chooseEvent,
    dateEnd,
    datePickerOpen,
    dateStart,
    featuredEvent,
    loading,
    nextEvent,
    query,
    selectedEventId,
    setCalendarMonth,
    setDateEnd,
    setDatePickerOpen,
    setDateStart,
    setQuery,
    visibleCalendarDays,
    visibleEvents,
  } = usePassmint();

  useEffect(() => {
    if (!datePickerOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        dateWidgetRef.current &&
        event.target instanceof Node &&
        !dateWidgetRef.current.contains(event.target)
      ) {
        setDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [datePickerOpen, setDatePickerOpen]);

  return (
    <>
      <section className="discovery-bar" aria-label="Event discovery">
        <form
          className="search-panel"
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            <div className="input-shell">
              <Search size={18} />
              <input
                aria-label="Search by event or venue"
                placeholder="Event, venue, artist, team"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </label>
          <label>
            <div className="date-widget" ref={dateWidgetRef}>
              <button
                className={`date-trigger ${dateStart ? "has-value" : ""}`}
                type="button"
                aria-label="Choose event date"
                aria-expanded={datePickerOpen}
                aria-haspopup="dialog"
                onClick={() => setDatePickerOpen((open) => !open)}
              >
                <CalendarDays size={18} />
                <span>{dateFilterLabel(dateStart, dateEnd)}</span>
                <ChevronDown size={16} />
              </button>

              {datePickerOpen && (
                <div className="date-popover" role="dialog">
                  <div className="calendar-head">
                    <button
                      type="button"
                      aria-label="Previous month"
                      onClick={() =>
                        setCalendarMonth(
                          (current) =>
                            new Date(
                              current.getFullYear(),
                              current.getMonth() - 1,
                              1,
                            ),
                        )
                      }
                    >
                      <ChevronLeft size={17} />
                    </button>
                    <strong>{calendarMonthLabel}</strong>
                    <button
                      type="button"
                      aria-label="Next month"
                      onClick={() =>
                        setCalendarMonth(
                          (current) =>
                            new Date(
                              current.getFullYear(),
                              current.getMonth() + 1,
                              1,
                            ),
                        )
                      }
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>

                  <div className="calendar-grid" aria-label="Choose date">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                      <span key={`${day}-${index}`}>{day}</span>
                    ))}
                    {visibleCalendarDays.map((date) => {
                      const dateKey = toDateKey(date);
                      const rangeStart =
                        dateStart && dateEnd && dateEnd < dateStart
                          ? dateEnd
                          : dateStart;
                      const rangeEnd =
                        dateStart && dateEnd && dateEnd < dateStart
                          ? dateStart
                          : dateEnd;
                      const isStart = dateKey === dateStart;
                      const isEnd = dateKey === dateEnd;
                      const isInRange =
                        rangeStart &&
                        rangeEnd &&
                        dateKey > rangeStart &&
                        dateKey < rangeEnd;

                      return (
                        <button
                          type="button"
                          key={dateKey}
                          className={[
                            date.getMonth() === calendarMonth.getMonth()
                              ? ""
                              : "muted-day",
                            isStart ? "range-start" : "",
                            isEnd ? "range-end" : "",
                            isInRange ? "in-range" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => chooseCalendarDate(dateKey)}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  <div className="date-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setDateStart("");
                        setDateEnd("");
                      }}
                    >
                      <X size={15} />
                      Clear
                    </button>
                  </div>
                </div>
              )}
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

        <div className="category-strip" aria-label="Event categories">
          {categories.map(({ label, query: categoryQuery, icon: Icon }) => (
            <button
              type="button"
              key={label}
              className={query === categoryQuery ? "selected" : ""}
              onClick={() => setQuery(categoryQuery)}
            >
              <Icon size={20} />
              <strong>{label}</strong>
            </button>
          ))}
        </div>
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
                <Link
                  className="primary-action"
                  href="/tickets"
                  onClick={() => chooseEvent(featuredEvent.id)}
                >
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

            {loading ? (
              <p className="muted">Loading events...</p>
            ) : (
              <div className="event-grid">
                {visibleEvents.map((event, index) => (
                  <button
                    className={`event-card ${eventTone(index)} ${event.id === selectedEventId ? "selected" : ""}`}
                    key={event.id}
                    onClick={() => chooseEvent(event.id)}
                    type="button"
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
                  </button>
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
              <Link
                className="primary-action"
                href="/tickets"
                onClick={() => chooseEvent(nextEvent.id)}
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
