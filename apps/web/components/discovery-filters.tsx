"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  calendarDays,
  dateFilterLabel,
  parseDateKey,
  toDateKey,
} from "../event-utils";

const inputShell =
  "discovery-input-shell flex min-h-11 items-center gap-2 rounded-full border border-border bg-control px-3.75 text-text-muted [&_input]:min-h-10.5 [&_input]:w-full [&_input]:min-w-0 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-text [&_input::placeholder]:text-text-soft";

export function DiscoveryFilters({
  query,
  start,
  end,
}: {
  query: string;
  start: string;
  end: string;
}) {
  const [dateStart, setDateStart] = useState(start);
  const [dateEnd, setDateEnd] = useState(end);
  const [pickerOpen, setPickerOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const pickerId = useId();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  function closePicker() {
    setPickerOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  useLayoutEffect(() => {
    if (!pickerOpen) return;
    const update = () => {
      if (!trigger.current || !panel.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const bounds = panel.current.getBoundingClientRect();
      const top =
        anchor.bottom + 8 + bounds.height <= window.innerHeight - 8
          ? anchor.bottom + 8
          : anchor.top - bounds.height - 8;
      setPosition({
        left: Math.max(
          8,
          Math.min(anchor.left, window.innerWidth - bounds.width - 8),
        ),
        top: Math.max(8, Math.min(top, window.innerHeight - bounds.height - 8)),
      });
    };
    update();
    panel.current
      ?.querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
    const observer = new ResizeObserver(update);
    if (trigger.current) observer.observe(trigger.current);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    const outside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !trigger.current?.contains(event.target) &&
        !panel.current?.contains(event.target)
      ) {
        setPickerOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePicker();
      }
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [pickerOpen]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const selectedDate = parseDateKey(start);
    return selectedDate ?? new Date();
  });
  const visibleCalendarDays = useMemo(
    () => calendarDays(calendarMonth),
    [calendarMonth],
  );
  const calendarMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-UG", {
        month: "long",
        year: "numeric",
      }).format(calendarMonth),
    [calendarMonth],
  );

  function chooseCalendarDate(dateKey: string) {
    if (!dateStart || dateEnd) {
      setDateStart(dateKey);
      setDateEnd("");
      return;
    }

    if (dateKey < dateStart) {
      setDateEnd(dateStart);
      setDateStart(dateKey);
    } else if (dateKey === dateStart) {
      setDateEnd("");
    } else {
      setDateEnd(dateKey);
      closePicker();
    }
  }

  function moveMonth(offset: number) {
    setCalendarMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  return (
    <form
      className="grid w-[min(1040px,calc(100%-var(--content-gutter)*2))] grid-cols-[minmax(280px,1fr)_minmax(230px,286px)_auto] items-end gap-3 max-[820px]:w-full max-[820px]:grid-cols-1"
      action="/#events"
      role="search"
    >
      <label className="grid gap-1.75 text-[0.76rem] font-(--weight-semibold) text-text-muted">
        <div className={inputShell}>
          <Search size={18} />
          <input
            aria-label="Search by event or venue"
            name="q"
            placeholder="Event, venue, artist, team"
            defaultValue={query}
          />
        </div>
      </label>

      <div className="relative grid gap-1.75 text-[0.76rem] font-(--weight-semibold) text-text-muted">
        <input type="hidden" name="start" value={dateStart} />
        <input type="hidden" name="end" value={dateEnd} />
        <button
          ref={trigger}
          className={`${inputShell} w-full justify-start text-left text-text`}
          type="button"
          aria-expanded={pickerOpen}
          aria-controls={pickerOpen ? pickerId : undefined}
          aria-haspopup="dialog"
          aria-label="Choose event date range"
          onClick={() => setPickerOpen((open) => !open)}
        >
          <CalendarDays size={18} />
          <span className="min-w-0 flex-1 truncate text-[0.95rem] font-(--weight-semibold)">
            {dateFilterLabel(dateStart, dateEnd)}
          </span>
        </button>

        {pickerOpen &&
          createPortal(
            <div
              ref={panel}
              id={pickerId}
              role="dialog"
              aria-label="Choose event date range"
              style={position}
              className="fixed z-50 grid max-h-[calc(100dvh-16px)] w-[min(340px,calc(100vw-16px))] gap-3 overflow-y-auto rounded-2xl border border-border bg-surface-raised p-3 text-[0.76rem] font-(--weight-semibold) text-text shadow-[0_24px_70px_rgb(0_0_0/38%)]"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-full border border-border bg-surface-muted text-text-muted hover:text-text"
                  onClick={() => moveMonth(-1)}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={17} />
                </button>
                <strong className="text-[0.95rem] font-(--weight-bold)">
                  {calendarMonthLabel}
                </strong>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-full border border-border bg-surface-muted text-text-muted hover:text-text"
                  onClick={() => moveMonth(1)}
                  aria-label="Next month"
                >
                  <ChevronRight size={17} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[0.72rem] font-(--weight-semibold) uppercase text-text-soft">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <span key={day}>{day}</span>
                  ),
                )}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {visibleCalendarDays.map((date) => {
                  const dateKey = toDateKey(date);
                  const isOutsideMonth =
                    date.getMonth() !== calendarMonth.getMonth();
                  const rangeEnd = dateEnd || dateStart;
                  const isSelected =
                    dateKey === dateStart || dateKey === dateEnd;
                  const isInRange =
                    Boolean(dateStart && rangeEnd) &&
                    dateKey >= (dateStart <= rangeEnd ? dateStart : rangeEnd) &&
                    dateKey <= (dateStart <= rangeEnd ? rangeEnd : dateStart);

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      className={`grid aspect-square place-items-center rounded-lg text-[0.82rem] font-(--weight-semibold) ${
                        isSelected
                          ? "bg-(--button-bg) text-(--button-text)"
                          : isInRange
                            ? "bg-accent-soft text-text"
                            : "bg-transparent text-text-muted hover:bg-surface-muted hover:text-text"
                      } ${isOutsideMonth ? "opacity-45" : ""}`}
                      onClick={() => chooseCalendarDate(dateKey)}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-surface-muted px-3 text-[0.82rem] font-(--weight-semibold) text-text-muted hover:text-text"
                  onClick={() => {
                    setDateStart("");
                    setDateEnd("");
                  }}
                >
                  <X size={14} />
                  Clear
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-9 items-center rounded-full bg-(--button-bg) px-3 text-[0.82rem] font-(--weight-bold) text-(--button-text)"
                  onClick={closePicker}
                >
                  Apply
                </button>
              </div>
            </div>,
            document.body,
          )}
      </div>

      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent bg-(--button-bg) px-5 text-[0.95rem] font-(--weight-bold) text-(--button-text) hover:bg-accent hover:text-[#081010]"
        type="submit"
        aria-label="Search events"
      >
        <Search size={19} />
        Search events
      </button>
    </form>
  );
}
