# Known gaps and documentation verification

[Documentation index](../README.md)

## Review scope

Prepared 7 September and refreshed 8 September 2026 from source, schema, manifests, environment examples, development scripts, Docker configuration, CI and tests. This revision includes the ticket-category implementation and Docker deployment from [PR #67](https://github.com/rmkasendwa/passmint/pull/67), merged at `f5b22a1d79423b9144d8df8a1bed26d3c1b9b53b`. No production environment, customer database, actual secret values, financial accounts or legal records were inspected.

## Gap register

Priority here describes recommended handover attention, not a claim of exploitability or a new implementation authorization. All resolution owners are to be assigned.

| ID | Gap / implication | Evidence | Required disposition |
| --- | --- | --- | --- |
| G01 | Paid-priced tickets issue without payment | Ticket service has no provider/order check | Implement #6/#52 before representing purchases as paid transactions |
| G02 | Email delivery and guest recovery absent | No mail/recovery backend | Implement #51/#62; correct customer expectations |
| G03 | Password reset is a UI placeholder | App-provider handlers only update text | Complete auth recovery before claiming it works |
| G04 | Resolved in #67: missing Docker build/runtime inputs | Image builds include scripts, Prisma generation and public assets; CI exercises both setup modes | Retain release-specific build/smoke evidence and validate live hosting |
| G05 | Resolved production defaults in #67: unintended demo seeding/fallback | Production skips seeding unless explicitly enabled; frontend fallback is development-only | Keep `SEED_DEMO_DATA` disabled on live service; exclude intentional samples from metrics |
| G06 | Root email is not yet verified; development auth fallback | Root authority is reconciled from `ROOT_ADMIN_EMAIL`; production rejects missing/placeholder signing secrets | Complete verified-email authentication before enabling root access on a public deployment |
| G07 | Repeat-email response exposes purchase count | Ticket service conflict response | Implement privacy-preserving guest flow |
| G08 | No versioned database migration history | Prisma schema and `db push` scripts | Establish reviewed migration/rollback history and restore proof |
| G09 | No verified backup, monitoring, hosting or support record | Not provided in repository | Complete D05/D07/D08/D11 |
| G10 | Tenants, seats and verticals remain planned | No corresponding models/services | Preserve status distinction in sales and handover material |
| G11 | Category schema requires deployment update | New `ticket_types` table and ticket snapshot fields | Preserve existing data; review and apply schema change before starting upgraded app |
| G12 | Currency/time semantics need expansion | UGX formatting divides integers by 100; no currency/timezone fields | Specify migration/provider conversion and occurrence timezone rules |
| G13 | Revenue-looking counts are not payments | Active ticket counts and potential-value UI | Define reliable commercial metrics and source records |
| G14 | No ownership/license/contract evidence supplied | Repository metadata alone | Complete asset and diligence registers |
| G15 | Scan policy is one-use online, without time/gate scope | Gate body is code only | State limitation; implement #58 where needed |
| G16 | Ticket retry is not idempotent and QR rendering follows commit | Ticket service | Define retry/order semantics and reconcile response failures |
| G17 | Upload processing implemented 11 September 2026; data rights remain unverified | Validated, resized, metadata-stripped WebP uploads; external artwork URLs are not processed | Review asset provenance and retain image regression/container checks |
| G18 | Sessions lack server revocation and use browser local storage | Auth service and app provider | Review security requirements and document accepted design |

## Validation record

The initial documentation review on 7 September was limited to repository inspection and documentation checks. Subsequent Docker implementation was tested with a clean image build, existing integration tests and both container smoke modes. The smoke checks cover non-root execution, real static assets, ordinary-user ownership boundaries, guest QR issuance, duplicate scans, readiness, retained tickets/uploads after replacement and child-process failure. Startup-initialization mode also verifies an existing marker table is preserved. This establishes isolated-container behavior, not a live Coolify deployment, load test, backup restore drill or security audit.

PR #67 passed [Checks](https://github.com/rmkasendwa/passmint/actions/runs/34157665648) and [Docker deployment](https://github.com/rmkasendwa/passmint/actions/runs/34157665654) at head `dda5b218b6bed462307a8c3ea291666d280f8c15`. The locally smoke-tested image ID was `sha256:b24f531f29998a1d99f79ac92cf5de30bcb721eb05690d48d92f1e544b0720d8`; this is local image evidence, not a published registry digest. Ticket-category integration tests are included in this revision and run through the Checks workflow.

Before acquisition delivery, append actual release-specific evidence: test command/date/result, CI URL, image digest, deployed SHA, backup/restore report and reviewer. Resolve or explicitly accept gaps; do not silently remove them from a buyer's copy.

On 8 September 2026 the consolidated source passed both workspace type checks and production builds in the Docker Node 22 build stage. All 14 integration tests passed against a disposable PostgreSQL 16 database, including HTTP category validation, draft permissions, concurrent inventory and price/name snapshots. Documentation checks covered 16 Markdown files and 72 resolving local links, with balanced code fences.

## Documentation change record

| Date | Change | Basis |
| --- | --- | --- |
| 2026-09-07 | Initial handover documentation set; current workflows corrected to separate implemented behavior from payment/email intentions | Inspected local source and founder-confirmed product direction |
| 2026-09-08 | Integrated ticket categories and refreshed production architecture, operations, deployment and resolved-gap evidence | Source review, category tests and Docker PR #67 |

Owner-provided company and production facts should be added with their source and date. Refresh this package whenever a feature, operational system or business commitment changes.
