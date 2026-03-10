# WTFPOS UX Audit Prompt Library

Quick-copy prompts for invoking the ux-audit skill. Use as-is or combine.
Format: `ux-audit, [intensity], [scenario], [roles], [branch]`

Intensities: **light** · **heavy** · **extreme** · **chaos**
Modes: **single-user** · **multi-user**

havent proven this
ux-audit staff extreme, multiple pax mixtures, all senior, 1 adult rest are all kids, 5 seniors 1 adult, etc. up until checkout,  tables may have extra alacarts and takeouts. , others            
requestiong extra tong's untisils, other ordered alacart with special request, others, returned orders, full chaos    
---

## Single-User — Light

01. `ux-audit, single-user, light, staff logs in and opens one table, enters pax, selects pork package, staff, alta citta`
02. `ux-audit, single-user, light, manager views inventory list and checks one low-stock item, manager, alta citta`
03. `ux-audit, single-user, light, owner opens branch comparison report and reads this week's data, owner, all`
04. `ux-audit, single-user, light, kitchen views KDS with 3 active tickets and bumps one meat item, kitchen, alta citta`
05. `ux-audit, single-user, light, staff logs one expense: electricity bill, cash payment, manager, alta citta`
06. `ux-audit, single-user, light, admin views audit log from last night's service, admin, alta citta`
07. `ux-audit, single-user, light, manager switches location from alta citta to alona beach and back, manager, all`
08. `ux-audit, single-user, light, staff views floor plan with 4 idle tables and 2 occupied, staff, alta citta`
09. `ux-audit, single-user, light, owner reads X-Read history with 3 entries and checks branch labels, owner, alta citta`
10. `ux-audit, single-user, light, kitchen views weigh station page and checks bluetooth scale connection status, kitchen, alta citta`
11. `ux-audit, single-user, light, manager opens delivery form, fills in one item, submits successfully, manager, alta citta`
12. `ux-audit, single-user, light, staff opens AddItemModal and browses meat category, adds 2 items, staff, alta citta`
13. `ux-audit, single-user, light, owner views sales summary report for today, owner, alta citta`
14. `ux-audit, single-user, light, admin views registered devices list and checks last heartbeat timestamps, admin, alta citta`
15. `ux-audit, single-user, light, manager logs a waste entry: 500g pork belly, spoilage reason, manager, alta citta`

---

## Single-User — Heavy

16. `ux-audit, single-user, heavy, staff opens table, adds 8 items across meat and drinks categories, applies SC discount, checks out with cash, staff, alta citta`
17. `ux-audit, single-user, heavy, manager does full expense entry session: 6 different categories, GCash and cash payments, reviews log filtered to today, manager, alta citta`
18. `ux-audit, single-user, heavy, kitchen processes 6 KDS tickets sequentially, bumps meats then dishes, handles one refill request, kitchen, alta citta`
19. `ux-audit, single-user, heavy, owner runs full reports tour: X-Read, EOD, sales summary, meat report, branch comparison, voids, profit, owner, alta citta`
20. `ux-audit, single-user, heavy, manager receives a delivery with 5 line items, fills batch and expiry dates, submits and checks stock update, manager, alta citta`
21. `ux-audit, single-user, heavy, staff creates takeout order, adds items, processes payment via GCash, prints receipt, staff, alta citta`
22. `ux-audit, single-user, heavy, admin builds floor plan from scratch: adds 6 tables, 2 walls, 1 label, adjusts chair counts, saves and previews, admin, alta citta`
23. `ux-audit, single-user, heavy, manager generates X-Read, checks branch label in output, exports for BIR, manager, alta citta`
24. `ux-audit, single-user, heavy, kitchen uses weigh station to log 4 different meat portions from bluetooth scale simulator, then checks yield calculator, kitchen, alta citta`
25. `ux-audit, single-user, heavy, staff handles split bill on table of 6: 3 sub-bills, mixed payments cash and maya, staff, alta citta`
26. `ux-audit, single-user, heavy, manager does AM stock count: enters weight for 8 meat items, compares vs expected, reviews variance, manager, alta citta`
27. `ux-audit, single-user, heavy, owner creates 2 new staff users, assigns roles, tests that staff cannot access admin, owner, alta citta`
28. `ux-audit, single-user, heavy, staff processes 4 consecutive table checkouts back to back, different payment methods each time, staff, alta citta`
29. `ux-audit, single-user, heavy, manager reviews peak hours report, best sellers, and staff performance for the week, manager, alta citta`
30. `ux-audit, single-user, heavy, kitchen marks 2 items as sold out (86), views all-orders list, refuses one item with reason grill down, kitchen, alta citta`

