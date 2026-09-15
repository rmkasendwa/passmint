"use client";
import { useState } from "react";
import type { Booking } from "../booking";
import { BookingEditor } from "./booking-editor";
export function SeatingPlayground() {
  const [booking, setBooking] = useState<Booking>({
    kind: "bus",
    destination: "Jinja",
    service: "Sample coach",
    seating: { rows: 5, columns: 4, aisleAfter: 2, blocked: ["20"] },
  });
  return (
    <section className="event-create-fields mt-8 rounded-2xl border border-border bg-surface-raised p-6">
      <h2>Try the layout editor</h2>
      <p className="text-text-muted">
        Change the format, rows and aisles, or click seats to block them. This
        preview does not change any bookings.
      </p>
      <BookingEditor value={booking} onChange={setBooking} />
    </section>
  );
}
