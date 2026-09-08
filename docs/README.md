# Passmint documentation and acquisition handover

Passmint is building one free-to-use platform for tickets and gate passes. This documentation explains the product, the software available today, the intended expansion, and what a receiving company needs to verify and take over.

**Prepared:** 7 September 2026. **Document status:** repository-based handover draft, ready for owner and technical review. **Audience:** acquiring-company product, engineering, operations and diligence teams. Treat operational and ownership material as internal; confirm repository visibility before adding company records.

## Read in this order

| Document | Purpose |
| --- | --- |
| [Company and product overview](handover/01-company-and-product.md) | Purpose, customers, value proposition, business direction and unknown company facts |
| [Capability register](handover/02-capability-register.md) | Implemented, partial and planned capabilities, with evidence |
| [Product workflows](product-flow.md) | Buyer, organizer and gate-operator behavior today |
| [Architecture](handover/03-architecture.md) | Components, request flows, boundaries and design constraints |
| [Data dictionary](handover/04-data-dictionary.md) | Entities, fields, lifecycle and data handling |
| [API reference](handover/05-api-reference.md) | Current routes, permissions, payloads and errors |
| [Engineering guide](handover/06-engineering.md) | Setup, repository map, development and testing |
| [Operations and recovery](handover/07-operations.md) | Configuration, release, monitoring, incidents and recovery procedures |
| [Security and privacy](handover/08-security-and-privacy.md) | Observed controls, gaps and evidence needed |
| [Roadmap and decisions](handover/09-roadmap-and-decisions.md) | Confirmed principles, proposed features and sequencing |
| [Assets and ownership](handover/10-assets-and-ownership.md) | Software, infrastructure, IP, vendors and transfer records |
| [Diligence and transition](handover/11-diligence-and-transition.md) | Evidence requests, responsibility transfer and acceptance checklist |
| [Known gaps and verification](handover/12-gaps-and-verification.md) | Material limitations and review evidence |

## Evidence and status rules

The baseline is repository `rmkasendwa/passmint`, commit `8612c6bb40da44815fa730ee7a639c0b4f449d7e` (5 September 2026), **plus the local working tree reviewed on 7 September**. Ticket-type work changes the schema, API and frontend and was uncommitted at inspection. This package is not a description of an identified production release. Freeze and record a clean release before formal handover.

- **Implemented in source:** the inspected code contains the behavior. This does not establish deployment, test success, usage or commercial readiness.
- **Working-tree addition:** present locally but not in the recorded commit.
- **Partial:** some UI or logic exists; the complete business workflow does not.
- **Proposed:** product direction or GitHub issue; not shipped functionality.
- **Owner confirmation required:** information cannot be established from the repository. It does not mean the record or service does not exist.

Source code and tests establish technical behavior. The founder's confirmed direction establishes product principles. GitHub issues describe proposals, not contractual commitments. Older README text and UI copy may describe intended payments or email delivery; the capability register states the inspected implementation accurately.

## Maintaining and transferring this package

Update affected documents with each feature, schema, authorization or operational change. Record release SHA, document date, validation results and reviewer. Before sharing with a buyer, supply the missing evidence in the diligence register, verify source links, export the issue roadmap and attach an immutable release manifest. Keep credentials, customer exports, financial records and signed agreements in an access-controlled data room rather than this repository.

The package provides a product and technical account and an evidence index. It does not certify legal ownership, regulatory compliance, revenues, production uptime or acquisition readiness.