---

## Single-User — Extreme

31. `ux-audit, single-user, extreme, staff opens 8 tables rapid-fire, all different pax and packages, then processes 3 checkouts with SC/PWD/GCash, staff, alta citta`
32. `ux-audit, single-user, extreme, manager full shift: opens with stock count, receives delivery mid-service, logs 4 expenses, generates X-Read at close, manager, alta citta`
33. `ux-audit, single-user, extreme, kitchen full service session: 10 tickets, refill tsunami of 6, one void acknowledgment, one 86, one refused item, kitchen, alta citta`
34. `ux-audit, single-user, extreme, owner post-service deep dive: Z-Read, branch comparison, meat ontology graph, gross and net profit, voids audit, export all, owner, all`
35. `ux-audit, single-user, extreme, admin full setup: floor editor, user management, menu item CRUD for 5 items, audit log review, device management, admin, alta citta`
36. `ux-audit, single-user, extreme, staff handles walk-in chaos: table transfer, pax change mid-meal, item void, leftover penalty, split 4-way bill, staff, alta citta`
37. `ux-audit, single-user, extreme, manager expense audit: delete 2 wrong entries (manager PIN each time), re-enter correctly, filter by week, verify totals match, manager, alta citta`
38. `ux-audit, single-user, extreme, kitchen end-to-end: logs weights at weigh station, processes KDS for 8 tables, fires refills, 86s 2 items, checks all-orders view, kitchen, alta citta`
39. `ux-audit, single-user, extreme, owner cross-branch day: switches between alta citta and alona beach 6 times, compares stock levels, reads reports for each branch separately, owner, all`
40. `ux-audit, single-user, extreme, staff new-hire simulation: makes every beginner mistake — wrong table, wrong pax, wrong package, voids twice, takes 3 tries to check out, staff, alta citta`

---

## Single-User — Chaos

41. `ux-audit, single-user, chaos, staff: printer offline during 3 consecutive checkouts, must complete all without receipt, then retry print after reconnect, staff, alta citta`
42. `ux-audit, single-user, chaos, manager: receives delivery while simultaneously handling manager PIN requests from staff every 2 minutes, never finishes a single task cleanly, manager, alta citta`
43. `ux-audit, single-user, chaos, kitchen: 14 active tickets at once, refill requests mixed in, 3 items voided mid-cook, scale disconnects during weighing, music cuts out, kitchen, alta citta`
44. `ux-audit, single-user, chaos, owner: reviews data while switching between all-locations and branch views repeatedly, generating X-Read then Z-Read in wrong order, correcting and retrying, owner, all`
45. `ux-audit, single-user, chaos, staff: all 8 tables full, 3 requesting refills, 1 demanding void, 1 wanting pax change, 1 asking for bill split, all at same time, single staff member, staff, alta citta`
46. `ux-audit, single-user, chaos, manager: stock count interrupted 5 times by floor issues, draft never saves correctly, delivery arrives during count, 2 items show wrong variance, manager, alta citta`
47. `ux-audit, single-user, chaos, kitchen: KDS audio playing at wrong volume, ticket pulse expired, refills mixed with cook orders, void overlay overlapping new ticket, kitchen, alta citta`
48. `ux-audit, single-user, chaos, admin: building floor plan while staff is actively using POS, saves mid-session, checks if POS floor updates without breaking active orders, admin, alta citta`
49. `ux-audit, single-user, chaos, staff: SC discount and PWD discount conflict on same table, checkout blocked, manager PIN times out, GCash payment fails, must fall back to cash, staff, alta citta`
50. `ux-audit, single-user, chaos, manager: expense log has 30+ entries from last month mixed with today, no filter applied, must find and delete one wrong entry buried in the list, manager, alta citta`

