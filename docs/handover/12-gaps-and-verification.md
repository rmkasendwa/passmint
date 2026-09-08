# Known gaps and documentation verification

[Documentation index](../README.md)

## Review scope

Prepared 7 September 2026 from source, schema, manifests, environment examples, development scripts, Docker configuration, CI and test files. Baseline commit: `8612c6bb40da44815fa730ee7a639c0b4f449d7e`, plus existing local ticket-type changes. No production environment, customer database, actual secret values, financial accounts or legal records were inspected.

## Gap register

Priority here describes recommended handover attention, not a claim of exploitability or a new implementation authorization. All resolution owners are to be assigned.

| ID | Gap / implication | Evidence | Required disposition |
| --- | --- | --- | --- |
| G01 | Paid-priced tickets issue without payment | Ticket service has no provider/order check | Implement #6/#52 before representing purchases as paid transactions |
| G02 | Email delivery and guest recovery absent | No mail/recovery backend | Implement #51/#62; correct customer expectations |
| G03 | Password reset is a UI placeholder | App-provider handlers only update text | Complete auth recovery before claiming it works |
| G04 | Production Docker path has missing build/runtime inputs | Dockerfile omits root build scripts, schema generation setup and runtime helper scripts | Repair and execute clean image build/start/smoke validation |
| G05 | Demo seeding and fallback can be mistaken for live inventory | Events startup and server-events fallback | Define production behavior and exclude samples from metrics |
| G06 | Default auth secret and unverified admin-email registration | Auth service | Review privileged provisioning and production config |
| G07 | Repeat-email response exposes purchase count | Ticket service conflict response | Implement privacy-preserving guest flow |
| G08 | No versioned database migration history | Prisma schema and `db push` scripts | Establish reviewed migration/rollback history and restore proof |
| G09 | No verified backup, monitoring, hosting or support record | Not provided in repository | Complete D05/D07/D08/D11 |
| G10 | Tenants, seats and verticals remain planned | No corresponding models/services | Preserve status distinction in sales and handover material |
| G11 | Uncommitted category work is not a released baseline | Working-tree modifications | Review, test and record the chosen release |
| G12 | Currency/time semantics need expansion | UGX formatting divides integers by 100; no currency/timezone fields | Specify migration/provider conversion and occurrence timezone rules |
| G13 | Revenue-looking counts are not payments | Active ticket counts and potential-value UI | Define reliable commercial metrics and source records |
| G14 | No ownership/license/contract evidence supplied | Repository metadata alone | Complete asset and diligence registers |
| G15 | Scan policy is one-use online, without time/gate scope | Gate body is code only | State limitation; implement #58 where needed |
| G16 | Ticket retry is not idempotent and QR rendering follows commit | Ticket service | Define retry/order semantics and reconcile response failures |
| G17 | Images lack content-processing pipeline; data rights unverified | Storage service, external artwork | Review upload processing and asset provenance |
| G18 | Sessions lack server revocation and use browser local storage | Auth service and app provider | Review security requirements and document accepted design |

## Validation record

For this documentation task, validation is limited to repository evidence review, documentation link checks and change-diff inspection. Application code was not changed. No application tests, production build, Docker build, load test, restore drill or security scan was executed as evidence for this package. Existing test files and CI configuration are described without claiming current pass status.

Documentation checks on 7 September 2026 covered 15 Markdown files (root README, product workflows, documentation index and 12 handover chapters): 68 local file links resolved, all fenced code blocks were balanced, and `git diff --check` reported no whitespace errors. External issue/vendor links were not revalidated during this documentation task. Existing application changes were left in place.

Before acquisition delivery, append actual release-specific evidence: test command/date/result, CI URL, image digest, deployed SHA, backup/restore report and reviewer. Resolve or explicitly accept gaps; do not silently remove them from a buyer's copy.

## Documentation change record

| Date | Change | Basis |
| --- | --- | --- |
| 2026-09-07 | Initial handover documentation set; current workflows corrected to separate implemented behavior from payment/email intentions | Inspected local source and founder-confirmed product direction |

Owner-provided company and production facts should be added with their source and date. Refresh this package whenever a feature, operational system or business commitment changes.
