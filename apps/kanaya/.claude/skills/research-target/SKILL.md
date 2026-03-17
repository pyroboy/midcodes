# Skill: /research-target

## Description
Research a pipeline target (school, company, or government org) and generate a personalized Kanaya Identity Solutions proposal as Markdown, then compile it to PDF.

## Trigger
User invokes `/research-target <org name>` or provides a target from the pipeline database.

## Prerequisites
- Working directory must be the `id-gen` app root (`apps/id-gen/`)
- Database must have the target in `pipeline_targets` table (or user provides details inline)
- Dev server should be running for PDF export via `/api/proposal/export`

## Workflow

### Step 1: Identify the Target
- If a target name/org is provided, look up the `pipeline_targets` table for matching entry
- If not in DB, ask the user for: org name, type (school/company/government), contact person, and estimated size (student/employee count)

### Step 2: Research via Web Search
Use `WebSearch` and `WebFetch` to gather:

**For Schools:**
- Student enrollment count (try DepEd/CHED data, school website)
- Location and address
- Current ID system (if mentioned anywhere)
- Accreditation level (PAASCU, etc.)
- Number of departments/colleges
- Key administrators (president, registrar)
- School website URL

**For Companies:**
- Employee count (LinkedIn, company website, SEC filings)
- Industry and primary business
- Number of offices/branches
- Current employee badge system
- Key HR/admin contacts

**For Government:**
- Number of employees/staff
- Departments and offices
- Location(s)
- Current ID system

### Step 3: Generate Personalized Proposal Markdown
Create the file at `static/proposals/{org-slug}/proposal.md` where `{org-slug}` is the org name slugified (lowercase, hyphens).

The markdown should follow this template structure:

```markdown
# Formal Project Proposal
## Kanaya Identity Solutions — {Org Name}

**Date:** {today's date}
**Valid for:** 15 days
**Prepared for:** {Org Name}
**Attention:** {Contact Person}

---

## 1. Executive Summary

### The Challenge
{Personalized paragraph referencing specific facts about their current situation.
For schools: mention student count, current ID pain points, safety concerns.
For companies: mention employee count, multi-location challenges, brand consistency.}

### The Kanaya Solution
{Personalized paragraph explaining how Kanaya specifically addresses THEIR needs.
Reference their size to suggest appropriate scale.
Mention relevant features for their type.}

Key benefits:
- **Instant Verification:** Guards/Security can scan IDs via NFC/QR to verify active status
- **Anti-Fraud:** Proprietary "Ghost Image" and Encrypted Data layers
- **Rapid Issuance:** Lost cards replaced in under 2 hours
- **{Type-specific benefit}:** {Customized based on research}

---

## 2. Technical Specifications

### 2.1 The Physical Credential

| Specification | Detail |
|---|---|
| Material | 3-Layer Fused PVC (Sandwich Type) - Non-fading |
| Dimensions | CR-80 (85.60 x 53.98 mm) - ISO Standard 7810 |
| Smart Chip | NXP Mifare 1K EV1 (13.56 MHz) — Optional |
| Data Encoding | AES-128 Encrypted UID linked to Kanaya Cloud |

### 2.2 The Digital Platform (SaaS)
{Customize platform features based on org type:
- Schools: DepEd/CHED compliance export, section-based management
- Companies: department-based management, visitor management
- Government: COA compliance, multi-office support}

### 2.3 Sample ID Design
{Describe what their card would look like:
- Front: org logo, photo, name, {role/section/department}, QR code
- Back: emergency contacts, barcode, org address}

---

## 3. Financial Proposal

### Recommended Package: "{Package Name}"

| Item | Qty | Unit Price | Total |
|---|---|---|---|
| Smart ID Card (PVC + QR) | {estimated count} | PHP 150.00 | PHP {total} |
| On-Site Data Capture | {days needed} days | PHP 5,000.00/day | PHP {total} |
| Kanaya Database Setup | 1 | ~~PHP 10,000.00~~ | **WAIVED** |
| {Optional: Additional items based on size} | | | |
| **GRAND TOTAL** | | | **PHP {grand total}** |

### Payment Terms
- **50% Downpayment** (PHP {amount}) upon contract signing
- **50% Balance** (PHP {amount}) upon delivery
- Quote valid for 15 days

---

## 4. Execution Timeline

| Phase | Timeline | Activity |
|---|---|---|
| Contract Signing | Day 1 | Downpayment & material mobilization |
| Data Capture | Day 2-{n} | On-site photo sessions by {section/department} |
| Production | Day {n}-{n} | Printing, laminating, curing |
| Delivery | Day {final} | Turnover & QR/NFC testing with admin |

---

## Why Kanaya for {Org Name}?

{2-3 paragraphs of personalized pitch based on research:
- Reference specific pain points discovered
- Mention their accreditation/standards requirements
- Compare to what competitors might offer
- Emphasize local support (Bohol-based)}

---

*Kanaya Identity Solutions | Confidential Proposal | {date}*
```

### Step 4: Compile to PDF
Call the dev server's PDF export endpoint:

```bash
curl -X POST http://localhost:5173/api/proposal/export \
  -H "Content-Type: application/json" \
  -d '{...proposal data...}'
```

Or use the markdown-to-PDF mode if available at `/api/proposal/export` with `{ mode: "markdown", markdown: "...", orgSlug: "..." }`.

Save the PDF to `static/proposals/{org-slug}/proposal.pdf`.

### Step 5: Update Database
Update the `pipeline_targets` row:
- Set `researched_at` to current timestamp
- Set `md_path` to `/proposals/{org-slug}/proposal.md`
- Set `pdf_path` to `/proposals/{org-slug}/proposal.pdf`

This can be done by directly using the Drizzle ORM via a script or by calling the `updateTarget` remote function.

## Output
When complete, report:
1. Key facts discovered during research
2. Path to generated MD file
3. Path to generated PDF file
4. Any assumptions made (e.g., estimated student count)

## Self-Improvement Protocol
If the user corrects any aspect of the generated proposal:
- Note the correction
- Update this SKILL.md with the corrected approach
- Re-generate the affected file

## Notes
- Currency is Philippine Peso (PHP)
- Kanaya is based in Bohol province (Tagbilaran/Panglao)
- Default pricing: PHP 150/card for PVC+QR, PHP 5,000/day for data capture
- Database setup fee is typically waived as a promotional offer
- CEO: Arjo Magno