---

## Multi-User — Light

51. `ux-audit, light multi-user, staff opens table and sends order, kitchen receives ticket and bumps it, staff + kitchen, alta citta`
52. `ux-audit, light multi-user, manager switches location to alona beach while staff continues service at alta citta, verify no cross-location data bleed, staff + manager, alta citta`
53. `ux-audit, light multi-user, staff checks out one table with cash, owner sees the sale reflected in X-Read immediately, staff + owner, alta citta`
54. `ux-audit, light multi-user, kitchen 86s one item, staff tries to add that item and is blocked, kitchen + staff, alta citta`
55. `ux-audit, light multi-user, manager logs an expense, owner views expense daily report and sees it, manager + owner, alta citta`
56. `ux-audit, light multi-user, staff fires a refill request, kitchen sees it in the REFILL REQUESTS section separately, staff + kitchen, alta citta`
57. `ux-audit, light multi-user, admin adds a new menu item, staff sees it available in AddItemModal without refresh, admin + staff, alta citta`
58. `ux-audit, light multi-user, kitchen refuses a meat item, staff sees kitchen alert on POS, manager is notified, kitchen + staff + manager, alta citta`
59. `ux-audit, light multi-user, manager generates X-Read, owner views it in reports with correct branch label, manager + owner, alta citta`
60. `ux-audit, light multi-user, staff voids one item, kitchen sees voided overlay on KDS ticket for 10 seconds, staff + kitchen, alta citta`

---

## Multi-User — Heavy

61. `ux-audit, heavy multi-user, 4 tables open simultaneously by staff, kitchen processes all tickets, manager monitors sidebar urgency badges, staff + kitchen + manager, alta citta`
62. `ux-audit, heavy multi-user, full expense session: manager logs 5 expenses, owner reviews totals, finds discrepancy, manager corrects one entry, owner re-checks, manager + owner, alta citta`
63. `ux-audit, heavy multi-user, delivery arrives mid-service: kitchen weighs meat at station, manager receives delivery in stock form, stock levels update live, kitchen + manager, alta citta`
64. `ux-audit, heavy multi-user, 3 tables check out in 5 minutes: cash, GCash, split bill — kitchen queue clears, owner sees revenue update in sales summary, staff + kitchen + owner, alta citta`
65. `ux-audit, heavy multi-user, kitchen marks pork belly and lettuce as 86, staff gets blocked on both items, manager sees low stock badge, restocks one item, kitchen + staff + manager, alta citta`
66. `ux-audit, heavy multi-user, staff handles 2 simultaneous takeout orders alongside 3 dine-in tables, kitchen juggles both queues, manager monitors floor, staff + kitchen + manager, alta citta`
67. `ux-audit, heavy multi-user, owner reviews branch comparison while manager generates X-Read at alta citta and second manager at alona beach simultaneously, manager + manager + owner, all`
68. `ux-audit, heavy multi-user, admin edits floor plan mid-service, staff on POS sees updated layout, kitchen unaffected, admin + staff, alta citta`
69. `ux-audit, heavy multi-user, full refill cycle: 5 tables request refills, kitchen handles them in REFILL section, bumps all, staff sees completions on floor badges, staff + kitchen, alta citta`
70. `ux-audit, heavy multi-user, manager does PM stock count while kitchen continues service, counts submitted, variance report visible to owner, kitchen + manager + owner, alta citta`

---

## Multi-User — Extreme

