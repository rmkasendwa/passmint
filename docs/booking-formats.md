# Event formats and seating

Passmint supports live events, bus departures, and cinema screenings through the same event lifecycle. Each departure or screening is a separate event with its own inventory; use Duplicate event for another date or time.

## Try the examples

Open `/samples` (also linked from the footer). The server-rendered gallery includes:

- Kampala to Jinja: adult/child fares, a 2+2 coach layout, numbered seats, three already booked seats, and a blocked final seat.
- The Midnight Atlas: standard/student fares, row-letter seat labels, a central aisle, four booked seats and two blocked seats.
- Passmint Sessions: early-bird, general-admission and VIP categories with independent allocations and no assigned seats.

The layout playground on that page is local preview state. It does not modify sample bookings. The sample event checkout uses the application's existing ticket issuance flow; these changes do not add a payment gateway or payment verification.

Samples are added idempotently by fixed IDs on API startup in development, or when `SEED_DEMO_DATA=true` in production. Existing sample records and purchases are never reset by startup. Sample bookings are fictional and use `sample@example.test`.

## Create and manage

Create event (modal or page) starts with format and seating. Bus journeys add destination, operator/service and duration; screenings add auditorium and runtime. Configure 1–26 rows, 1–20 seats per row, an optional aisle, and blocked seats. Changing dimensions resets blocked seats. Capacity is derived from bookable seats when reserved seating is enabled.

Add up to 20 ticket categories with price and optional allocation during creation. Category allocations share the event capacity and seating map; a category is a fare/admission option, not a seat zone. Existing category settings and sales windows remain editable in the category manager. One checkout uses one category and can issue several seats; mixed-category baskets are not included.

Event management has a format/seating editor. Once any ticket has been issued (including later-cancelled tickets), the API prevents changing format or seating configuration. Duplicate the event for a new layout. Existing tickets retain their seat label, category and issue-time price; seat labels appear in ticket history, attendee lists and gate results.

## Inventory and database

The additive Prisma changes are `Event.booking` (JSON) and `Ticket.seatLabel` (nullable text). Existing events without booking metadata retain general admission. Apply with the repository's `db:push` workflow and regenerate Prisma Client; no existing rows need replacing.

Ticket creation locks the event row before checking category inventory, total capacity, and seat availability. Each selected seat must exist, be unblocked, be unique within the request, and not belong to another active ticket. Quantity must equal the number of selected seats. Competing purchases serialize under the same lock, so only one can claim a seat. Cancelling a ticket releases its seat. Duplicating an event copies configuration and categories, never its bookings.

There are no temporary seat holds: selection is tentative until ticket issuance. Checkout refreshes availability periodically and offers a manual refresh if another buyer claims a selected seat. Public responses include occupied seat labels only, not buyer details.

## Verification

`node scripts/test.mjs` uses an isolated PostgreSQL schema. Seating tests cover layout validation, seat/quantity mismatches, blocked seats, concurrent claims, cancellation/rebooking, duplication and gate responses. Type checking and production SSR checks use the existing web scripts.
