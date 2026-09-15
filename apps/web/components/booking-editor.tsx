"use client";
import { formatLabels, layoutCapacity, type Booking } from "../booking";
import { NumericField } from "./event-form-controls";
import { SeatMap } from "./seat-map";
export function BookingEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: Booking;
  onChange: (value: Booking) => void;
  disabled?: boolean;
}) {
  const layout = value.seating;
  const changeLayout = (
    key: "rows" | "columns" | "aisleAfter",
    number: number,
  ) => {
    if (!layout) return;
    const next = { ...layout, [key]: number, blocked: [] };
    next.aisleAfter = Math.min(next.aisleAfter, next.columns - 1);
    onChange({ ...value, seating: next });
  };
  return (
    <div className="grid gap-4">
      <div
        className="grid gap-2 sm:grid-cols-3"
        role="group"
        aria-label="Event format"
      >
        {(Object.keys(formatLabels) as Booking["kind"][]).map((kind) => (
          <button
            type="button"
            disabled={disabled}
            key={kind}
            aria-pressed={value.kind === kind}
            onClick={() =>
              onChange({
                kind,
                ...(kind === "bus"
                  ? {
                      destination: "",
                      service: "",
                      seating: {
                        rows: 10,
                        columns: 4,
                        aisleAfter: 2,
                        blocked: [],
                      },
                    }
                  : kind === "cinema"
                    ? {
                        service: "",
                        durationMinutes: 120,
                        seating: {
                          rows: 8,
                          columns: 10,
                          aisleAfter: 5,
                          blocked: [],
                        },
                      }
                    : {}),
              })
            }
            className={`rounded-lg border p-3 text-left text-sm font-semibold ${value.kind === kind ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface-muted text-text"}`}
          >
            {formatLabels[kind]}
          </button>
        ))}
      </div>
      {value.kind === "bus" && (
        <label>
          Destination
          <input
            disabled={disabled}
            required
            value={value.destination ?? ""}
            maxLength={200}
            onChange={(e) =>
              onChange({ ...value, destination: e.target.value })
            }
            placeholder="Jinja · Main terminal"
          />
        </label>
      )}
      {value.kind !== "event" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            {value.kind === "bus"
              ? "Operator / service"
              : "Auditorium / screen"}
            <input
              disabled={disabled}
              value={value.service ?? ""}
              maxLength={200}
              onChange={(e) => onChange({ ...value, service: e.target.value })}
              placeholder={
                value.kind === "bus"
                  ? "Passmint Express · Coach 01"
                  : "Screen 2 · 2D"
              }
            />
          </label>
          <label>
            {value.kind === "bus"
              ? "Journey duration (minutes)"
              : "Runtime (minutes)"}
            <NumericField
              disabled={disabled}
              aria-label="Duration in minutes"
              min={1}
              max={10080}
              value={value.durationMinutes ?? ""}
              onValueChange={(v) =>
                onChange({
                  ...value,
                  durationMinutes: v ? Number(v) : undefined,
                })
              }
            />
          </label>
        </div>
      )}
      <label className="flex items-center gap-2">
        <input
          style={{ width: 18, minHeight: 18 }}
          type="checkbox"
          disabled={disabled}
          checked={Boolean(layout)}
          onChange={(e) =>
            onChange({
              ...value,
              seating: e.target.checked
                ? { rows: 8, columns: 8, aisleAfter: 4, blocked: [] }
                : undefined,
            })
          }
        />
        Reserved seating
      </label>
      {layout && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { key: "rows", label: "Rows", min: 1, max: 26 },
                { key: "columns", label: "Seats per row", min: 1, max: 20 },
                {
                  key: "aisleAfter",
                  label: "Aisle after seat (0 = none)",
                  min: 0,
                  max: layout.columns - 1,
                },
              ] as const
            ).map((field) => (
              <label key={field.key}>
                {field.label}
                <NumericField
                  aria-label={field.label}
                  disabled={disabled}
                  min={field.min}
                  max={field.max}
                  value={layout[field.key]}
                  onValueChange={(v) => {
                    const n = Number(v);
                    if (v !== "" && n >= field.min && n <= field.max)
                      changeLayout(field.key, n);
                  }}
                />
              </label>
            ))}
          </div>
          <p className="m-0 text-sm text-text-muted">
            {layoutCapacity(value)} bookable seats. Changing dimensions resets
            blocked seats. Ticket categories share this seating map.
          </p>
          <SeatMap
            booking={value}
            editing
            disabled={disabled}
            onSelect={(seat) => {
              const blocked = layout.blocked.includes(seat)
                ? layout.blocked.filter((s) => s !== seat)
                : [...layout.blocked, seat];
              if (blocked.length < layout.rows * layout.columns)
                onChange({ ...value, seating: { ...layout, blocked } });
            }}
          />
        </>
      )}
    </div>
  );
}
