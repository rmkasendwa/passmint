# Passmint Product Flow

Passmint is an event publishing, ticketing, and gate-verification platform. The core product assumption is that regular people and organisations can create events, issue tickets, and validate tickets for the events they own.

## Roles

### Guest attendee

A guest attendee can browse events and get tickets without creating an account. For paid events, the guest pays with mobile money and provides an email address where tickets should be delivered. For free events, the guest still provides an email address so Passmint can send the ticket.

Guests do not need an account for checkout.

### Registered attendee

A registered attendee has a Passmint account. They can track ticket history, event attendance, purchased tickets, and payment methods. After a guest enters an email during checkout, Passmint should offer registration so they can manage the ticket and future purchases from an account.

### Event host

Any registered user can create and publish events on the platform. Hosts configure event details, capacity, price, and artwork. A host can validate tickets for events they created.

### Platform admin

A platform admin can support marketplace operations and validate tickets across events when needed. Admin access is a platform-level override, not the default requirement for creating events.

## Event Publishing

1. A user registers or signs in.
2. The user creates an event with a name, description, venue, start time, capacity, optional artwork, and price.
3. The event can be free by setting the price to zero.
4. The event can be paid by setting a mobile-money payable price.
5. Published events appear in public discovery.
6. The publishing user becomes the event owner.

## Ticket Checkout

1. An attendee selects an event.
2. The attendee enters buyer name, ticket delivery email, and quantity.
3. If the event is paid, the attendee provides a mobile money number and pays with mobile money.
4. If the event is free, no payment is required.
5. Passmint issues unique QR tickets and sends them to the provided email address.
6. If the attendee is signed in, the tickets are attached to their account history.
7. If the attendee is not signed in, checkout still succeeds as long as an email address is provided.
8. After checkout, Passmint offers the attendee a path to register and track the ticket, attendance, and payment methods.

## Repeat Ticket Requests By Email

Passmint tracks tickets by event and email address, even when purchases happen in different sessions.

When an email address already has tickets for the selected event:

1. Passmint pauses checkout before issuing additional tickets.
2. Passmint tells the attendee how many tickets already exist for that email and event.
3. The attendee confirms that they want more tickets for the same event.
4. If confirmed, Passmint issues the new tickets and the total count for that event-email pair increases.
5. If cancelled, no additional tickets are issued.

This avoids accidental duplicate purchases while still allowing one person to buy more tickets for the same event.

## Gate Verification

1. The verifier signs in.
2. The verifier scans or enters a ticket QR code.
3. Passmint checks whether the verifier owns the event connected to that ticket.
4. Platform admins can verify tickets across events.
5. Valid unused tickets are accepted and marked as checked in.
6. Already checked-in tickets are rejected as duplicates.
7. Cancelled or unknown tickets are rejected.
8. A user cannot validate tickets for events they did not create unless they are a platform admin.

## Current Implementation Notes

- Event ownership is stored on events.
- Ticket ownership remains optional so guest checkout can work.
- Ticket delivery email is normalised before storage.
- Repeat ticket checkout is guarded by a confirmation step based on event and email.
- The current mobile money flow captures the number and product intent; payment provider integration still needs to be connected before real charging and settlement.