71. `ux-audit, extreme multi-user, full service cycle: wave 1 all tables open, mid-service chaos (voids, refills, 86, package changes, transfers), wave 2 re-fill, EOD close, staff + kitchen + manager + owner, alta citta`
72. `ux-audit, extreme multi-user, friday night rush: takeout queue floods while all dine-in tables full, kitchen drowning, manager receiving delivery mid-service, owner watching branch comparison live, staff + kitchen + manager + owner, alta citta`
73. `ux-audit, extreme multi-user, closing shift: last 3 tables billing simultaneously, split bills, SC and PWD discounts, printer offline, Z-read generation, staff + manager + owner, alta citta`
74. `ux-audit, extreme multi-user, stock crisis: 3 items 86'd mid-service, delivery arrives wrong quantity, waste logged after spoilage, manager and kitchen scrambling, staff hitting sold-out blocks, kitchen + manager + owner, alta citta`
75. `ux-audit, extreme multi-user, new staff first shift: staff unfamiliar with POS opens wrong tables, voids wrong items, needs manager PIN 5 times, kitchen confused by incomplete orders, manager babysitting, staff + kitchen + manager, alta citta`
76. `ux-audit, extreme multi-user, warehouse day: no POS or kitchen access, owner and admin doing full inventory count, deliveries from 2 suppliers, stock transfers to both branches, manager + owner + admin, wh-tag`
77. `ux-audit, extreme multi-user, owner multi-branch review: owner switches between alta citta and alona beach comparing live sales, meat usage, voids, and expenses, while both branch managers run X-reads simultaneously, manager + owner, all`
78. `ux-audit, extreme multi-user, kitchen station pressure: 12 tickets active simultaneously, refill tsunami, 2 items refused, meat weighed mid-ticket, yield calculator used, KDS bump speed and glanceability under fire, kitchen only extreme, alta citta`
79. `ux-audit, extreme multi-user, payday weekend: full house with large groups, half the tables paying GCash or Maya, one table doing 4-way split bill, leftover penalties on 2 tables, EOD expenses logged after service, staff + manager + owner, alta citta`
80. `ux-audit, extreme multi-user, admin setup day: admin builds floor plan in editor, adds new menu items, creates 3 new staff users, reviews audit logs, manager tests new layout on POS, admin + manager, alta citta`
81. `ux-audit, extreme multi-user, mid-month expense audit: manager logs 8 different expense types, owner reviews expense report vs gross profit, discrepancy found, manager corrects with delete and re-entry, both checking BIR compliance, manager + owner, alta citta`
82. `ux-audit, extreme multi-user, double branch service night: alta citta and alona beach both at full capacity simultaneously, owner monitoring both, each branch manager running independently, 2x staff + 2x kitchen + 2x manager + owner, all`
83. `ux-audit, extreme multi-user, training day: admin creates new staff account live, manager walks staff through first order on POS while kitchen watches for the first ticket, all 4 roles observe the handoff chain, admin + staff + kitchen + manager, alta citta`
84. `ux-audit, extreme multi-user, month-end close: owner runs Z-Read, exports all reports, reviews gross and net profit, compares both branches, manager submits final expense log, admin archives audit logs, manager + owner + admin, all`
85. `ux-audit, extreme multi-user, BIR audit prep: manager generates X-Read history for the week, owner reviews voids and discounts report, admin checks audit log for all deleted expenses and manager PIN events, manager + owner + admin, alta citta`

---

## Multi-User — Chaos

