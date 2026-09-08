# Capability register

[Documentation index](../README.md)

Status reflects the source reviewed on 8 September 2026, not a deployed-release audit.

| Capability | Status | Actual scope and evidence |
| --- | --- | --- |
| Public event discovery and details | Implemented in source | [Web data loading](../../apps/web/server-events.ts), [event service](../../apps/api/src/events/events.service.ts); excludes drafts, includes cancelled events; UI search/date filters |
| Registration and login | Implemented in source | [Auth service](../../apps/api/src/auth/auth.service.ts); email/password and signed bearer sessions |
| Self-service event ownership | Implemented in source | Any authenticated user creates; owner edits/scans; selected platform-admin overrides |
| Drafts and scheduled publication | Implemented in source | Private owner-only drafts, scheduled publication, 30-second in-process poll and request-triggered catch-up |
| Cancellation | Implemented in source | Preserves records, blocks sales and entry; does not refund or notify |
| Event images | Implemented in source | [Storage service](../../apps/api/src/events/image-storage.service.ts); S3-compatible PUT or local fallback, no image transformation pipeline |
| Capacity | Implemented in source | Nullable capacity; transactional event locking prevents competing operations overselling at the inspected service boundary |
| Ticket categories and sale windows | Implemented in source | [Schema](../../prisma/schema.prisma), event/ticket services and [category manager](../../apps/web/components/ticket-type-manager.tsx); price, quantity, capacity, limits and windows |
| Guest and member issuance | Implemented in source | [Ticket service](../../apps/api/src/tickets/tickets.service.ts); name/email required, account linkage optional |
| Repeat-request confirmation | Implemented with privacy gap | Returns count for submitted event/email before additional issuance; no proof of email control |
| QR generation and ticket history | Implemented in source | [Ticket response](../../apps/api/src/tickets/ticket-response.ts); code and QR returned to buyer, member history via account |
| Camera/manual validation | Implemented in source | [App provider](../../apps/web/components/app-provider.tsx), [gate controller](../../apps/api/src/gate/gate.controller.ts); online single-use validation |
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
