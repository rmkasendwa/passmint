"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { calendarDays, parseDateKey, toDateKey } from "../event-utils";

type NumericProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & { onValueChange: (value: string) => void };
export function NumericField(props: NumericProps) {
  const { onValueChange, ...inputProps } = props;
  const { min = 0, max, step = 1, value, disabled } = inputProps;
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.setCustomValidity(value !== '' && (Number(value) < Number(min) || (max !== undefined && Number(value) > Number(max))) ? `Enter a value from ${min}${max === undefined ? ' or more' : ` to ${max}`}.` : '');
  }, [value, min, max]);
  function adjust(direction: number) {
    const input = inputRef.current;
    if (!input) return;
    const next = Math.min(Number(max ?? Number.MAX_SAFE_INTEGER), Math.max(Number(min), Number(value || 0) + direction * Number(step)));
    onValueChange(String(next));
  }
  return <span className="quantity-stepper">
    <button type="button" aria-label={`Decrease ${props['aria-label'] || 'value'}`} disabled={disabled || (value !== '' && Number(value) <= Number(min))} onClick={() => adjust(-1)}><Minus size={16} aria-hidden="true" /></button>
    <input {...inputProps} ref={inputRef} type="text" inputMode="numeric" pattern="[0-9]+" onChange={event => { if (/^\d*$/.test(event.target.value)) onValueChange(event.target.value); }} />
    <button type="button" aria-label={`Increase ${props['aria-label'] || 'value'}`} disabled={disabled || (max !== undefined && Number(value) >= Number(max))} onClick={() => adjust(1)}><Plus size={16} aria-hidden="true" /></button>
  </span>;
}

export function EventDateTimeField({ value, onChange, disabled, invalid }: { value: string; onChange: (value: string) => void; disabled?: boolean; invalid?: boolean }) {
  const dateInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => parseDateKey(value.slice(0, 10)) ?? new Date());
  const [date, setDate] = useState(value.slice(0, 10));
  const [time, setTime] = useState(value.slice(11, 16));
  useEffect(() => {
    const parsed = parseDateKey(date);
    dateInput.current?.setCustomValidity(date && (!parsed || toDateKey(parsed) !== date) ? 'Choose a valid calendar date.' : '');
  }, [date]);
  function update(nextDate: string, nextTime: string) {
    setDate(nextDate); setTime(nextTime);
    onChange(parseDateKey(nextDate) && /^([01]\d|2[0-3]):[0-5]\d$/.test(nextTime) ? `${nextDate}T${nextTime}` : '');
  }
  return <div className="grid gap-3" onKeyDown={event => { if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); } }}>
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(100px,0.45fr)] gap-3">
      <div className="grid gap-2">
        <span className="text-xs text-text-muted">Date</span>
        <div className="relative">
          <input ref={dateInput} aria-label="Start date" aria-describedby="host-starts-error" aria-invalid={invalid || undefined} value={date} placeholder="Choose date" required data-validation-label="Starts" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" onChange={event => update(event.target.value, time)} onClick={() => setOpen(!open)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen(!open); } }} aria-expanded={open} disabled={disabled} />
          <CalendarDays className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-accent" size={18} />
        </div>
      </div>
      <label>Time (24-hour)<input aria-label="Start time" aria-describedby="host-starts-error" aria-invalid={invalid || undefined} type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5} pattern="([01][0-9]|2[0-3]):[0-5][0-9]" title="Enter a time from 00:00 to 23:59." required data-validation-label="Starts" value={time} onChange={event => update(date, event.target.value)} disabled={disabled} /></label>
    </div>
    {open && !disabled && <div className="grid max-w-85 gap-3 rounded-2xl border border-border bg-surface-raised p-3 text-text">
      <div className="flex items-center justify-between"><button type="button" aria-label="Previous month" className="grid size-10 place-items-center rounded-lg hover:bg-surface-muted" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button><strong aria-live="polite">{month.toLocaleDateString('en-UG', {month:'long',year:'numeric'})}</strong><button type="button" aria-label="Next month" className="grid size-10 place-items-center rounded-lg hover:bg-surface-muted" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button></div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-muted">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => <span key={day}>{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">{calendarDays(month).map(day => { const key = toDateKey(day); return <button type="button" key={key} aria-label={day.toLocaleDateString('en-UG', {day:'numeric',month:'long',year:'numeric'})} aria-pressed={date === key} className={`min-h-10 rounded-lg text-sm ${date === key ? 'bg-(--button-bg) text-(--button-text)' : 'hover:bg-accent-soft'} ${day.getMonth() !== month.getMonth() ? 'opacity-45' : ''}`} onClick={() => { update(key, time); setOpen(false); dateInput.current?.focus(); }}>{day.getDate()}</button>; })}</div>
    </div>}
  </div>;
}