86. `ux-audit, chaos multi-user, full service cycle: wave 1 all 8 tables open with full orders every table, mid-service chaos (voids, refills, 86, package changes, transfers, printer offline), wave 2 full house again, then end of day, staff + kitchen + manager + owner, alta citta`
87. `ux-audit, chaos multi-user, everything breaks at once: printer offline, 2 items 86'd, 1 full order void, pax change on 2 tables, split bill on 1, kitchen refusing items, takeout queue backing up, manager handling 6 PIN requests, staff + kitchen + manager, alta citta`
88. `ux-audit, chaos multi-user, peak hour meltdown: all 8 tables open within 3 minutes, kitchen has 40 items in queue, refill tsunami hits at 30 minutes, 3 tables request bills simultaneously, printer jams, GCash goes down, staff + kitchen + manager + owner, alta citta`
89. `ux-audit, chaos multi-user, cross-branch crisis: stock transfer from warehouse fails, alta citta runs out of 3 items, alona beach over-orders, owner scrambles between branches, managers at each branch improvising, kitchen at both branches 86ing simultaneously, all roles, all`
90. `ux-audit, chaos multi-user, night from hell: new staff on their first solo shift, kitchen lead sick so junior handles KDS, manager away from floor receiving a surprise delivery, owner remoting in to check reports, nothing goes right, staff + kitchen + manager + owner, alta citta`
91. `ux-audit, chaos multi-user, expense chaos: manager tries to log expenses while handling 4 floor issues, deletes wrong entry twice, owner sees incorrect totals in report, admin is checking audit logs for the deletions, all three simultaneously trying to reconcile, manager + owner + admin, alta citta`
92. `ux-audit, chaos multi-user, handoff chain stress test: staff fires 8 orders in 90 seconds, kitchen has to process all handoffs simultaneously, manager watches for any missed tickets, owner checks if sales numbers update in real time, full cross-role data flow under maximum load, staff + kitchen + manager + owner, alta citta`
93. `ux-audit, chaos multi-user, end of month chaos: Z-Read generation mid-service by mistake, staff panics, manager tries to recover, owner sees incorrect EOD data, admin checks if the audit log captured the premature Z-Read, staff + manager + owner + admin, alta citta`
94. `ux-audit, chaos multi-user, delivery and service collision: 2 suppliers arrive simultaneously during peak service, manager splits attention between delivery forms and floor issues, kitchen is weighing deliveries while processing 10 KDS tickets, staff is managing full floor alone, kitchen + manager + staff, alta citta`
95. `ux-audit, chaos multi-user, stock count under fire: manager attempts full PM10 count while tables are still open and ordering, kitchen is 86ing items the manager just counted, owner reviews variance report with inaccurate mid-service data, kitchen + manager + owner, alta citta`
96. `ux-audit, chaos multi-user, all discounts at once: 3 tables with SC discount, 2 with PWD, 1 with promo comp, 1 with leftover penalty, all checking out in the same 10-minute window, manager approving all PINs, kitchen clearing queue simultaneously, staff + manager + kitchen, alta citta`
97. `ux-audit, chaos multi-user, device chaos: manager's tablet dies mid-shift, they switch to a shared device and must re-authenticate, meanwhile staff is mid-checkout on another device, kitchen tablet screen goes dim, all roles scrambling on degraded hardware, staff + kitchen + manager, alta citta`
98. `ux-audit, chaos multi-user, full chaos audit specifically for new fixes: test all 56 issues fixed in the last sprint under real service pressure — touch targets, void signals, sidebar badges, draft persistence, expense audit log, printer fallback, kitchen 86, X-Read branch lock, all roles, alta citta`
99. `ux-audit, chaos multi-user, alona beach full night: all scenarios run against alona beach branch instead of alta citta, verify branch isolation, no alta citta data bleeds through, stock, reports, and orders all scoped correctly to pgl, staff + kitchen + manager + owner, alona beach`
100. `ux-audit, chaos multi-user, the ultimate gauntlet: full restaurant cycle across both branches simultaneously — wave 1, mid-service chaos, wave 2, stock crisis, delivery collision, expense reconciliation, X-Read and Z-Read at both branches, owner reviewing all data live — maximum everything, all roles, all branches`

---

## Quick Reference — Intensity Guide

| Intensity | Tables | Roles | Scenarios | Agents | Est. Time |
|---|---|---|---|---|---|
| Light | 1–2 | 1–2 | 1–3 | 1–2 | 5–10 min |
| Heavy | 3–5 | 2–3 | 4–8 | 2–4 | 10–20 min |
| Extreme | 6–8 | 3–4 | 9–15 | 4–6 | 20–35 min |
| Chaos | 8+ | All 4 | 15–22 | 6–8 | 35–60 min |

## Quick Reference — Role Focus

| Role | Best audited with | Key pages |
|---|---|---|
| Staff | Any multi-user, min kitchen partner | `/pos`, AddItemModal, CheckoutModal |
| Kitchen | Any multi-user, min staff partner | `/kitchen/orders`, `/kitchen/weigh-station` |
| Manager | Heavy+, needs stock + reports access | `/stock/*`, `/reports/x-read`, `/pos` |
| Owner | Extreme+, needs full data from service | `/reports/*`, branch-comparison, EOD |
| Admin | Single-user or setup-day multi | `/admin/*`, floor-editor |
