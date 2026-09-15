export type Booking = {
  kind: "event" | "bus" | "cinema";
  destination?: string;
  service?: string;
  durationMinutes?: number;
  seating?: {
    rows: number;
    columns: number;
    aisleAfter: number;
    blocked: string[];
  };
};
export const formatLabels = {
  event: "Live event",
  bus: "Bus journey",
  cinema: "Cinema screening",
};
export function layoutSeats(booking: Booking) {
  const layout = booking.seating;
  if (!layout) return [];
  return Array.from({ length: layout.rows * layout.columns }, (_, i) => ({
    label:
      booking.kind === "bus"
        ? String(i + 1)
        : `${String.fromCharCode(65 + Math.floor(i / layout.columns))}${(i % layout.columns) + 1}`,
    row: Math.floor(i / layout.columns),
    column: i % layout.columns,
  }));
}
export function layoutCapacity(booking: Booking) {
  return layoutSeats(booking).filter(
    (seat) => !booking.seating?.blocked.includes(seat.label),
  ).length;
}
