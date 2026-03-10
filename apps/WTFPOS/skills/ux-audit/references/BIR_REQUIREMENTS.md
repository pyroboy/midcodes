# BIR Compliance Requirements for POS Reports

Philippine Bureau of Internal Revenue (BIR) requirements affecting WTFPOS X-Readings,
Z-Readings, and receipt formatting. Use during audits of `/reports/x-read`,
`/reports/eod`, and any receipt-related flows.

**Disclaimer:** This reference is based on BIR Revenue Regulations (RR) No. 16-2018 and
related CAS (Computerized Accounting System) requirements as commonly applied to POS
systems in the Philippines. For authoritative compliance, consult the client's BIR-accredited
CAS provider or tax advisor.

---

## X-Reading (Shift Report)

An X-Reading is a **mid-day, non-resetting** sales snapshot. It does NOT reset counters.
Multiple X-Readings can be generated per business day.

### Required Fields

| Field | Description | UX audit check |
|---|---|---|
| Business name & TIN | "WTF! Corporation" + Tax Identification Number | Must appear on every X-Read printout/screen |
| Branch name & address | Full branch address (not just "Alta Citta") | Verify branch address is complete, not abbreviated |
| Machine Identification No. (MIN) | BIR-assigned per POS terminal | Must be visible — each tablet is a separate MIN |
| Serial No. of POS | Manufacturer serial | Must appear |
| Date & Time of X-Reading | Exact timestamp of generation | Use Philippine Standard Time (PST, UTC+8) |
| X-Reading counter | Sequential number (never resets) | Must increment. If it resets, compliance violation |
| Beginning SI No. | First Sales Invoice number in this period | |
| Ending SI No. | Last Sales Invoice number in this period | |
| Beginning Void No. | First void transaction number | |
| Ending Void No. | Last void transaction number | |
| Gross Sales | Total before discounts and VAT | |
| Less: VAT | 12% VAT collected | Label must say "VAT" not just "Tax" |
| Less: Discounts | Breakdown by type (SC, PWD, Other) | Must itemize Senior Citizen and PWD separately |
| VAT-Exempt Sales | Sales to SC/PWD (VAT-exempt portion) | Must be separate line item |
| VAT-Zero Rated Sales | (Usually ₱0.00 for restaurants) | Must appear even if zero |
| Net Sales | Gross − Discounts − VAT | |
| Cash in Drawer | Current cash total | |
| Total number of transactions | Count of completed orders | |

### UX Audit Points for X-Read Page

- **All fields must be visible without scrolling** on tablet landscape (1024×768)
- **"Generate X-Reading" button must be branch-specific** — generating in ALL location context
  is a compliance violation (each terminal reports independently)
- **Counter must be sequential** — verify it doesn't reset or skip
- **Timestamp must be auto-generated** — staff should not be able to backdate
- **SI (Sales Invoice) numbers must be sequential** — gaps indicate missing transactions
- **"Tax" label should read "VAT"** for BIR compliance clarity

---

## Z-Reading (End-of-Day Report)

A Z-Reading is the **end-of-business-day report** that resets daily counters. Only ONE
Z-Reading per business day per terminal.

### Required Fields

Everything in X-Reading, PLUS:

| Field | Description | UX audit check |
|---|---|---|
| Z-Reading counter | Sequential, never resets (lifetime of machine) | Must increment by exactly 1 per business day |
| Grand Accumulated Sales | Running total since machine registration | Never resets — accumulates across all Z-Reads |
| Reset counter | Number of times the machine has been reset | Should be 0 or very low. Any reset is auditable |
| Transaction count for the day | Total completed transactions | Must match SI range |
| Cash declaration | Actual cash counted in drawer | Staff inputs this — compare to system calculation |
| Over/Short | Difference between expected and declared cash | Highlight discrepancy clearly |
| Void summary | Count and total of voided transactions | BIR watches void frequency closely |
| Discount summary | Breakdown: SC discount, PWD discount, Other | With count of discounted transactions |
| Sales breakdown by payment type | Cash, GCash, Maya (each separately) | Must not lump e-wallets together |
| Sales breakdown by VAT category | Vatable, VAT-exempt, Zero-rated | |

