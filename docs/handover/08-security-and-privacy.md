# Security and privacy record

[Documentation index](../README.md)

This records inspected implementation and unresolved evidence. It is not a penetration test, compliance certification or a statement that external controls are absent. No live credentials, production customer records or infrastructure settings were inspected.

## Observed controls

- [Auth service](../../apps/api/src/auth/auth.service.ts) normalizes emails and hashes passwords with PBKDF2-SHA256, a random 16-byte salt, 120,000 iterations and 32-byte output. Comparisons use timing-safe equality.
- Tokens use a custom two-part base64url payload/signature format with HMAC-SHA256, not a standard three-part JWT. Expiry is 14 days. Verification reloads the user from PostgreSQL.
- Event ownership checks are performed in services, not just hidden controls in the UI. Private drafts remain owner-only even for unrelated platform admins.
- Protected routes require bearer auth; public issuance intentionally permits guests. DTO validation rejects unrecognized fields.
- Ticket codes are unique random UUIDs. QR contents contain the code, not buyer contact data. Online scans use a transaction to reject reuse.
- Inventory operations lock the event row to serialize conflicting writes. Public ticket retrieval is not allowed: ticket, event-owner or platform-admin authorization is required.
- Image uploads require sign-in, matching decoded JPEG/PNG/WebP/GIF content, byte and pixel limits, and successful static WebP re-encoding. Stored uploads have generated `.webp` names and omit source metadata; external artwork URLs are not processed.

## Material gaps for review

| Finding | Evidence / consequence | Next review action |
| --- | --- | --- |
| Default token secret exists | Missing `AUTH_SECRET` falls back to a known development string | Require explicit production configuration and validate startup behavior |
| Platform-admin assignment uses unverified email at registration | `ADMIN_EMAILS` is consulted when creating users; no email-verification flow exists | Review privileged provisioning before public registration in any environment using that list |
| Browser local-storage sessions | Scripts on the origin can access tokens; logout removes browser state, not server sessions | Review session design, XSS controls and revocation requirements |
| No reset/verification backend | Account recovery and verified guest ownership are not implemented | Implement with scoped, expiring credentials; never recover ownership from email text alone |
| Repeat-email count disclosure | Public purchase conflict reveals event/email ticket count | Replace with privacy-preserving confirmation/recovery design in #51 |
| No app-level throttling found | Login, issuance and upload could be abused; infrastructure controls unknown | Verify deployed edge controls and add proportional abuse protection without paid gates |
| Image checks rely on declared type | No inspected file-signature validation, decode/re-encode, malware or metadata-removal pipeline | Review content processing and asset-serving policy |
| Images deliberately public | MinIO init grants anonymous downloads for the image bucket | Keep personal documents and ticket exports out of that bucket |
| No admission window or selected gate | Scan code alone determines the event; no time/zone policy | Define operational restrictions as product rules under #58 |
| No durable audit ledger | No transfer/refund/operator/device scan history model | Add auditable actions and access monitoring with minimized personal data |
| Development defaults and demo data | Local passwords, seed events and fallback listings exist | Prove clean configuration and real-data isolation for launch |

These actions support valid ownership and reliable service; they do not change the founder's free-access/no-subscription direction.

## Personal data flow

A buyer submits name and email to the API; tickets store them even without an account. Registration adds a password hash and user identity. Ticket history associates issuance and check-in with a user where signed in. Authorized ticket/event owners and platform admins can retrieve ticket contact data. Public event output projects owner name/ID rather than password information.

The DTO accepts a mobile-money number, but the inspected service does not store or transmit it to a payment provider. External request logs were not inspected and may still capture submitted values. The browser stores session information and theme preferences; no claim is made about trackers added outside this repository.

## Policy and evidence register

The owner must provide operating jurisdictions, controller/processor roles, current privacy notice and terms, customer agreements, consent choices, retention/deletion schedules, subprocessors, data locations, incident history and any assessments/audits. No retention or automated data-subject request workflow was found in code. Establish applicable requirements with the receiving company's responsible specialists; no jurisdiction-specific compliance conclusion is made here.

For diligence use aggregate or synthetic data first. Customer exports should document purpose, recipient, fields, authorization, retention and deletion. Remove password hashes, bearer tokens and usable ticket codes from general demonstrations. Mark paid orders and sample records accurately; no real payment ledger exists yet.

## Security handover

Inventory repository, cloud, database, storage, DNS and CI principals; identify a named owner for each. Transfer access through provider-supported invitations and a secrets manager. Validate new access before removing old access. Schedule credential rotation and verify application operation afterward. Rotating `AUTH_SECRET` invalidates signatures of existing sessions; plan the user impact. Changing `ADMIN_EMAILS` does not automatically change existing stored roles.

Record unresolved risks, acceptance owner and mitigation dates in the [gap register](12-gaps-and-verification.md). A formal security review of the chosen release remains a separate deliverable.
