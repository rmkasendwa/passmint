-- Additive upgrade for an existing deployment. Back up and rehearse first.
-- Run once against the same schema/search_path used by the application.
BEGIN;
CREATE TABLE "event_imports" (
    "archiveId" VARCHAR(71) NOT NULL,
    "sourceEventId" VARCHAR NOT NULL,
    "ownerId" VARCHAR NOT NULL,
    "eventId" VARCHAR NOT NULL,
    "ticketTypeMapping" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_imports_pkey" PRIMARY KEY ("archiveId", "sourceEventId", "ownerId"),
    CONSTRAINT "event_imports_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_imports_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "event_imports_eventId_key" ON "event_imports"("eventId");
COMMIT;