### UX Audit Points for EOD/Z-Read Page

- **Z-Reading must be BLOCKED in ALL location context** — it's per-terminal, per-branch
- **One Z-Read per business day** — UI should prevent double generation (show warning if
  already generated today)
- **Cash declaration input** — must be easy to enter accurately on a numpad. Staff is tired
  at end of day (see ENVIRONMENT.md shift rhythms)
- **Over/Short display** — must be prominently visible and color-coded:
  - Green: ₱0 (exact match)
  - Yellow: ₱1–₱50 (minor variance, common)
  - Red: >₱50 (significant, needs investigation)
- **Grand Accumulated Sales** — must be clearly labeled as "lifetime total" to prevent
  confusion with daily sales
- **Void summary** — should show both count and total. High void counts may trigger BIR audit

---

## Receipt Requirements

While thermal printing is not yet implemented (Phase 2+), the receipt preview/modal should
follow BIR formatting requirements so the data model is correct when printing is added.

### Required Receipt Fields

| Field | Notes |
|---|---|
| Business name, TIN, address | Header area |
| MIN (Machine ID) | Per terminal |
| Date and time of transaction | PST |
| Sales Invoice (SI) number | Sequential, no gaps |
| Table number / Takeout ID | For reference |
| Itemized list with quantities and prices | Each item on separate line |
| Subtotal (before discounts/tax) | |
| Discount line (type + amount) | "SC Discount (20%): −₱XXX" |
| VAT line (12%) | Separate from subtotal |
| Total amount due | |
| Payment method and amount | Cash: ₱XXX, GCash: ₱XXX |
| Change due (cash transactions) | |
| "THIS SERVES AS YOUR OFFICIAL RECEIPT" | Required footer text |
| "Thank you" or similar | Optional but standard |

### Audit Points for Receipt Preview

- **SI number must be visible and sequential**
- **VAT must be a separate line item** — not buried in the total
- **Discount must specify type** — "Senior Citizen Discount" not just "Discount"
- **"THIS SERVES AS YOUR OFFICIAL RECEIPT"** — required by BIR on every receipt
- **Payment method breakdown** — if split payment, show each method and amount

---

## Common BIR Compliance Pitfalls in POS Audits

| Pitfall | Risk | What to flag |
|---|---|---|
| X-Read available in "All Locations" | Each terminal must report independently | Flag if generate button is active when locationId === 'all' |
| Z-Read counter resets | BIR requires lifetime sequential counter | Flag if counter appears to reset or skip |
| "Tax" instead of "VAT" | BIR requires specific terminology | Flag column headers using "Tax" — should say "VAT" or "VAT Collected" |
| Voids without audit trail | Every void must be logged with reason + authorizer | Flag if void modal doesn't capture reason and manager PIN |
| Discount without ID logging | SC/PWD discounts require ID number record | Flag if discount applied without ID entry step |
| Combined e-wallet line | "Digital Payment" lumping GCash + Maya | BIR requires per-method breakdown |
| Missing VAT-exempt line | Even ₱0.00 must appear | Flag if VAT-exempt and Zero-rated lines are hidden when zero |
| Backdated transactions | All timestamps must be system-generated PST | Flag if any date/time field is editable by staff |

---

## How to Use During Audit

1. **X-Read audit:** Navigate to `/reports/x-read`. Check all required fields are present,
   correctly labeled, and visible on tablet viewport. Cross-reference with the Required Fields
   table above.

2. **EOD audit:** Navigate to `/reports/eod`. Verify Z-Read generation is branch-locked,
   counter is sequential, cash declaration input is usable, and Over/Short is prominently
   displayed.

3. **Receipt audit:** Open CheckoutModal → ReceiptModal. Verify all receipt fields are present
   in the preview. Flag missing SI numbers, missing VAT lines, or generic discount labels.

4. **Cross-page compliance:** Verify that BIR-sensitive pages (X-Read, Z-Read, Receipt) are
   NOT accessible or generatable from the ALL location context.
