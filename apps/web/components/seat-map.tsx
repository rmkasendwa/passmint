"use client";
import type { Booking } from "../booking";
import { layoutSeats } from "../booking";
export function SeatMap({
  booking,
  selected = [],
  occupied = [],
  onSelect,
  disabled = false,
  editing = false,
}: {
  booking: Booking;
  selected?: string[];
  occupied?: string[];
  onSelect?: (label: string) => void;
  disabled?: boolean;
  editing?: boolean;
}) {
  const layout = booking.seating;
  if (!layout) return null;
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-surface-muted p-4">
      <div className="rounded-lg border border-border bg-surface-raised py-2 text-center text-xs uppercase tracking-widest text-text-muted">
        {booking.kind === "bus"
          ? "Front · Driver"
          : booking.kind === "cinema"
            ? "Screen"
            : "Stage / Front"}
      </div>
      <div className="overflow-x-auto pb-2">
        <div
          role="group"
          aria-label={editing ? "Configure seats" : "Choose seats"}
          className="mx-auto grid w-max gap-2"
          style={{
            gridTemplateColumns: `repeat(${layout.columns + (layout.aisleAfter ? 1 : 0)}, 2.5rem)`,
          }}
        >
          {layoutSeats(booking).map((seat) => {
            const blocked = layout.blocked.includes(seat.label);
            const taken = occupied.includes(seat.label);
            const chosen = selected.includes(seat.label);
            return (
              <button
                key={seat.label}
                type="button"
                aria-label={`Seat ${seat.label}${blocked ? " · blocked" : taken ? " · booked" : ""}`}
                aria-pressed={editing ? blocked : chosen}
                disabled={disabled || (!editing && (blocked || taken))}
                style={{
                  gridRow: seat.row + 1,
                  gridColumn:
                    seat.column +
                    1 +
                    (layout.aisleAfter && seat.column >= layout.aisleAfter
                      ? 1
                      : 0),
                }}
                className={`h-10 rounded-t-lg rounded-b border text-xs font-semibold transition-colors disabled:cursor-not-allowed ${chosen && !editing ? "border-accent bg-(--button-bg) text-(--button-text)" : blocked ? "border-transparent bg-transparent text-text-soft opacity-40" : taken ? "border-border bg-surface-raised text-text-soft opacity-50" : "border-border-strong bg-surface-raised text-text hover:border-accent hover:bg-accent-soft"}`}
                onClick={() => onSelect?.(seat.label)}
              >
                {blocked ? "×" : seat.label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="m-0 text-xs text-text-muted">
        {editing
          ? "Click seats to block or restore them. × = blocked."
          : "Mint = selected · Dim = booked · × = unavailable. Seats are confirmed when tickets are issued."}
      </p>
    </div>
  );
}
