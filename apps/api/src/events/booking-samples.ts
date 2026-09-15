import type { Booking } from "../common/booking";
const future = (days: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};
export const bookingSamples = [
  {
    id: "evt_sample_bus_jinja",
    name: "Kampala to Jinja · Sample coach",
    description:
      "Sample journey: compare adult and child fares, choose a numbered seat, and use your QR ticket when boarding. Departure from the Kampala terminal. Arrive 20 minutes early.",
    venue: "Kampala Central Bus Terminal",
    mapLocation: "Kampala bus terminal",
    startsAt: future(3, 8),
    priceCents: 3000000,
    capacity: 39,
    booking: {
      kind: "bus",
      destination: "Jinja Main Terminal",
      service: "Passmint Express · Coach 01",
      durationMinutes: 150,
      seating: { rows: 10, columns: 4, aisleAfter: 2, blocked: ["40"] },
    } as Booking,
    types: [
      { name: "Adult", priceCents: 3000000 },
      { name: "Child (under 12)", priceCents: 2000000 },
    ],
    occupied: ["1", "2", "7"],
  },
  {
    id: "evt_sample_cinema",
    name: "The Midnight Atlas · Sample screening",
    description:
      "A fictional adventure film screening for exploring cinema bookings. Choose a standard or student ticket, then pick your row and seat. Screen 2, original language, 2D.",
    venue: "Passmint Cinema · Kampala",
    mapLocation: "Acacia Mall Kampala",
    startsAt: future(5, 19),
    priceCents: 2500000,
    capacity: 78,
    booking: {
      kind: "cinema",
      service: "Screen 2 · 2D",
      durationMinutes: 118,
      seating: { rows: 8, columns: 10, aisleAfter: 5, blocked: ["A1", "A10"] },
    } as Booking,
    types: [
      { name: "Standard", priceCents: 2500000 },
      { name: "Student (ID required)", priceCents: 1800000 },
    ],
    occupied: ["D5", "D6", "E5", "E6"],
  },
  {
    id: "evt_sample_festival",
    name: "Passmint Sessions · Sample festival",
    description:
      "A sample live event with multiple ticket categories. Compare general admission, VIP lounge access, and a limited early-bird allocation. This event uses open admission without reserved seats.",
    venue: "Kampala Arts Gardens",
    mapLocation: "Kampala",
    startsAt: future(8, 16),
    priceCents: 3500000,
    capacity: 450,
    booking: { kind: "event" } as Booking,
    types: [
      { name: "Early bird", priceCents: 3500000, capacity: 50 },
      { name: "General admission", priceCents: 5000000, capacity: 300 },
      { name: "VIP lounge", priceCents: 10000000, capacity: 100 },
    ],
    occupied: [],
  },
];
