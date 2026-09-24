import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import {
  DeliveryStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  TicketStatus,
} from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";
import { PrismaService } from "../prisma/prisma.service";
import { ImageStorageService } from "./image-storage.service";
import { buildSeedEvents, SeedEvent } from "./seed-data/events";

const demoOrganizer = {
  id: "usr_demo_organizer",
  name: "Passmint Demo Organizer",
  email: "demo.organizer@example.test",
  passwordHash: "demo-password-disabled",
  role: "user" as const,
};

@Injectable()
export class EventSeedService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStorage: ImageStorageService,
  ) {}

  async onApplicationBootstrap() {
    const demoMode = process.env.PASSMINT_DEMO_MODE === "true";
    if (demoMode && process.env.NODE_ENV === "production") {
      throw new Error("PASSMINT_DEMO_MODE cannot be enabled in production.");
    }

    const now = new Date();
    const seedEventWhere = this.seedEventWhere(now);
    const existingSeedEvents = await this.prisma.event.count({
      where: seedEventWhere,
    });
    if (!demoMode && existingSeedEvents === 0) {
      return;
    }
    const owner = await this.ensureDemoOrganizer();

    if (demoMode) {
      await this.seed(now, owner.id);
      return;
    }

    await this.prisma.event.updateMany({
      where: seedEventWhere,
      data: { ownerId: owner.id },
    });
  }

  async seed(now = new Date(), demoOrganizerId?: string) {
    const ownerId = demoOrganizerId ?? (await this.ensureDemoOrganizer()).id;
    for (const event of buildSeedEvents(now)) {
      await this.seedEvent(event, ownerId);
    }
    await this.seedOperationalHistory(now, ownerId);
  }

  private ensureDemoOrganizer() {
    return this.prisma.user.upsert({
      where: { email: demoOrganizer.email },
      update: {
        name: demoOrganizer.name,
        passwordHash: demoOrganizer.passwordHash,
        role: demoOrganizer.role,
      },
      create: demoOrganizer,
      select: { id: true },
    });
  }

  private seedEventWhere(now: Date): Prisma.EventWhereInput {
    return {
      OR: buildSeedEvents(now).flatMap((event) => [
        { id: event.id },
        { name: event.name },
      ]),
    };
  }

  private async seedEvent(event: SeedEvent, ownerId: string) {
    const existing = await this.prisma.event.findFirst({
      where: { OR: [{ id: event.id }, { name: event.name }] },
      select: {
        id: true,
        ownerId: true,
        thumbnailUrl: true,
        mapLocation: true,
      },
    });

    if (existing) {
      const thumbnailUrl = this.imageStorage.seedImageUrl(event.imageSlug);
      const data: Prisma.EventUpdateInput = {};

      if (existing.ownerId !== ownerId) {
        data.owner = { connect: { id: ownerId } };
      }

      if (!existing.ownerId && existing.thumbnailUrl !== thumbnailUrl) {
        data.thumbnailUrl = await this.uploadArtwork(event);
      }
      if (!existing.ownerId && !existing.mapLocation) {
        data.mapLocation = event.mapLocation;
      }

      if (Object.keys(data).length > 0) {
        await this.prisma.event.update({ where: { id: existing.id }, data });
      }
      return;
    }

    const thumbnailUrl = await this.uploadArtwork(event);
    const ticketTypes = event.ticketTypes ?? [];
    const occupiedSeats = event.occupiedSeats ?? [];

    try {
      await this.prisma.event.create({
        data: {
          id: event.id,
          name: event.name,
          description: event.description,
          venue: event.venue,
          mapLocation: event.mapLocation,
          startsAt: event.startsAt,
          capacity: event.capacity,
          priceCents: event.priceCents,
          thumbnailUrl,
          ownerId,
          ...(event.booking
            ? { booking: event.booking as unknown as Prisma.InputJsonValue }
            : {}),
          ...(ticketTypes.length > 0
            ? {
                ticketTypes: {
                  create: ticketTypes.map((type, index) => ({
                    ...type,
                    id: `${event.id}_type_${index}`,
                    maxPerOrder: 10,
                  })),
                },
                tickets: {
                  create: occupiedSeats.map((seat, index) => ({
                    id: `${event.id}_ticket_${index}`,
                    code: `${event.id}_code_${index}`,
                    buyerName: "Sample guest",
                    buyerEmail: "sample@example.test",
                    seatLabel: seat,
                    ticketTypeName: ticketTypes[0].name,
                    unitPriceCents: ticketTypes[0].priceCents,
                    ticketType: {
                      connect: { id: `${event.id}_type_0` },
                    },
                  })),
                },
              }
            : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return;
      }
      throw error;
    }
  }

  private async uploadArtwork(event: SeedEvent) {
    const imagePath = join(
      __dirname,
      "../../seed-data/event-images",
      event.imageFile,
    );
    const image = await readFile(imagePath);
    const { url } = await this.imageStorage.uploadSeedImage(event.imageSlug, {
      fileName: event.imageFile,
      contentType: "image/jpeg",
      dataUrl: `data:image/jpeg;base64,${image.toString("base64")}`,
    });
    return url;
  }

  private async seedOperationalHistory(now: Date, ownerId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        id: {
          in: [
            "evt_seed_kampala_tech_night",
            "evt_sample_bus_jinja",
            "evt_sample_festival",
          ],
        },
      },
      include: { ticketTypes: { orderBy: { createdAt: "asc" } } },
    });
    const buyers = [
      { name: "Amina Kato", email: "amina.demo@example.test" },
      { name: "Daniel Okello", email: "daniel.demo@example.test" },
      { name: "Priya Nansubuga", email: "priya.demo@example.test" },
      { name: "Josephine Atim", email: "josephine.demo@example.test" },
    ];

    for (const [eventIndex, event] of events.entries()) {
      const ticketType = event.ticketTypes[0];
      const unitPriceCents = ticketType?.priceCents ?? event.priceCents;
      for (const [buyerIndex, buyer] of buyers.entries()) {
        const orderId = `ord_demo_${eventIndex}_${buyerIndex}`;
        const quantity = buyerIndex === 0 ? 2 : 1;
        const createdAt = new Date(
          now.getTime() - (buyerIndex + eventIndex + 1) * 86_400_000,
        );
        await this.prisma.order.upsert({
          where: { id: orderId },
          update: {},
          create: {
            id: orderId,
            reference: `PM-DEMO-${eventIndex + 1}${buyerIndex + 1}`,
            eventId: event.id,
            ownerId,
            buyerName: buyer.name,
            buyerEmail: buyer.email,
            ticketTypeId: ticketType?.id,
            ticketTypeName: ticketType?.name ?? "General admission",
            quantity,
            unitPriceCents,
            totalCents: unitPriceCents * quantity,
            status: OrderStatus.fulfilled,
            paymentStatus:
              unitPriceCents > 0
                ? PaymentStatus.authorized
                : PaymentStatus.not_required,
            paymentProvider: unitPriceCents > 0 ? "mobile_money_sandbox" : null,
            paymentReference:
              unitPriceCents > 0
                ? `momo_demo_${eventIndex}_${buyerIndex}`
                : null,
            expiresAt: new Date(createdAt.getTime() + 15 * 60_000),
            fulfilledAt: createdAt,
            createdAt,
            updatedAt: createdAt,
          },
        });
        if (unitPriceCents > 0) {
          await this.prisma.payment.upsert({
            where: { reference: `momo_demo_${eventIndex}_${buyerIndex}` },
            update: {},
            create: {
              id: `pay_demo_${eventIndex}_${buyerIndex}`,
              orderId,
              provider: "mobile_money_sandbox",
              reference: `momo_demo_${eventIndex}_${buyerIndex}`,
              status: PaymentStatus.authorized,
              amountCents: unitPriceCents * quantity,
            },
          });
        }
        for (let index = 0; index < quantity; index += 1) {
          const ticketId = `tkt_demo_${eventIndex}_${buyerIndex}_${index}`;
          const checkedIn = eventIndex === 0 && buyerIndex < 2;
          await this.prisma.ticket.upsert({
            where: { id: ticketId },
            update: {},
            create: {
              id: ticketId,
              orderId,
              eventId: event.id,
              ownerId,
              ticketTypeId: ticketType?.id,
              ticketTypeName: ticketType?.name ?? "General admission",
              unitPriceCents,
              buyerName: buyer.name,
              buyerEmail: buyer.email,
              code: `demo-${eventIndex}-${buyerIndex}-${index}`,
              status: checkedIn ? TicketStatus.checked_in : TicketStatus.issued,
              checkedInAt: checkedIn
                ? new Date(createdAt.getTime() + 60 * 60_000)
                : null,
              createdAt,
              updatedAt: createdAt,
            },
          });
          if (checkedIn) {
            await this.prisma.ticketActivity.upsert({
              where: { id: `act_demo_${eventIndex}_${buyerIndex}_${index}` },
              update: {},
              create: {
                id: `act_demo_${eventIndex}_${buyerIndex}_${index}`,
                ticketId,
                kind: "accepted",
                operatorId: ownerId,
                operatorName: "Passmint Demo Organizer",
                decisionDurationMs: 420,
                device: "Demo scanner",
                createdAt: new Date(createdAt.getTime() + 60 * 60_000),
              },
            });
          }
        }
        await this.prisma.ticketDelivery.upsert({
          where: { id: `dlv_demo_${eventIndex}_${buyerIndex}` },
          update: {},
          create: {
            id: `dlv_demo_${eventIndex}_${buyerIndex}`,
            orderId,
            status: DeliveryStatus.sent,
            recipient: buyer.email,
            subject: `Your tickets for ${event.name}`,
            message: "Synthetic demo ticket delivery.",
            attempts: 1,
            sentAt: createdAt,
          },
        });
      }
    }
  }
}
