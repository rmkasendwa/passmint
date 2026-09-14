"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { calendarDays, parseDateKey, toDateKey } from "../event-utils";

type NumericProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> & { onValueChange: (value: string) => void };
export function NumericField(props: NumericProps) {
  const { onValueChange, ...inputProps } = props;
  const { min = 0, max, step = 1, value, disabled } = inputProps;
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.setCustomValidity(
      value !== "" &&
        (Number(value) < Number(min) ||
          (max !== undefined && Number(value) > Number(max)))
        ? `Enter a value from ${min}${max === undefined ? " or more" : ` to ${max}`}.`
        : "",
    );
  }, [value, min, max]);
  function adjust(direction: number) {
    const input = inputRef.current;
    if (!input) return;
    const next = Math.min(
      Number(max ?? Number.MAX_SAFE_INTEGER),
      Math.max(Number(min), Number(value || 0) + direction * Number(step)),
    );
    onValueChange(String(next));
  }
  return (
    <span className="quantity-stepper">
      <button
        type="button"
        aria-label={`Decrease ${props["aria-label"] || "value"}`}
        disabled={disabled || (value !== "" && Number(value) <= Number(min))}
        onClick={() => adjust(-1)}
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <input
        {...inputProps}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]+"
        onChange={(event) => {
          if (/^\d*$/.test(event.target.value))
            onValueChange(event.target.value);
        }}
      />
      <button
        type="button"
        aria-label={`Increase ${props["aria-label"] || "value"}`}
        disabled={
          disabled || (max !== undefined && Number(value) >= Number(max))
        }
        onClick={() => adjust(1)}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </span>
  );
}

export function EventDateTimeField({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const trigger = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(
    () => parseDateKey(value.slice(0, 10)) ?? new Date(),
  );
  const [date, setDate] = useState(value.slice(0, 10));
  const [time, setTime] = useState(value.slice(11, 16) || "12:00");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }
  function show() {
    if (disabled) return;
    setDate(value.slice(0, 10));
    setTime(value.slice(11, 16) || "12:00");
    setMonth(parseDateKey(value.slice(0, 10)) ?? new Date());
    setOpen(true);
  }
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  useLayoutEffect(() => {
    if (!open || !panel.current) return;
    // A popover in the dialog's subtree stays interactive above its native top layer.
    panel.current.showPopover();
    const update = () => {
      if (!trigger.current || !panel.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const bounds = panel.current.getBoundingClientRect();
      const below = anchor.bottom + 8;
      setPosition({
        left: Math.max(
          8,
          Math.min(anchor.left, window.innerWidth - bounds.width - 8),
        ),
        top: Math.max(
          8,
          Math.min(
            below + bounds.height <= window.innerHeight - 8
              ? below
              : anchor.top - bounds.height - 8,
            window.innerHeight - bounds.height - 8,
          ),
        ),
      });
    };
    update();
    panel.current
      .querySelector<HTMLElement>('button[aria-pressed="true"], button')
      ?.focus({ preventScroll: true });
    const observer = new ResizeObserver(update);
    observer.observe(panel.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !trigger.current?.contains(event.target) &&
        !panel.current?.contains(event.target)
      )
        close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      close(true);
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape, true);
    };
  }, [open]);
  const selectedDate = parseDateKey(value.slice(0, 10));
  const display = selectedDate
    ? `${selectedDate.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })} at ${value.slice(11, 16)}`
    : "";
  const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  return (
    <>
      <div className="relative">
        <input
          ref={trigger}
          aria-label="Start date and time"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          aria-describedby="host-starts-error"
          aria-invalid={invalid || undefined}
          value={display}
          placeholder="Choose date and time"
          required
          data-validation-label="Starts"
          inputMode="none"
          onChange={() => {}}
          onClick={() => (open ? close() : show())}
          onKeyDown={(event) => {
            if (["Enter", " ", "ArrowDown"].includes(event.key)) {
              event.preventDefault();
              show();
            }
          }}
          disabled={disabled}
          className="cursor-pointer pr-10"
        />
        <CalendarDays
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-accent"
          size={18}
        />
      </div>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            popover="manual"
            role="dialog"
            aria-label="Choose start date and time"
            style={{ ...position, margin: 0 }}
            className="fixed inset-auto z-50 max-h-[calc(100dvh-16px)] w-85 max-w-[calc(100vw-16px)] overflow-y-auto rounded-2xl border border-border bg-surface-raised p-4 text-text shadow-xl"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                className="grid size-10 place-items-center rounded-lg hover:bg-surface-muted"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeft size={18} />
              </button>
              <strong aria-live="polite">
                {month.toLocaleDateString("en-UG", {
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              <button
                type="button"
                aria-label="Next month"
                className="grid size-10 place-items-center rounded-lg hover:bg-surface-muted"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="my-2 grid grid-cols-7 gap-1 text-center text-xs text-text-muted">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays(month).map((day) => {
                const key = toDateKey(day);
                return (
                  <button
                    type="button"
                    key={key}
                    aria-label={day.toLocaleDateString("en-UG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    aria-pressed={date === key}
                    className={`min-h-10 rounded-lg text-sm ${date === key ? "bg-(--button-bg) text-(--button-text)" : "hover:bg-accent-soft"} ${day.getMonth() !== month.getMonth() ? "opacity-45" : ""}`}
                    onClick={() => setDate(key)}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
            <label className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
              Time (24-hour)
              <input
                className="min-h-11 w-28 rounded-lg border border-border bg-surface-muted px-3 text-text"
                aria-label="Time (24-hour)"
                inputMode="numeric"
                placeholder="HH:MM"
                maxLength={5}
                value={time}
                aria-invalid={!validTime || undefined}
                onChange={(event) => setTime(event.target.value)}
              />
            </label>
            {!validTime && (
              <p className="mt-2 text-xs text-red-500">
                Enter a time from 00:00 to 23:59.
              </p>
            )}
            <div className="mt-4 flex justify-between gap-2">
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  onChange("");
                  close(true);
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="button-primary"
                disabled={!date || !validTime}
                onClick={() => {
                  onChange(`${date}T${time}`);
                  close(true);
                }}
              >
                Apply
              </button>
            </div>
          </div>,
          trigger.current?.closest("dialog") ?? document.body,
        )}
    </>
  );
}
