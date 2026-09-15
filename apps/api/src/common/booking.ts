import { BadRequestException } from '@nestjs/common';
export type Booking = {
  kind: 'event' | 'bus' | 'cinema';
  destination?: string;
  service?: string;
  durationMinutes?: number;
  seating?: { rows: number; columns: number; aisleAfter: number; blocked: string[] };
};
export function seatLabels(booking: Booking | null | undefined): string[] {
  const layout = booking?.seating;
  if (!layout) return [];
  return Array.from({ length: layout.rows * layout.columns }, (_, i) => booking?.kind === 'bus' ? String(i + 1) : `${String.fromCharCode(65 + Math.floor(i / layout.columns))}${i % layout.columns + 1}`).filter(label => !layout.blocked.includes(label));
}
export function validateBooking(input: unknown): Booking | null {
  if (input == null) return null;
  const data = input as Booking;
  const fail = (message: string): never => { throw new BadRequestException(message); };
  if (!['event','bus','cinema'].includes(data.kind)) fail('Choose a supported event format.');
  for (const field of ['destination','service'] as const) if (data[field] !== undefined && (typeof data[field] !== 'string' || data[field]!.length > 200)) fail('Service details must be text under 200 characters.');
  if (data.kind === 'bus' && !data.destination?.trim()) fail('Add a destination for this journey.');
  if (data.durationMinutes !== undefined && (!Number.isInteger(data.durationMinutes) || data.durationMinutes < 1 || data.durationMinutes > 10080)) fail('Duration must be between 1 and 10080 minutes.');
  if (data.seating) {
    const {rows,columns,aisleAfter,blocked} = data.seating;
    if (!Number.isInteger(rows) || rows < 1 || rows > 26 || !Number.isInteger(columns) || columns < 1 || columns > 20 || !Number.isInteger(aisleAfter) || aisleAfter < 0 || aisleAfter >= columns) fail('Use 1–26 rows, 1–20 seats per row, and an aisle within the row.');
    if (!Array.isArray(blocked) || blocked.some(s => typeof s !== 'string') || new Set(blocked).size !== blocked.length) fail('Blocked seats must be unique seat labels.');
    const all = seatLabels({...data,seating:{...data.seating,blocked:[]}});
    if (blocked.some(s => !all.includes(s)) || blocked.length >= all.length) fail('Choose valid blocked seats and leave at least one seat available.');
  }
  return {kind:data.kind, ...(data.destination ? {destination:data.destination.trim()} : {}), ...(data.service ? {service:data.service.trim()} : {}), ...(data.durationMinutes ? {durationMinutes:data.durationMinutes} : {}), ...(data.seating ? {seating:{rows:data.seating.rows,columns:data.seating.columns,aisleAfter:data.seating.aisleAfter,blocked:data.seating.blocked}} : {})};
}
export function validateSeatSelection(booking: Booking | null, seats: string[] | undefined, quantity: number, occupied: string[]) {
  const available = seatLabels(booking);
  if (!booking?.seating) {
    if (seats?.length) throw new BadRequestException('This event does not use reserved seats.');
    return;
  }
  if (!seats || seats.length !== quantity || new Set(seats).size !== quantity || seats.some(s => !available.includes(s))) throw new BadRequestException('Select one valid, distinct seat for each ticket.');
  if (seats.some(s => occupied.includes(s))) throw new BadRequestException('A selected seat was just booked. Refresh the seating map and choose another seat.');
}
