"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  calendarDays,
  dateFilterLabel,
  parseDateKey,
  toDateKey,
} from "../event-utils";

const inputShell =
  "flex min-h-11 items-center gap-2 rounded-full border border-(color:--border) bg-(color:--control-bg) px-[15px] text-(color:--text-muted) focus-within:border-(color:--accent) focus-within:outline-[3px_solid_rgb(22_125_119/18%)] [&_input]:min-h-[42px] [&_input]:w-full [&_input]:min-w-0 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-(color:--text) [&_input]:outline-0 [&_input::placeholder]:text-(color:--text-soft)";

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
      setPickerOpen(false);
    }
  }

  function moveMonth(offset: number) {
    setCalendarMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  return (
    <form
      className="grid w-[min(1040px,calc(100%-var(--content-gutter)*2))] grid-cols-[minmax(280px,1fr)_minmax(230px,286px)_auto] items-end gap-3 max-[820px]:w-full max-[820px]:grid-cols-1"
      action="/"
      role="search"
    >
      <label className="grid gap-[7px] text-[0.76rem] font-(weight:--weight-semibold) text-(color:--text-muted)">
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

      <div className="relative grid gap-[7px] text-[0.76rem] font-(weight:--weight-semibold) text-(color:--text-muted)">
        <input type="hidden" name="start" value={dateStart} />
        <input type="hidden" name="end" value={dateEnd} />
        <button
          className={`${inputShell} w-full justify-start text-left text-(color:--text)`}
          type="button"
          aria-expanded={pickerOpen}
          aria-label="Choose event date range"
          onClick={() => setPickerOpen((open) => !open)}
        >
          <CalendarDays size={18} />
          <span className="min-w-0 flex-1 truncate text-[0.95rem] font-(weight:--weight-semibold)">
            {dateFilterLabel(dateStart, dateEnd)}
          </span>
        </button>

        {pickerOpen && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-40 grid w-[min(340px,calc(100vw-32px))] gap-3 rounded-2xl border border-(color:--border) bg-(color:--surface-raised) p-3 text-(color:--text) shadow-[0_24px_70px_rgb(0_0_0/38%)]">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="grid size-9 place-items-center rounded-full border border-(color:--border) bg-(color:--surface-muted) text-(color:--text-muted) hover:text-(color:--text)"
                onClick={() => moveMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft size={17} />
              </button>
              <strong className="text-[0.95rem] font-(weight:--weight-bold)">
                {calendarMonthLabel}
              </strong>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-full border border-(color:--border) bg-(color:--surface-muted) text-(color:--text-muted) hover:text-(color:--text)"
                onClick={() => moveMonth(1)}
                aria-label="Next month"
              >
                <ChevronRight size={17} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[0.72rem] font-(weight:--weight-semibold) uppercase text-(color:--text-soft)">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {visibleCalendarDays.map((date) => {
                const dateKey = toDateKey(date);
                const isOutsideMonth = date.getMonth() !== calendarMonth.getMonth();
                const rangeEnd = dateEnd || dateStart;
                const isSelected = dateKey === dateStart || dateKey === dateEnd;
                const isInRange =
                  Boolean(dateStart && rangeEnd) &&
                  dateKey >= (dateStart <= rangeEnd ? dateStart : rangeEnd) &&
                  dateKey <= (dateStart <= rangeEnd ? rangeEnd : dateStart);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    className={`grid aspect-square place-items-center rounded-lg text-[0.82rem] font-(weight:--weight-semibold) ${
                      isSelected
                        ? "bg-(color:--button-bg) text-(color:--button-text)"
                        : isInRange
                          ? "bg-(color:--accent-soft) text-(color:--text)"
                          : "bg-transparent text-(color:--text-muted) hover:bg-(color:--surface-muted) hover:text-(color:--text)"
                    } ${isOutsideMonth ? "opacity-45" : ""}`}
                    onClick={() => chooseCalendarDate(dateKey)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-(color:--border) pt-3">
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-(color:--border) bg-(color:--surface-muted) px-3 text-[0.82rem] font-(weight:--weight-semibold) text-(color:--text-muted) hover:text-(color:--text)"
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
                className="inline-flex min-h-9 items-center rounded-full bg-(color:--button-bg) px-3 text-[0.82rem] font-(weight:--weight-bold) text-(color:--button-text)"
                onClick={() => setPickerOpen(false)}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent bg-(color:--button-bg) px-5 text-[0.95rem] font-(weight:--weight-bold) text-(color:--button-text) hover:bg-(color:--accent) hover:text-[#081010]"
        type="submit"
        aria-label="Search events"
      >
        <Search size={19} />
        Search events
      </button>
    </form>
  );
}
