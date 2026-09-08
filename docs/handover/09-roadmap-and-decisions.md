# Roadmap and product decisions

[Documentation index](../README.md)

## Confirmed direction — 7 September 2026

| Decision | Consequence |
| --- | --- |
| One platform for tickets and gate passes | Shared core with activity-specific customer workflows |
| Any registered user administers their own events | Platform-admin status is not a prerequisite; old issue #1 is not the intended product rule |
| Tenants may be individuals or organizations | Tenant membership and staff scope are future extensions of current user ownership |
| Guest purchases remain available | Registration cannot become a requirement for ticket purchase |
| Reusable custom seating | Layouts belong to organizers, while inventory belongs to a dated occurrence |
| Make the platform work before monetization | No subscription gates, platform service fees, paid feature restrictions or plan quotas now |

These decisions come from the founder's instructions, not inferred market requirements. Paid admission chosen by an organizer is permitted; Passmint charging the organizer is deferred.

## Proposed delivery sequence

The canonical review index is [issue #65](https://github.com/rmkasendwa/passmint/issues/65). Links below are proposals and do not commit delivery dates, staffing or budget.

| Stage | Proposals | Exit evidence to seek |
| --- | --- | --- |
| Foundation | [#45 tenants](https://github.com/rmkasendwa/passmint/issues/45), [#46 shared model](https://github.com/rmkasendwa/passmint/issues/46), [#47 resources](https://github.com/rmkasendwa/passmint/issues/47), [#51 guest recovery](https://github.com/rmkasendwa/passmint/issues/51), [#52 payments](https://github.com/rmkasendwa/passmint/issues/52), existing #6 orders | Complete guest/member free and paid flow with verified inventory and payment outcomes |
| Seating | [#48 layouts](https://github.com/rmkasendwa/passmint/issues/48), [#49 holds](https://github.com/rmkasendwa/passmint/issues/49), [#50 selection](https://github.com/rmkasendwa/passmint/issues/50) | Reused layout with independent sessions; competing buyers cannot get the same seat |
| Admission and operations | [#58 access rules](https://github.com/rmkasendwa/passmint/issues/58), [#60 refunds/exchanges](https://github.com/rmkasendwa/passmint/issues/60), [#61 box office](https://github.com/rmkasendwa/passmint/issues/61), [#62 delivery](https://github.com/rmkasendwa/passmint/issues/62) | Correct gate outcomes, recoverable customer communications and reconciled order changes |
| Vertical pilots | [#53 cinema](https://github.com/rmkasendwa/passmint/issues/53), [#54 buses](https://github.com/rmkasendwa/passmint/issues/54), [#56 timed entry](https://github.com/rmkasendwa/passmint/issues/56), [#57 conferences](https://github.com/rmkasendwa/passmint/issues/57), [#59 visitor passes](https://github.com/rmkasendwa/passmint/issues/59), [#63 discovery](https://github.com/rmkasendwa/passmint/issues/63) | An actual organizer validates each workflow before broad rollout |
| Later transport extension | [#55 segment reuse](https://github.com/rmkasendwa/passmint/issues/55) | Non-overlapping bus segments reuse seats without conflicting holds |
| Deferred business discussion | [#64](https://github.com/rmkasendwa/passmint/issues/64) | Explicit founder direction after the free platform works; blocks no feature |

## Design principles for future work

A layout describes seat positions, aisles and orientation. A layout version used for a sold occurrence must remain stable. Each screening/departure/event has its own inventory. A hold temporarily reserves inventory during checkout; a ticket grants admission after free completion or verified payment. Buyer, passenger/attendee and ticket owner can be different people.

Resource scheduling must handle exclusive auditoriums/vehicles and setup time. Conference session reservations should not consume the main conference pass. Visitor passes should remain out of public discovery. Offline scanning can detect local duplicates but disconnected devices cannot guarantee global real-time duplicate prevention.

## Backlog reconciliation

Existing overlapping proposals include ticket types #5/#18, drafts #17/#35, duplication #20/#26, transfers #16/#37, and purchase limits #23/#27. Email-verification #22/#31 disagree on timing; resolve without imposing mandatory accounts. Do not equate a GitHub issue's presence with missing implementation: inspect current code and tests before estimating work.

Open choices include the first pilot, build-versus-buy seating editor, payment provider, amount/currency model, checkout hold duration, late-payment handling, refund policy and recovery channel. No provider or pricing is selected by this documentation. The next owner should preserve confirmed principles while reviewing the remaining choices.

## Research provenance

Prior issue planning consulted [Seats.io holds](https://docs.seats.io/docs/api/hold-tokens/), [per-event chart changes](https://support.seats.io/en/articles/10056959-how-to-make-chart-changes-to-a-single-event), [pretix product/time-slot patterns](https://docs.pretix.eu/guides/products/), [check-in handling](https://docs.pretix.eu/dev/api/resources/checkin.html) and [Stripe webhook reliability](https://docs.stripe.com/webhooks). These are design references attached to proposals, not current vendor integrations or proof of proprietary invention.
