# Capability register

[Documentation index](../README.md)

Status reflects the source reviewed on 8 September 2026, not a deployed-release audit.

| Capability | Status | Actual scope and evidence |
| --- | --- | --- |
| Public event discovery and details | Implemented in source | [Web data loading](../../apps/web/server-events.ts), [event service](../../apps/api/src/events/events.service.ts); excludes drafts, includes cancelled events; UI search/date filters |
| Registration and login | Implemented in source | [Auth service](../../apps/api/src/auth/auth.service.ts); email/password and signed bearer sessions |
| Self-service event ownership | Implemented in source | Any authenticated user creates; owner edits/scans; selected platform-admin overrides |
| Organizer event management | Implemented in source (12 September 2026) | Own-event dashboard with search, lifecycle/local-date filters, sorting, refresh and ticket/capacity summaries; create/edit/draft/cancel flows retain their server permissions; stale/error states are explicit and undated drafts do not display 1970 |
| Drafts and scheduled publication | Implemented in source | Private owner-only drafts, scheduled publication, 30-second in-process poll and request-triggered catch-up |
| Event duplication | Implemented in source (10 September 2026) | Owner selects a future date; details and categories copy into an editable private draft with fresh IDs, shifted sales windows and no ticket history; [regression tests](../../apps/api/test/duplication.test.cjs) |
| Cancellation | Implemented in source | Preserves records, blocks sales and entry; does not refund or notify |
| Event images | Implemented in source (11 September 2026) | [Storage service](../../apps/api/src/events/image-storage.service.ts); validates JPEG/PNG/WebP/GIF contents, limits input to 40 megapixels, orients and fits within 1920×1920 without enlargement, strips metadata and stores static WebP in S3/local storage; edit form supports replacement/removal |
| Capacity | Implemented in source | Nullable capacity; transactional event locking prevents competing operations overselling at the inspected service boundary |
| Ticket categories and sale windows | Implemented in source (11 September 2026) | [Schema](../../prisma/schema.prisma), event/ticket services and [category manager](../../apps/web/components/ticket-type-manager.tsx); price, quantity, capacity, limits and windows. Checkout updates window states while open and refreshes availability every 30 seconds/on tab return; server enforces inclusive start and exclusive end |
| Guest and member issuance | Implemented in source | [Ticket service](../../apps/api/src/tickets/tickets.service.ts); name/email required, account linkage optional |
| Per-order purchase limits | Implemented in source (13 September 2026) | Organizers set category maximums from 1–100; uncategorized admission defaults to 10. Both checkouts explain the limit; HTTP and service validation reject invalid quantities before issuance. Limits apply per request, not cumulatively per buyer; cumulative limits remain in issue #23 |
| Repeat-request confirmation | Implemented with privacy gap | Returns count for submitted event/email before additional issuance; no proof of email control |
| QR generation and ticket history | Implemented in source | [Ticket response](../../apps/api/src/tickets/ticket-response.ts); code and QR returned to buyer, member history via account |
| Camera/manual validation | Implemented in source | [App provider](../../apps/web/components/app-provider.tsx), [gate controller](../../apps/api/src/gate/gate.controller.ts); online single-use validation |
| Host attendee list | Implemented in source (10 September 2026) | Owner/admin view with paginated name/email search, category, ticket status and check-in time; includes cancelled history, preserves draft privacy, omits QR credentials; issuance is not payment confirmation |
| Organizer sales overview | Implemented in source (12 September 2026) | All-owned or single-event reports with 30-second visible refresh, UTC issuance chart and accessible table. Lifetime totals retain cancellations, saved-price face value flags unpriced legacy tickets, and verified revenue stays unavailable pending payments |
| Mobile-money checkout | Partial | UI/DTO collects number; service neither persists it nor invokes a provider; paid-priced tickets issue without payment confirmation |
| Email delivery and recovery | Not implemented in inspected source | No mail provider, delivery queue or guest recovery endpoint |
| Forgot/reset password | UI placeholder | Forms show explanatory messages; no reset-token backend |
| Verified email, refresh/revocable sessions | Proposed | No verification or session storage models; [issue #2](https://github.com/rmkasendwa/passmint/issues/2) |
| Orders and settlement | Proposed | [#6](https://github.com/rmkasendwa/passmint/issues/6), [#52](https://github.com/rmkasendwa/passmint/issues/52); no order/payment tables |
| Tenants and shared staff | Proposed | [#45](https://github.com/rmkasendwa/passmint/issues/45), [#19](https://github.com/rmkasendwa/passmint/issues/19); current ownership is User → Event |
| Reusable seating and holds | Proposed | [#48](https://github.com/rmkasendwa/passmint/issues/48), [#49](https://github.com/rmkasendwa/passmint/issues/49), [#50](https://github.com/rmkasendwa/passmint/issues/50) |
| Cinema and bus modules | Proposed | [#53](https://github.com/rmkasendwa/passmint/issues/53), [#54](https://github.com/rmkasendwa/passmint/issues/54); cinema-themed demo events do not establish a cinema module |
| Timed entry, workshops, visitor passes | Proposed | [#56](https://github.com/rmkasendwa/passmint/issues/56), [#57](https://github.com/rmkasendwa/passmint/issues/57), [#59](https://github.com/rmkasendwa/passmint/issues/59) |
| Transfers, refunds, waitlists, season passes | Proposed | Existing issues plus [#60](https://github.com/rmkasendwa/passmint/issues/60); no operational endpoints |
| Offline validation and admission zones | Proposed | [#8](https://github.com/rmkasendwa/passmint/issues/8), [#58](https://github.com/rmkasendwa/passmint/issues/58) |
| Production resilience and compliance | Unverified | Source and CI configuration alone do not establish recovery, uptime, audits or policies |
| Docker and Coolify setup | Implemented and image smoke-tested | [Deployment guide](../deployment.md); non-root image, process supervision, readiness, persistent uploads and optional empty-schema initialization. Live Coolify deployment remains unverified. |

For current user behavior see [product workflows](../product-flow.md); for future acceptance criteria see the [roadmap](09-roadmap-and-decisions.md).
