# Passmint product workflows

[Documentation index](README.md) · [Capability status](handover/02-capability-register.md)

This document describes the inspected source on 7 September 2026, including local ticket-type additions. It does not establish a deployed production release. Broader tenant, cinema, bus and seating workflows remain proposals in the [roadmap](handover/09-roadmap-and-decisions.md).

## Roles and product principles

A guest browses and obtains tickets without creating an account, while supplying buyer name and email. A registered buyer uses the same flow and gets account-linked ticket history. Any registered user can become an organizer by creating events; that person administers their own events.

The current platform-admin role is separate from event ownership and permits selected cross-event actions. Private drafts remain owner-only. Shared organizations and staff roles are planned rather than implemented.

Platform use is intended to remain free during this rollout. No subscription or platform-admin approval is required to organize. Organizers can set an admission price, but real payment processing is not implemented yet.

## Organizer journey

1. Register or log in through the web application.
2. Create an event with name, description, venue, start date/time, price and optional capacity, map location and image. Published creation assigns ownership to the signed-in user.
3. Alternatively, save incomplete content as a private draft. The owner can complete it, publish it or schedule publication before its start time. Publication occurs through a 30-second API timer and catch-up checks on selected requests.
4. Manage owned events through the dashboard and event-management/detail pages. Unrelated users cannot edit them. A published event cannot be made a draft through the current update contract.
5. In the current working tree, define ticket categories with prices, optional capacities, sales windows and per-order limits. Customers must choose a category once categories exist.
6. Cancel a published event with explicit confirmation if it will not proceed. Cancellation keeps the event and tickets, prevents new purchases and scans, and disallows further event edits. It does not send messages or process refunds.

Reusable seat layout design, rooms, movie schedules and bus resources are not available in this flow yet.

## Buyer journey

1. Browse public events and use text/date filters. Open `/event/:eventId` for details. Drafts are not public; cancelled events may remain visible with their status.
2. Select a ticket category where configured and enter buyer name, email and quantity. Sign-in is optional. The interface includes a mobile-money number field for priced tickets.
3. Submit the request. The API checks event/category availability and capacity and issues one unique ticket per requested unit. **It does not charge or verify a payment**, including when the event has a nonzero price.
4. View returned tickets and QR codes immediately. Signed-in purchases are linked to the account and can be retrieved later. There is no implemented email delivery or secure guest recovery link; do not promise either from the presence of an email field.
5. Present the QR code or ticket code at entry. The buyer does not need to log in to present it.

Ticket responses include current event details, buyer information and category/price snapshots from the local additions. No seat is assigned. The purchaser's contact applies to each ticket in a batch; individual passenger/attendee records are future work.

## Repeat requests and capacity

If an event/email pair already has tickets, the API returns an additional-purchase confirmation response containing the existing count. The UI asks whether the buyer wants more; explicit confirmation allows another issuance when inventory permits. This is an accidental-repeat prompt, not an order-idempotency mechanism. Current count disclosure does not verify the email's owner and is a documented privacy gap.

Null capacity means unlimited. Issued and checked-in tickets consume capacity; cancelled tickets do not. Event and category limits both apply, and event-row transactions serialize competing purchases and capacity changes. Reducing capacity below active tickets is rejected. There are no expiring reservations: inventory is consumed at issuance.

## Gate-operator journey

1. Sign in as the event owner or a platform admin with validation permission.
2. Use the dashboard's camera scanner or enter a code manually. Camera failure has a manual-entry fallback.
3. The API finds the ticket and checks the operator's authority, event cancellation and ticket status.
4. A valid unused ticket is marked `checked_in` with a timestamp and an accepted result. Reuse is rejected as duplicate. Unknown, cancelled and unauthorized tickets have distinct rejection outcomes.

Validation is online and single-use. There are no gate/zone or time-window checks, re-entry policies, offline synchronization or delegated check-in staff in the current model. The request carries the code only, so it does not enforce a separately selected gate/event context.

## Account and support limitations

Registration/login works in source and sessions persist in browser local storage. Logout clears local session state; it does not revoke a server-stored session because no such session store exists. Forgot/reset-password screens are placeholders awaiting backend and email integration. Account linking for earlier guest tickets, ticket transfers, refunds and email verification are also proposed.

The [operations runbook](handover/07-operations.md) explains triage and evidence needed for real support. Do not manually change ticket or payment records as a substitute for an implemented, authorized support workflow.

## Intended end-to-end evolution

The target flow is: create a free tenant → create an activity and occurrence → optionally apply a reusable layout → publish → customer chooses seats/quantity → hold inventory → complete free checkout or verify payment → issue and deliver tickets → recover/manage tickets → validate admission rules. Future implementations must retain optional buyer accounts and self-service event ownership.
