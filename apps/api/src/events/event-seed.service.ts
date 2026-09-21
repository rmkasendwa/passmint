import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";
import { PrismaService } from "../prisma/prisma.service";
import { ImageStorageService } from "./image-storage.service";
import { buildSeedEvents, SeedEvent } from "./seed-data/events";

@Injectable()
export class EventSeedService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStorage: ImageStorageService,
  ) {}

  async onApplicationBootstrap() {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.SEED_DEMO_DATA !== "true"
    ) {
      return;
    }

    await this.seed();
  }

  async seed(now = new Date()) {
    for (const event of buildSeedEvents(now)) {
      await this.seedEvent(event);
    }
  }

  private async seedEvent(event: SeedEvent) {
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
      if (existing.ownerId) return;

      const thumbnailUrl = this.imageStorage.seedImageUrl(event.imageSlug);
      const data: Prisma.EventUpdateInput = {};

      if (existing.thumbnailUrl !== thumbnailUrl) {
        data.thumbnailUrl = await this.uploadArtwork(event);
      }
      if (!existing.mapLocation) data.mapLocation = event.mapLocation;

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
}
