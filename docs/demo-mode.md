# Demo mode

Passmint demo data is synthetic and opt-in. It is intended for investor,
partner, and customer demos where a clean environment should show realistic
events, checkout, delivery, recovery, attendee, scan, and reporting activity.

## Enable

Set `PASSMINT_DEMO_MODE=true` outside production, then start the API or run the
seed path that boots the API module. Demo mode refuses to start in production.

On every API startup, Passmint also repairs the owner of any existing canonical
seed event to the dedicated demo organizer, even when demo mode is off.

The demo seed creates:

- a non-login demo organizer using `demo.organizer@example.test`
- seed events owned by that dedicated demo organizer
- curated event inventory and ticket categories
- fulfilled orders with sandbox mobile-money payment records
- issued and checked-in tickets
- sent ticket delivery records
- scan activity for reporting dashboards

All demo emails use the reserved `.example.test` domain.

## Sign in

Open the regular sign-in page and choose **Enter demo**. The button is shown
only when the API reports that demo mode is enabled. It creates a normal session
for the dedicated demo organizer and opens the organizer events view without a
shared password. Both the availability check and demo-session endpoint remain
disabled in production.

## Reset

For a fully clean local demo, reset the development database and start with demo
mode enabled:

```sh
pnpm db:reset
PASSMINT_DEMO_MODE=true pnpm dev:db
PASSMINT_DEMO_MODE=true pnpm dev:api
```

Demo payment records use the `mobile_money_sandbox` provider and never contact a
live payment provider. Ticket delivery is recorded in Passmint's delivery outbox
so failures can be inspected and retried without affecting issued tickets.

Set `TICKET_RECOVERY_SECRET` to a long random value outside local development.
When it is omitted, recovery token hashing falls back to `AUTH_SECRET`.
