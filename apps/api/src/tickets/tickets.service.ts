import { validateBooking, validateSeatSelection } from "../common/booking";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes, randomUUID } from "crypto";
import { performance } from "node:perf_hooks";
import {
  DeliveryStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { AuthUser } from "../auth/auth.types";
import { prefixedId } from "../common/prefixed-id";
import { isWithinSalesWindow } from "../common/ticket-sales";
import { EventsService } from "../events/events.service";
import { PrismaService } from "../prisma/prisma.service";
import { isPlatformAdmin } from "../users/user-role.enum";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { RecoverTicketsDto } from "./dto/recover-tickets.dto";
import { TicketStatus } from "./ticket-status.enum";
import { toTicketResponse } from "./ticket-response";

const reservingOrderStatuses = [
  OrderStatus.created,
  OrderStatus.awaiting_payment,
  OrderStatus.payment_processing,
  OrderStatus.paid,
];

const recoveryNotice =
  "If tickets exist for that email address, a recovery link will be sent shortly.";

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async create(dto: CreateTicketDto, authUser?: AuthUser) {
    await this.eventsService.publishDue();
    await this.expireStaleOrders();
    const quantity = dto.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new BadRequestException(
        "Quantity must be a whole number between 1 and 100.",
      );
    }
    const buyerEmail = dto.buyerEmail.trim().toLowerCase();
    const result = await this.prisma.$transaction(async (tx) => {
      // Serialize inventory changes for this event, including capacity edits.
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${dto.eventId} FOR UPDATE`;
      const event = await tx.event.findUnique({ where: { id: dto.eventId } });
      if (!event) throw new NotFoundException("Event not found");
      if (event.status === "draft")
        throw new NotFoundException("Event not found");
      if (event.status === "cancelled")
        throw new BadRequestException(
          "This event has been cancelled. Ticket sales are closed.",
        );
      const booking = validateBooking(event.booking);
      const openOrders = await tx.order.findMany({
        where: {
          eventId: event.id,
          status: { in: reservingOrderStatuses },
          expiresAt: { gt: new Date() },
        },
        select: { quantity: true, ticketTypeId: true, seatLabels: true },
      });
      const reservedSeats = openOrders.flatMap((order) =>
        Array.isArray(order.seatLabels)
          ? order.seatLabels.filter(
              (seat): seat is string => typeof seat === "string",
            )
          : [],
      );
      const occupied = booking?.seating
        ? await tx.ticket.findMany({
            where: {
              eventId: event.id,
              status: { not: TicketStatus.Cancelled },
              seatLabel: { not: null },
            },
            select: { seatLabel: true },
          })
        : [];
      validateSeatSelection(booking, dto.seatLabels, quantity, [
        ...occupied.map((ticket) => ticket.seatLabel!),
        ...reservedSeats,
      ]);
      const types = await tx.ticketType.findMany({
        where: { eventId: event.id },
      });
      const type = dto.ticketTypeId
        ? types.find((type) => type.id === dto.ticketTypeId)
        : undefined;
      if ((types.length > 0 && !type) || (dto.ticketTypeId && !type))
        throw new BadRequestException(
          "Choose a valid ticket category for this event.",
        );
      if (quantity > (type?.maxPerOrder ?? 10))
        throw new BadRequestException(
          `You can buy at most ${type?.maxPerOrder ?? 10} tickets per order.`,
        );
      if (type) {
        if (!isWithinSalesWindow(type))
          throw new BadRequestException(
            "This ticket category is outside its sales window.",
          );
        const typeSold = await tx.ticket.count({
          where: {
            ticketTypeId: type.id,
            status: { not: TicketStatus.Cancelled },
          },
        });
        const typeReserved = openOrders
          .filter((order) => order.ticketTypeId === type.id)
          .reduce((sum, order) => sum + order.quantity, 0);
        if (
          type.capacity !== null &&
          typeSold + typeReserved + quantity > type.capacity
        )
          throw new BadRequestException(
            "Not enough tickets remaining in this category.",
          );
      }
      const soldCount = await tx.ticket.count({
        where: { eventId: event.id, status: { not: TicketStatus.Cancelled } },
      });
      const reservedCount = openOrders.reduce(
        (sum, order) => sum + order.quantity,
        0,
      );
      const existingEmailCount = await tx.ticket.count({
        where: {
          eventId: event.id,
          buyerEmail,
        },
      });

      if (
        event.capacity !== null &&
        soldCount + reservedCount + quantity > event.capacity
      ) {
        throw new BadRequestException(
          "Not enough tickets remaining for this event",
        );
      }

      if (existingEmailCount > 0 && !dto.confirmAdditional) {
        throw new ConflictException({
          result: "additional_confirmation_required",
          message:
            "This email already has tickets for this event. Confirm if you want to issue more.",
          eventId: event.id,
          buyerEmail,
          existingTicketCount: existingEmailCount,
          requestedQuantity: quantity,
          totalAfterPurchase: existingEmailCount + quantity,
        });
      }

      const unitPriceCents = type?.priceCents ?? event.priceCents;
      if (unitPriceCents > 0 && !dto.mobileMoneyNumber?.trim()) {
        throw new BadRequestException(
          "Add a mobile money number before paid checkout.",
        );
      }
      const mobileMoneyNumber = dto.mobileMoneyNumber?.replace(/\s+/g, "");
      const totalCents = unitPriceCents * quantity;
      const paymentReference = totalCents > 0 ? prefixedId("momo") : null;
      const order = await tx.order.create({
        data: {
          id: prefixedId("ord"),
          reference: prefixedId("pm"),
          eventId: event.id,
          ownerId: authUser?.id,
          buyerName: dto.buyerName,
          buyerEmail,
          ticketTypeId: type?.id,
          ticketTypeName: type?.name ?? "General admission",
          quantity,
          unitPriceCents,
          totalCents,
          seatLabels: dto.seatLabels?.length ? dto.seatLabels : Prisma.DbNull,
          status: OrderStatus.paid,
          paymentStatus:
            totalCents > 0
              ? PaymentStatus.authorized
              : PaymentStatus.not_required,
          paymentProvider: totalCents > 0 ? "mobile_money_sandbox" : null,
          paymentReference,
          expiresAt: new Date(Date.now() + 15 * 60_000),
          ...(totalCents > 0
            ? {
                payments: {
                  create: {
                    id: prefixedId("pay"),
                    provider: "mobile_money_sandbox",
                    reference: paymentReference!,
                    status: PaymentStatus.authorized,
                    amountCents: totalCents,
                    currency: "UGX",
                    metadata: { phone: mobileMoneyNumber },
                  },
                },
              }
            : {}),
        },
      });
      const tickets = await Promise.all(
        Array.from({ length: quantity }, (_, index) =>
          tx.ticket.create({
            data: {
              id: prefixedId("tkt"),
              orderId: order.id,
              eventId: event.id,
              seatLabel: dto.seatLabels?.[index],
              ticketTypeId: type?.id,
              ticketTypeName: order.ticketTypeName,
              unitPriceCents,
              ownerId: authUser?.id,
              buyerName: dto.buyerName,
              buyerEmail,
              code: randomUUID(),
            },
            include: { event: true },
          }),
        ),
      );
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.fulfilled, fulfilledAt: new Date() },
      });
      await tx.ticketDelivery.create({
        data: {
          id: prefixedId("dlv"),
          orderId: order.id,
          recipient: buyerEmail,
          subject: `Your tickets for ${event.name}`,
          message: this.ticketDeliveryMessage(order.reference, event, tickets),
        },
      });
      return { orderId: order.id, tickets };
    });

    await this.processOrderDeliveries(result.orderId).catch(() => undefined);
    return Promise.all(result.tickets.map(toTicketResponse));
  }

  async requestRecovery(dto: RecoverTicketsDto) {
    const buyerEmail = dto.buyerEmail.trim().toLowerCase();
    const orders = await this.prisma.order.findMany({
      where: {
        buyerEmail,
        ...(dto.eventId ? { eventId: dto.eventId } : {}),
        status: OrderStatus.fulfilled,
        tickets: { some: { status: { not: TicketStatus.Cancelled } } },
      },
      include: { event: true },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    await Promise.all(
      orders.map(async (order) => {
        const token = randomBytes(32).toString("base64url");
        await this.prisma.guestRecoveryToken.create({
          data: {
            id: prefixedId("rec"),
            orderId: order.id,
            emailHash: this.emailHash(buyerEmail),
            tokenHash: this.secretHash(token),
            expiresAt: new Date(Date.now() + 60 * 60_000),
          },
        });
        const recoveryUrl = `${process.env.WEB_ORIGIN ?? "http://localhost:3001"}/tickets?recoveryToken=${encodeURIComponent(token)}`;
        const delivery = await this.prisma.ticketDelivery.create({
          data: {
            id: prefixedId("dlv"),
            orderId: order.id,
            recipient: buyerEmail,
            subject: `Recover your Passmint tickets for ${order.event.name}`,
            message: `Use this secure one-time link within 60 minutes to recover your tickets: ${recoveryUrl}`,
          },
        });
        await this.processDelivery(delivery.id);
      }),
    );

    return { message: recoveryNotice };
  }

  async redeemRecovery(token: string) {
    const now = new Date();
    const recovery = await this.prisma.guestRecoveryToken.findUnique({
      where: { tokenHash: this.secretHash(token) },
      include: {
        order: {
          include: {
            tickets: {
              where: { status: { not: TicketStatus.Cancelled } },
              include: { event: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });
    if (
      !recovery ||
      recovery.expiresAt <= now ||
      recovery.usedAt ||
      recovery.revokedAt
    ) {
      throw new NotFoundException("Recovery link is invalid or expired.");
    }
    const claimed = await this.prisma.guestRecoveryToken.updateMany({
      where: {
        id: recovery.id,
        expiresAt: { gt: now },
        usedAt: null,
        revokedAt: null,
      },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) {
      throw new NotFoundException("Recovery link is invalid or expired.");
    }
    return Promise.all(recovery.order.tickets.map(toTicketResponse));
  }

  async deliveryAttempts(authUser: AuthUser) {
    if (!isPlatformAdmin(authUser.role))
      throw new ForbiddenException("Admin access required");
    return this.prisma.ticketDelivery.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 100,
      include: {
        order: { select: { reference: true, eventId: true, status: true } },
      },
    });
  }

  async retryDelivery(id: string, authUser: AuthUser) {
    if (!isPlatformAdmin(authUser.role))
      throw new ForbiddenException("Admin access required");
    const delivery = await this.prisma.ticketDelivery.findUnique({
      where: { id },
    });
    if (!delivery) throw new NotFoundException("Delivery not found");
    return this.processDelivery(id);
  }

  async findOne(id: string, authUser: AuthUser) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    if (
      ticket.ownerId !== authUser.id &&
      ticket.event?.ownerId !== authUser.id &&
      !isPlatformAdmin(authUser.role)
    ) {
      throw new ForbiddenException("You do not have access to this ticket.");
    }
    return toTicketResponse(ticket);
  }

  async findMine(userId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      include: { event: true },
    });

    return Promise.all(tickets.map(toTicketResponse));
  }

  private async expireStaleOrders(now = new Date()) {
    await this.prisma.order.updateMany({
      where: {
        status: { in: reservingOrderStatuses },
        expiresAt: { lte: now },
      },
      data: { status: OrderStatus.expired, cancelledAt: now },
    });
  }

  private async processOrderDeliveries(orderId: string) {
    const deliveries = await this.prisma.ticketDelivery.findMany({
      where: {
        orderId,
        status: { in: [DeliveryStatus.queued, DeliveryStatus.failed] },
      },
      select: { id: true },
    });
    await Promise.all(
      deliveries.map((delivery) => this.processDelivery(delivery.id)),
    );
  }

  private async processDelivery(id: string) {
    const delivery = await this.prisma.ticketDelivery.findUnique({
      where: { id },
    });
    if (!delivery) throw new NotFoundException("Delivery not found");
    const now = new Date();
    if (process.env.PASSMINT_EMAIL_FORCE_FAILURE === "true") {
      return this.prisma.ticketDelivery.update({
        where: { id },
        data: {
          status: DeliveryStatus.failed,
          attempts: { increment: 1 },
          lastError: "Email provider rejected the message.",
          nextAttemptAt: new Date(now.getTime() + 5 * 60_000),
        },
      });
    }
    return this.prisma.ticketDelivery.update({
      where: { id },
      data: {
        status: DeliveryStatus.sent,
        attempts: { increment: 1 },
        lastError: null,
        nextAttemptAt: null,
        sentAt: now,
      },
    });
  }

  private ticketDeliveryMessage(
    reference: string,
    event: { name: string; venue: string; startsAt: Date },
    tickets: {
      buyerName: string;
      ticketTypeName: string;
      seatLabel: string | null;
      code: string;
    }[],
  ) {
    const ticketLines = tickets.map(
      (ticket, index) =>
        `${index + 1}. ${ticket.buyerName} - ${ticket.ticketTypeName}${ticket.seatLabel ? ` - Seat ${ticket.seatLabel}` : ""} - Admission code ${ticket.code}`,
    );
    return [
      `Order ${reference}`,
      `Event: ${event.name}`,
      `Venue: ${event.venue}`,
      `Starts: ${event.startsAt.toISOString()}`,
      "",
      "Tickets:",
      ...ticketLines,
      "",
      "Keep this email safe. The admission code is the credential scanned at the gate.",
    ].join("\n");
  }

  private emailHash(email: string) {
    return this.secretHash(email.trim().toLowerCase());
  }

  private secretHash(value: string) {
    return createHash("sha256")
      .update(
        process.env.TICKET_RECOVERY_SECRET ??
          process.env.AUTH_SECRET ??
          "passmint-local-recovery-secret",
      )
      .update(":")
      .update(value)
      .digest("hex");
  }

  async activity(id: string, authUser: AuthUser, page = 1) {
    if (!Number.isInteger(page) || page < 1 || page > 100000)
      throw new BadRequestException("Invalid activity page.");
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { event: true },
    });
    if (
      !ticket?.event ||
      (ticket.event.status === "draft" && ticket.event.ownerId !== authUser.id)
    )
      throw new NotFoundException("Ticket not found");
    if (ticket.event.ownerId !== authUser.id && !isPlatformAdmin(authUser.role))
      throw new ForbiddenException(
        "You can only inspect ticket activity for events you manage.",
      );
    const rows = await this.prisma.ticketActivity.findMany({
      where: { ticketId: id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * 50,
      take: 51,
      select: {
        id: true,
        kind: true,
        createdAt: true,
        operatorId: true,
        operatorName: true,
        device: true,
      },
    });
    const hasRecordedCheckIn = await this.prisma.ticketActivity.count({
      where: { ticketId: id, kind: "accepted" },
    });
    return {
      issuedAt: ticket.createdAt,
      legacyCheckedInAt: hasRecordedCheckIn ? null : ticket.checkedInAt,
      activities: rows.slice(0, 50),
      page,
      hasMore: rows.length > 50,
    };
  }

  async scan(code: string, authUser: AuthUser, device?: string) {
    const startedAt = performance.now();
    const outcome = await this.prisma.$transaction(async (tx) => {
      const reference = await tx.ticket.findUnique({
        where: { code },
        select: { eventId: true },
      });
      if (reference?.eventId)
        await tx.$queryRaw`SELECT id FROM events WHERE id = ${reference.eventId} FOR UPDATE`;
      const ticket = await tx.ticket.findUnique({
        where: { code },
        include: { event: true },
      });
      if (!ticket) {
        throw new NotFoundException({
          result: "invalid",
          message: "Ticket does not exist",
        });
      }
      if (!ticket.event) {
        throw new NotFoundException({
          result: "invalid",
          message: "Ticket event does not exist",
        });
      }

      const record = (kind: string) =>
        tx.ticketActivity.create({
          data: {
            id: prefixedId("act"),
            ticketId: ticket.id,
            kind,
            operatorId: authUser.id,
            operatorName: authUser.name,
            createdAt: new Date(),
            decisionDurationMs: Math.round(performance.now() - startedAt),
            device:
              device?.replace(/[\x00-\x1f\x7f]/g, "").slice(0, 500) || null,
          },
        });

      const canValidate =
        isPlatformAdmin(authUser.role) || ticket.event.ownerId === authUser.id;

      if (!canValidate) {
        await record("forbidden");
        return {
          error: new ForbiddenException({
            result: "forbidden",
            message: "You can only validate tickets for events you created.",
          }),
        };
      }

      if (ticket.event.status === "cancelled") {
        await record("event_cancelled");
        return {
          error: new ConflictException({
            result: "cancelled",
            message: "This event has been cancelled.",
          }),
        };
      }

      if (ticket.status === TicketStatus.Cancelled) {
        await record("cancelled");
        return {
          error: new ConflictException({
            result: "cancelled",
            message: "Ticket has been cancelled",
            ticket: await toTicketResponse(ticket),
          }),
        };
      }

      if (ticket.status === TicketStatus.CheckedIn) {
        await record("duplicate");
        return {
          error: new ConflictException({
            result: "duplicate",
            message: "Ticket has already been checked in",
            checkedInAt: ticket.checkedInAt,
            ticket: await toTicketResponse(ticket),
          }),
        };
      }

      const saved = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: TicketStatus.CheckedIn,
          checkedInAt: new Date(),
        },
        include: { event: true },
      });

      await record("accepted");
      return {
        value: {
          result: "accepted",
          message: "Ticket accepted",
          ticket: await toTicketResponse(saved),
        },
      };
    });
    // Throw only after committing so rejected scans retain their audit record.
    if (outcome.error) throw outcome.error;
    return outcome.value;
  }
}
