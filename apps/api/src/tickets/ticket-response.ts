import * as QRCode from 'qrcode';
import { Ticket } from './ticket.entity';

export async function toTicketResponse(ticket: Ticket) {
  const qrPayload = ticket.code;
  const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 320,
    errorCorrectionLevel: 'M',
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
    event: ticket.event,
  };
}
