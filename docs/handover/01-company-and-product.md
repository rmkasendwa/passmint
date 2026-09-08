# Company and product overview

[Documentation index](../README.md)

## Product description

Passmint is a web-based event publishing, ticket issuance and gate-verification product. Its broader direction is a single platform where individuals and organizations manage admission to events, screenings, journeys, facilities and private sites. Buyers should be able to obtain tickets with or without a Passmint account.

The current software centers on individually owned events and QR tickets. It includes discovery, registration/login, event management, draft publication, optional capacity and online single-use validation. Ticket categories support separate prices, inventory and sales windows. Organizations, reserved seating and specialized vertical workflows are future work.

## Customers and problems addressed

| Audience | Need | Intended value |
| --- | --- | --- |
| Individual event organizers | Publish events and control entry without a separate ticketing operation | Self-service creation, sales/issuance and validation in one workflow |
| Attendees and ticket buyers | Obtain and present tickets easily | No mandatory account; account history when signed in |
| Cinemas and performance venues | Repeat shows with seat selection | Reusable auditorium layouts and occurrence-specific inventory; proposed |
| Bus and other transport operators | Sell departure seats and manage boarding | Route/date selection, passenger manifests and vehicle layouts; proposed |
| Attractions and tour operators | Limit admissions by time slot | Slot scheduling and capacity; proposed |
| Offices, estates and facilities | Admit authorized visitors privately | Time-limited gate passes and revocation; proposed |

These are intended customer segments, not evidence of signed customers or market traction. No customer interviews, market sizing or competitive validation were supplied for this package.

## Confirmed business direction

Any registered person can create events and administer their own events. Event administration is based on ownership; it does not require a platform administrator role. Future tenants represent personal or shared organizational workspaces.

The founder explicitly wants platform usage and tenant creation to remain free while the product is made useful. Subscriptions, platform service fees, paid feature gates and monetization-based approval gates are not part of the current rollout. Organizers may charge for admission; collecting their ticket payments is separate from charging for Passmint. A future monetization decision has been deferred, without a pricing commitment.

Guest checkout means no platform account is required. The current form still collects buyer name and email. “Anonymous” should not be used to imply that no personal data is collected.

## Product boundaries

Passmint currently issues a ticket directly from a purchase request. It does not yet maintain an order ledger, confirm provider payments, settle organizer funds or send ticket emails. A paid-looking event or checkout screen must not be presented as proof that money was collected. See the [capability register](02-capability-register.md).

The longer-term platform should share identities, inventory, orders and admission across activity types, while using customer-appropriate terms such as screening or departure. It is not currently an airline reservation system, a complete cinema POS, a transport dispatch system or an enterprise physical-access installation.

## Company facts requiring confirmation

| Fact | Current evidence | Required handover evidence |
| --- | --- | --- |
| Product name | Passmint in repository and founder direction | Confirm brand owner and permitted use |
| Repository | [rmkasendwa/passmint](https://github.com/rmkasendwa/passmint) | Transfer authority, repository visibility and contributor list |
| Legal entity, registration and jurisdiction | Owner confirmation required | Incorporation and registered-office records |
| Founders, shareholders and capitalization | Owner confirmation required | Current capitalization table and supporting records |
| Public domain, registrar and brand accounts | Owner confirmation required | Domain/account inventory with authorized custodians |
| Production launch and operating regions | Not established by source | Deployment inventory and launch history |
| Customers, contracts and active users | Not established by source | Dated, reproducible records with definitions |
| Revenue, funding, expenses and liabilities | Not established by source | Financial statements and supporting schedules |
| Employees, contractors and IP assignments | Not established by source | Contributor agreements and ownership records |

## Commercial reporting definitions to establish

Track published non-demo activities, active organizers, issued tickets, accepted admissions and guest/member usage separately. When payments exist, distinguish order value, captured funds, refunds, provider costs, organizer settlement and Passmint revenue. The current `ticketsSold` count includes all non-cancelled tickets and is not paid sales. The dashboard's capacity-times-price estimate is potential value, not recognized revenue. Do not use seeded events as traction evidence.
