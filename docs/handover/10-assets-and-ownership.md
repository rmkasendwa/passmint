# Asset, dependency and ownership register

[Documentation index](../README.md)

This is a transfer inventory, not a declaration that all rights belong to a legal entity. Repository access does not establish copyright ownership. Real account IDs, agreement links and evidence should be entered into a private data room.

## Asset inventory

| Asset | Evidence available | Owner / transfer information required |
| --- | --- | --- |
| Passmint source | [GitHub repository](https://github.com/rmkasendwa/passmint), local checkout | Legal owner, contributors, rights assignments, authorized repository transfer recipient |
| Ticket-category source | API/web/schema implementation and integration tests | Commit history, review record and contributor IP assignments |
| Product requirements and backlog | Repository docs and GitHub issues, especially #65 | Export of issues/comments and product decision owner |
| Brand, name and logo | Passmint naming and web icon in source | Trademark status, authorship, rights and design originals |
| Domains and DNS | Owner confirmation required | Registrar, registrant, renewal, DNS zone and transfer authority |
| Application hosting | Owner confirmation required | Provider, account/project, regions, releases, billing and access |
| Database | PostgreSQL schema and local Compose volume | Real database endpoints, data ownership, backup schedule and export/restore evidence |
| Event images | Storage code, MinIO local configuration, uploaded and remote artwork paths | Actual bucket inventory, account rights, content licenses, lifecycle and backup |
| External demo artwork | Unsplash URLs in event seed/demo code | Applicable rights, provenance and dependency on externally available images |
| Payment-brand artwork | MTN/Airtel SVG files in web public directory | Source and permitted brand use; this is not evidence of a payment-provider partnership |
| CI and build artifacts | GitHub workflow and Dockerfile | Actions permissions, artifact retention, registry ownership and release evidence |
| Secrets and service identities | Configuration names only | Secrets-manager locations, custodians, rotation and recovery procedures |
| Customer/support/commercial records | Not supplied | Contracts, communications, subscriptions, invoices, disputes and authorized data access |

## Software dependency inventory

| Dependency group | Current purpose | Handover action |
| --- | --- | --- |
| Node.js, pnpm, TypeScript | Runtime, package/build toolchain | Record exact runtime and lockfile at release |
| Next.js, React, React DOM | Web rendering and UI | Include exact dependency tree and notices |
| NestJS, Express platform, RxJS | API framework/runtime | Verify resolved versions and maintenance status at transfer |
| Prisma and `pg` | PostgreSQL client/schema access and tests | Transfer schema and migration process; include engine/runtime artifacts |
| `qrcode`, `@zxing/browser` | QR generation and browser decoding | Verify distribution obligations and retain notices |
| Tailwind/PostCSS, Lucide | Styling and icons | Include license/provenance evidence |
| PostgreSQL and MinIO containers | Local database/object storage | Review container and transitive component licenses for intended deployment |
| GitHub Actions | Source checks | Review pinned actions, permissions and third-party access |

The manifest is not a complete software bill of materials. Generate a release-specific direct/transitive dependency inventory with versions, licenses, provenance and applicable notices. No root LICENSE file was found in the inspected inventory; `private: true` in package manifests prevents accidental package publication but does not define ownership or license terms. Do not assert that every dependency or asset is permissively licensed without a completed review.

## Transfer procedure per external account

Record service, account identifier, legal owner, current administrator, billing owner, recovery methods, renewal/expiry date, data region, contract transfer conditions, receiving administrator and validation evidence. Transfer through the provider's supported process, validate access, then rotate credentials and remove departing access at the agreed time. Keep credentials separate from the inventory.

For source transfer, retain Git history, branches, tags, issues, CI settings and a release manifest. Check webhooks, deploy keys and automation identities individually. For domains, verify DNS and certificates after transfer. For data/storage, prove a restore before retiring the previous environment.

## Records to collect from the founder

Incorporation/capitalization records; founder, employee and contractor IP agreements; third-party code and asset licenses; customer/vendor contracts; hosting/payment arrangements; financial records; grants/debt; incidents/disputes; and any restrictions affecting account or asset transfer. Applicability and completeness must be confirmed by the owner and receiving company's diligence team.
