# Diligence evidence and transition plan

[Documentation index](../README.md)

## Evidence register

Suggested roles below are responsibilities to assign, not named staff already in place. All missing items remain **owner confirmation required**. Store actual evidence in a private data room with document owner, date, version and reviewer.

| ID | Evidence required | Suggested custodian | Completion evidence |
| --- | --- | --- | --- |
| D01 | Legal entity, jurisdiction, founders and cap table | Founder/company representative | Current signed/official records |
| D02 | Source and brand ownership, contributor assignments | Founder | Agreements and contributor-to-commit reconciliation |
| D03 | Customer contracts, active customers and launch status | Product/commercial owner | Dated contract list and reproducible usage definitions |
| D04 | Revenue, cash, costs, liabilities and commitments | Finance owner | Statements reconciled to underlying records; exclude demo metrics |
| D05 | Domains, hosting, databases, buckets and administrators | Operations owner | Completed account inventory and proven access |
| D06 | Release baseline and outstanding development | Engineering owner | Clean SHA/tag, tracked local additions, issue export and CI evidence |
| D07 | Production topology and security configuration | Operations/security owner | Reviewed deployment diagram and sanitized configuration record |
| D08 | Backup and disaster-recovery history | Operations owner | Backup inventory and successful isolated restore evidence |
| D09 | Privacy/security policies and incident history | Responsible privacy/security owner | Current notices, agreements, retention schedule and incident register |
| D10 | Software/asset licenses and SBOM | Engineering/company representative | Release-specific inventory, notices and rights evidence |
| D11 | Support obligations, contacts and escalation | Support/product owner | Support queue access, known incidents and contact rota |
| D12 | Product commitments and roadmap | Product owner | Review of customer promises versus proposed GitHub work |

Do not mark an item complete because a template exists. Unknown revenue is not zero revenue; an unverified deployment is not proof that the startup has never launched.

## Handover stages

### 1. Establish the transfer baseline

Confirm transaction scope with the responsible company representatives: assets/accounts/data included, excluded assets, dates and authorized recipients. Freeze a source baseline, preserve outstanding work, export the backlog and identify the deployed version if any. Produce an evidence manifest containing filename, date, owner, release SHA where relevant and checksum for exported bundles.

### 2. Receiving-team familiarization

Walk through the company/product overview and capability register. Demonstrate the supported free-event flow, ownership boundaries, drafts, capacity, tickets and duplicate scan rejection in a test environment. Explain payment/email placeholders and demo fallback explicitly. Review architecture, schema and known gaps with the incoming engineering team.

### 3. Access and recovery rehearsal

Provide individual least-privilege access through repository/cloud/domain providers. Transfer secret access through the approved vault. Have the incoming team independently set up development, run release checks and restore an approved backup into isolation. Record failures and repeat only affected checks after fixes. Do not remove the outgoing team's operational access before receiving-team access is proven.

### 4. Operational ownership change

Agree the cutover window, support contact, incident commander, rollback authority and how customers will be informed if needed. Validate DNS, certificates, application, storage and data integrity after any changes. Rotate relevant credentials, update billing/recovery contacts and review privileged user roles. Record acceptance and outstanding risks.

### 5. Stabilization and closure

Use an agreed support period with named contacts and escalation. Review incidents and residual gaps. Revoke outgoing access according to the agreed plan, archive the final evidence manifest, and confirm ownership of documentation maintenance and backlog decisions. No duration, SLA or contractual obligation is invented here.

## Receiving-company acceptance checklist

- [ ] Legal/asset scope and unresolved ownership questions are recorded by the responsible reviewers.
- [ ] Exact source release and any additional uncommitted work are accounted for.
- [ ] Incoming engineers can reproduce setup and build/test results.
- [ ] Incoming product owner can distinguish source capabilities from planned features.
- [ ] Guest/member issuance, owner boundaries and duplicate validation are demonstrated.
- [ ] Production existence, provider, domain and running version are confirmed or explicitly marked not applicable.
- [ ] Database and image restoration is demonstrated where operational data exists.
- [ ] Accounts, billing, recovery contacts and secret access are transferred and validated.
- [ ] Security/privacy/financial evidence gaps have named owners and dispositions.
- [ ] Customers, support obligations and open incidents are reviewed.
- [ ] Rollback, incident escalation and post-transfer support ownership are agreed.
- [ ] Remaining risks are accepted or assigned; no blanket production-readiness claim is made.

## Sign-off record

| Field | Value |
| --- | --- |
| Outgoing company representative | Owner confirmation required |
| Receiving company representative | Owner confirmation required |
| Product/engineering/operations reviewers | Owner confirmation required |
| Accepted source SHA and deployed release | Owner confirmation required |
| Evidence manifest location and version | Owner confirmation required |
| Acceptance date and remaining conditions | Owner confirmation required |

This is an operational acceptance record to complete alongside the company's actual transaction documents, not a substitute for them.
