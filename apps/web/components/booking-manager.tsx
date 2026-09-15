"use client";
import { useState } from "react";
import { api, type Event } from "../api";
import { BookingEditor } from "./booking-editor";
export function BookingManager({
  event,
  token,
  onSaved,
}: {
  event: Event;
  token: string;
  onSaved: (event: Event) => void;
}) {
  const [open, setOpen] = useState(false);
  const [booking, setBooking] = useState(
    event.booking ?? { kind: "event" as const },
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <section className="event-create-fields grid gap-4 rounded-xl border border-border bg-surface-raised p-5">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-xl">Format &amp; seating</h2>
        <button
          type="button"
          className="button-secondary"
          onClick={() => {
            setBooking(event.booking ?? { kind: "event" });
            setOpen(!open);
          }}
        >
          {open ? "Close" : "Configure"}
        </button>
      </div>
      {open && (
        <>
          <p className="text-sm text-text-muted">
            Layouts can be changed until the first ticket is issued. For a
            different journey or showtime, duplicate this event.
          </p>
          <BookingEditor
            value={booking}
            onChange={setBooking}
            disabled={busy || Boolean(event.ticketsSold)}
          />
          <button
            type="button"
            className="button-primary"
            disabled={busy || Boolean(event.ticketsSold)}
            onClick={async () => {
              setBusy(true);
              setMessage("");
              try {
                const updated = await api.updateEvent(
                  event.id,
                  { booking },
                  token,
                );
                onSaved(updated);
                setMessage("Format and seating saved.");
              } catch (e) {
                setMessage(
                  (e as { message?: string }).message ??
                    "Unable to save seating.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Save format &amp; seating
          </button>
          <p role="status">{message}</p>
        </>
      )}
    </section>
  );
}
