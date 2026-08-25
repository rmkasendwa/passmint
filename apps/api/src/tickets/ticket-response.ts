import * as QRCode from "qrcode";
import { Event, Ticket } from "@prisma/client";

type TicketWithEvent = Ticket & { event: Event };

function toPublicEvent(ticket: TicketWithEvent) {
  return {
    id: ticket.event.id,
    name: ticket.event.name,
    description: ticket.event.description,
    venue: ticket.event.venue,
    startsAt: ticket.event.startsAt,
    capacity: ticket.event.capacity,
    priceCents: ticket.event.priceCents,
    thumbnailUrl: ticket.event.thumbnailUrl,
  };
}

export async function toTicketResponse(ticket: TicketWithEvent) {
  const qrPayload = ticket.code;
  const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
  });

  return {
    id: ticket.id,
    code: ticket.code,
    buyerName: ticket.buyerName,
    buyerEmail: ticket.buyerEmail,
    status: ticket.status,
    checkedInAt: ticket.checkedInAt,
    createdAt: ticket.createdAt,
    qrPayload,
    qrCodeDataUrl,
    event: toPublicEvent(ticket),
  };
}
