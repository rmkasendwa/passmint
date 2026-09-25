DO $$ BEGIN
  CREATE TYPE orders_status_enum AS ENUM ('created', 'awaiting_payment', 'payment_processing', 'paid', 'fulfilled', 'failed', 'cancelled', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payments_status_enum AS ENUM ('not_required', 'pending', 'authorized', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_deliveries_status_enum AS ENUM ('queued', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS orders (
  id varchar PRIMARY KEY,
  reference varchar NOT NULL UNIQUE,
  "eventId" varchar NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  "ownerId" varchar REFERENCES users(id) ON DELETE SET NULL,
  "buyerName" varchar NOT NULL,
  "buyerEmail" varchar NOT NULL,
  "ticketTypeId" varchar,
  "ticketTypeName" varchar NOT NULL,
  quantity integer NOT NULL,
  "unitPriceCents" integer NOT NULL,
  "totalCents" integer NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'UGX',
  "seatLabels" jsonb,
  status orders_status_enum NOT NULL DEFAULT 'created',
  "paymentStatus" payments_status_enum NOT NULL DEFAULT 'not_required',
  "paymentProvider" varchar,
  "paymentReference" varchar,
  "expiresAt" timestamptz NOT NULL,
  "fulfilledAt" timestamptz,
  "cancelledAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id varchar PRIMARY KEY,
  "orderId" varchar NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider varchar NOT NULL,
  reference varchar NOT NULL UNIQUE,
  status payments_status_enum NOT NULL DEFAULT 'pending',
  "amountCents" integer NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'UGX',
  metadata jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_deliveries (
  id varchar PRIMARY KEY,
  "orderId" varchar NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status ticket_deliveries_status_enum NOT NULL DEFAULT 'queued',
  recipient varchar NOT NULL,
  subject varchar NOT NULL,
  message text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  "lastError" text,
  "nextAttemptAt" timestamptz,
  "sentAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guest_recovery_tokens (
  id varchar PRIMARY KEY,
  "orderId" varchar NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "emailHash" varchar NOT NULL,
  "tokenHash" varchar NOT NULL UNIQUE,
  "expiresAt" timestamptz NOT NULL,
  "usedAt" timestamptz,
  "revokedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "orderId" varchar REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_event_status_idx ON orders("eventId", status);
CREATE INDEX IF NOT EXISTS orders_buyer_email_created_idx ON orders("buyerEmail", "createdAt");
CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments("orderId");
CREATE INDEX IF NOT EXISTS ticket_deliveries_order_id_idx ON ticket_deliveries("orderId");
CREATE INDEX IF NOT EXISTS ticket_deliveries_retry_idx ON ticket_deliveries(status, "nextAttemptAt");
CREATE INDEX IF NOT EXISTS guest_recovery_email_idx ON guest_recovery_tokens("emailHash", "expiresAt");
CREATE INDEX IF NOT EXISTS guest_recovery_order_idx ON guest_recovery_tokens("orderId");
CREATE INDEX IF NOT EXISTS tickets_order_id_idx ON tickets("orderId");
