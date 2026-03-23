# BakeOps — Product Requirements Document (PRD)

## App Overview
- **Name:** BakeOps
- **Description:** A shared baking business backend that manages ingredient inventory, recipe costing, batch production planning, and auto-pricing for two family baking businesses — BakingMama (mother's store) and SweetyTreats (wife's business). One database, two branded storefronts.
- **Tagline:** One kitchen brain, two baking brands.
- **Value Proposition:** Eliminates guesswork in pricing and inventory. Both businesses share bulk ingredient purchases but see their own recipes, costs, and margins. Every cookie, cake, and pastry is priced based on real ingredient costs — not gut feeling.
- **Client:** ArjoTech (internal family product)

---

## Market Context

The Philippine home baking scene exploded post-pandemic and hasn't slowed down. Most bakers price by "feel" or copy competitors — they don't actually know their per-unit cost. Western tools like Craftybase ($49/mo) and Katana ERP are overkill and priced for US businesses. Free tools like BakeProfit and CakeCost handle recipe costing but have zero inventory tracking, no batch planning, and no multi-business support.

### Competitor Snapshot
| Competitor | Strengths | Weaknesses | Pricing |
|-----------|-----------|------------|---------|
| BakeProfit | Free, clean UI, recipe scaling | No inventory, no multi-business, calculator only | Free |
| CakeCost | Per-cake costing, decorator-focused | No inventory, no batch planning, single-user | Free |
| Craftybase | Full manufacturing ERP, batch tracking | Expensive, complex, US-centric pricing | $49/mo |
| Recipe Cost Calculator | Scaling, nutrition data | No inventory, no PH ingredient database | $19/mo |

**BakeOps differentiator:** Built specifically for Philippine home bakers running 1-2 brands from one kitchen, with PHP ingredient pricing, shared inventory, and automatic cost-to-price calculation.

---

## Core Features

### 1. Ingredient Inventory Management

#### 1.1 Master Ingredient Database
- Admin creates ingredients with: name, category (dairy/dry/sugar/chocolate/produce/misc), default unit (g/ml/pcs), package size, package cost in PHP, supplier name (optional), reorder threshold
- The existing `ingredients.ts` data from sweetytreats seeds the initial database (butter, flour, sugar, chocolate, ube halaya, matcha, etc. — all with real Manila pricing)
- Each ingredient tracks: current stock quantity, last purchase date, last purchase price, average cost (weighted moving average across purchases)
- **Price update flow:** Admin buys 1kg flour for ₱60 → enters purchase → system updates stock quantity AND recalculates average cost per gram → all recipe costs auto-update

#### 1.2 Stock Tracking
- **Stock In:** Record purchases — select ingredient, enter quantity purchased, total cost paid, purchase date, supplier. System calculates per-unit cost and updates weighted average.
- **Stock Out (automatic):** When a batch is produced (see Section 3), ingredients are auto-deducted from inventory based on the recipe's ingredient list × batch multiplier
- **Stock Out (manual):** For waste, spillage, personal use. Admin enters ingredient, quantity, reason.
- **Low Stock Alerts:** When any ingredient drops below its reorder threshold, it appears in a "Low Stock" panel on the dashboard. No push notifications needed — just a visible badge count.

#### 1.3 Stock History
- Full audit trail: every stock-in, stock-out, and adjustment with timestamp, quantity, unit cost, and who did it
- Monthly summary view: total spent on ingredients, top 5 most expensive ingredients, cost trend chart

### 2. Recipe Management & Costing

#### 2.1 Recipe Builder
- Create a recipe with: name, description, category (cookies/cakes/pastries/bread/drinks), yield amount, yield unit (e.g. "12 cookies" or "1 whole cake"), prep time, bake time, instructions, tips
- Add ingredients from the master database: select ingredient → enter amount in grams/ml/pcs → system shows real-time cost for that ingredient line
- **Business assignment:** Each recipe belongs to one or both businesses (BakingMama, SweetyTreats, or Shared). Shared recipes appear in both storefronts.
- Import existing recipes from the sweetytreats `recipes.ts` data (Classic Choco Chip, Ube White Chocolate, etc.)

#### 2.2 Auto-Costing Engine
- **Ingredient cost per recipe:** For each ingredient in a recipe, calculate: `(amount_used / package_size) × average_cost_per_package`
  - Example: Recipe uses 225g butter. Butter average cost is ₱180 per 225g package → ingredient cost = ₱180.00
  - Example: Recipe uses 320g flour. Flour average cost is ₱60 per 1000g → ingredient cost = (320/1000) × ₱60 = ₱19.20
- **Total recipe cost:** Sum of all ingredient costs
- **Per-unit cost:** Total recipe cost ÷ yield. If recipe makes 12 cookies and total cost is ₱385, per-cookie cost = ₱32.08
- **Suggested retail price:** Per-unit cost × markup multiplier. Default multipliers configurable per business:
  - BakingMama default: 2.5× (e.g. ₱32.08 cost → ₱80 retail)
  - SweetyTreats default: 3.0× (premium positioning, e.g. ₱32.08 → ₱96 retail → round to ₱99)
- **Margin display:** Shows gross margin percentage. At 2.5× markup, margin = 60%. At 3.0×, margin = 66.7%.
- Costs update automatically whenever ingredient prices change (new purchase recorded)

#### 2.3 Recipe Comparison View
- Side-by-side view of 2-3 recipes showing: total cost, per-unit cost, margin at current pricing, ingredient overlap
- Helps decide which products are most profitable to push

### 3. Batch Production Planning

#### 3.1 Batch Calculator
- User selects a recipe → enters desired output quantity (e.g. "I want to make 48 cookies" when recipe yields 12)
- System calculates batch multiplier (48 ÷ 12 = 4×) and shows:
  - Scaled ingredient list: each ingredient × 4 with exact amounts
  - **Availability check:** Green checkmark if enough stock, red warning if not enough (shows deficit)
  - Total batch cost: recipe cost × 4
  - Per-unit cost at this batch size (should be same as single batch)
- Quick batch buttons: 1×, 2×, 3×, 5×, 10× multiplier shortcuts

#### 3.2 Batch Production Log
- User clicks "Start Batch" → batch record created with status "In Progress"
- Ingredients are reserved (not yet deducted) from inventory
- User clicks "Complete Batch" → ingredients officially deducted from stock, batch marked as "Completed" with timestamp
- User can click "Cancel Batch" → reserved ingredients released back
- Batch log shows: date, recipe, multiplier, total yield, total cost, status
- **Partial completion:** If oven burns half the batch, user can adjust actual yield down. Per-unit cost recalculates (same total cost ÷ fewer units = higher per-unit cost)

#### 3.3 Production Schedule (v1 simple)
- Calendar view showing planned batches for the week
- User adds planned batch: recipe + quantity + target date
- Dashboard shows "Today's Production" with ingredient totals needed across all planned batches
- System flags if combined planned batches would exceed current stock for any ingredient

### 4. Pricing & Business Configuration

#### 4.1 Multi-Business Setup
- Two businesses configured: BakingMama and SweetyTreats
- Each business has: name, logo, default markup multiplier, tagline, contact info, social media links
- Shared ingredient inventory (they buy from the same suppliers and store in the same kitchen)
- Separate recipe libraries (with option for "Shared" recipes)
- Separate pricing rules and retail prices

#### 4.2 Price List Generator
- Per business: generates a printable/downloadable price list (PDF or image) showing all active products with:
  - Product name, description, retail price, available sizes/quantities
- Price list auto-updates when costs change (if auto-pricing is enabled for that product)
- Manual price override: admin can lock a product's price (e.g. "always ₱100 regardless of cost changes") — system shows a warning if margin drops below a configurable threshold (default: 30%)

#### 4.3 Pricing Modes
- **Auto-price:** retail = per-unit cost × markup. Updates when ingredient costs change.
- **Fixed price:** manually set. System shows current margin and warns if it drops.
- **Round-up pricing:** auto-price but rounds up to nearest ₱5 or ₱10 (configurable). ₱96.24 → ₱100.

### 5. Dashboard & Analytics

#### 5.1 Main Dashboard
- **Today's snapshot:** planned batches, low stock alerts, total inventory value
- **Per-business cards:** BakingMama and SweetyTreats each showing: # active recipes, average margin, top 3 products by profitability
- **Quick actions:** New purchase, New batch, Add recipe

#### 5.2 Reports
- **Cost Trend:** Line chart of average ingredient cost over time (monthly). Spot price increases early.
- **Production Summary:** Monthly batches produced, total units, total cost, total expected revenue
- **Profitability Ranking:** All products ranked by gross margin percentage
- **Ingredient Usage:** Top ingredients by volume and by cost. Helps with bulk purchasing decisions.

---

## User Roles & Permissions

### Admin (Arjo)
- **Purpose:** System administrator and developer
- **Permissions:** Everything — manage businesses, ingredients, recipes, users, view all data
- **Primary Workflow:** System setup, bulk ingredient imports, architecture decisions

### Business Owner — BakingMama (Mother)
- **Purpose:** Manages her baking store's recipes, pricing, and production
- **Permissions:** Full CRUD on her own recipes, view shared recipes, record purchases, run batches, view reports for her business, update her business settings
- **Restrictions:** Cannot see SweetyTreats-only recipes or SweetyTreats-specific pricing/margins. Can see shared inventory.
- **Primary Workflow:** Morning → check dashboard for low stock → plan today's batches → batch calculator → produce → mark complete

### Business Owner — SweetyTreats (Wife)
- **Purpose:** Same as above but for her business
- **Permissions:** Mirror of BakingMama owner but scoped to SweetyTreats
- **Primary Workflow:** Same pattern, plus recipe experimentation (create new recipes, compare costs, set premium pricing)

### Viewer (optional, v2)
- **Purpose:** Staff or family who need to see recipes/prices but not edit
- **Permissions:** Read-only access to assigned business's recipes and price lists

---

## Technical Architecture

### Stack
- **Frontend (Admin/Backend App):** SvelteKit 5 + Tailwind v4 — the shared management interface at `bakeops.pages.dev` or custom domain
- **Frontend (BakingMama Storefront):** Separate SvelteKit app — public-facing product catalog and price list, pulls from BakeOps API
- **Frontend (SweetyTreats Storefront):** Separate SvelteKit app — same architecture, different branding. The existing `sweetytreats` app in the monorepo gets enhanced with live pricing data
- **Database:** Neon (PostgreSQL) via Drizzle ORM — single database, multi-tenant via `business_id` foreign keys
- **Auth:** Better Auth v1.5 — email+password, admin plugin for role management
- **Real-time:** Ably — push price/stock updates to connected storefront apps when admin changes pricing or stock levels change after a batch
- **Client Cache:** RxDB — session cache for recipes and ingredient lists on the admin app (fast UI during batch planning)
- **Hosting:** Cloudflare Pages (all three apps)
- **PDF Generation:** Server-side HTML-to-PDF for price lists (or client-side print-to-PDF)

### Key Technical Decisions
- **Single database, multi-tenant:** Both businesses share one Neon database. Recipes, prices, and batches have a `businessId` column. Ingredients and stock are global (shared kitchen). This is simpler than two databases and reflects reality.
- **API-first backend:** BakeOps admin app exposes a REST API (`/api/recipes`, `/api/ingredients`, `/api/prices`) that the storefronts consume. Storefronts are read-only consumers.
- **Offline consideration:** Not needed for v1. Both businesses have reliable internet. If needed later, RxDB is already in the stack for upgrading to offline-first.
- **Auto-costing is event-driven:** When a purchase is recorded (ingredient cost changes), a server-side function recalculates all affected recipe costs and updates prices in auto-price mode. Ably pushes updates to connected clients.

### Data Model (Key Entities)

**businesses**
- id, name, slug, logo_url, tagline, default_markup (decimal), contact_info (jsonb), social_links (jsonb), created_at

**ingredients**
- id, name, category (enum: dairy/dry/sugar/chocolate/produce/misc), default_unit (enum: g/ml/pcs), package_size (integer), current_avg_cost (decimal — weighted average cost per package), reorder_threshold (integer), current_stock (decimal), created_at

**purchases** (stock-in events)
- id, ingredient_id (FK), quantity (decimal), total_cost (decimal), unit_cost (computed: total_cost/quantity), supplier (text, nullable), purchased_at, recorded_by (FK user)

**stock_adjustments** (manual stock-out, waste)
- id, ingredient_id (FK), quantity (decimal, negative for removals), reason (text), adjusted_by (FK user), adjusted_at

**recipes**
- id, business_id (FK, nullable — null means shared), name, description, category (enum: cookies/cakes/pastries/bread/drinks/other), yield_amount (integer), yield_unit (text), prep_time (text), bake_time (text), instructions (text[]), tips (text[]), is_active (boolean), created_at

**recipe_ingredients**
- id, recipe_id (FK), ingredient_id (FK), amount (decimal), unit_override (text, nullable — override default unit if needed), notes (text, nullable)

**product_prices**
- id, recipe_id (FK), business_id (FK), pricing_mode (enum: auto/fixed/round_up), markup_multiplier (decimal, nullable — null uses business default), fixed_price (decimal, nullable), rounding_target (integer, nullable — 5 or 10), computed_cost (decimal — last calculated per-unit cost), computed_price (decimal — last calculated retail price), margin_percentage (decimal), min_margin_alert (decimal, default 0.30), is_active (boolean)

**batches**
- id, recipe_id (FK), business_id (FK), multiplier (decimal), planned_yield (integer), actual_yield (integer, nullable), status (enum: planned/in_progress/completed/cancelled), total_cost (decimal), scheduled_for (date, nullable), started_at (timestamp, nullable), completed_at (timestamp, nullable), produced_by (FK user)

**batch_ingredients** (snapshot of ingredients used at time of batch — for audit)
- id, batch_id (FK), ingredient_id (FK), quantity_used (decimal), unit_cost_at_time (decimal)

**users** (Better Auth managed)
- id, name, email, role (admin/owner/viewer), business_id (FK, nullable — admin sees all)

---

## Non-Functional Requirements

- **Performance:** Recipe cost calculation should complete in <200ms for any recipe. Batch scaling is pure math — should be instant client-side.
- **Security:** Business owners can only access their own business data (enforced server-side, not just UI). Ingredient/stock data is shared and visible to all authenticated users.
- **Data Integrity:** Stock levels must never go negative. If a batch would cause negative stock, block it with a clear error showing the deficit per ingredient.
- **Currency:** All monetary values in Philippine Pesos (₱). Store as integers (centavos) to avoid floating point issues. Display with 2 decimal places.

---

## Deployment & Operations

- **Environment:** Cloudflare Pages for all three apps. Neon serverless PostgreSQL.
- **Updates:** Git push → auto-deploy via Cloudflare Pages connected to GitHub.
- **Backup:** Neon handles automated database backups. Export functionality for recipes and price lists (CSV/JSON) for manual backup.
- **Monitoring:** Cloudflare analytics for traffic. Neon dashboard for database health. Ably dashboard for real-time message volume.

---

## Revenue Model

This is an internal family tool, not a SaaS product. No direct revenue.

**Indirect value:**
- Accurate pricing prevents undercharging (the #1 profit killer for home bakers)
- Inventory tracking reduces waste and over-purchasing
- If successful, the architecture could be white-labeled as a SaaS for other Philippine home bakers (v3+ consideration)

**Project cost:** Hosting ~₱0/month (Cloudflare free tier + Neon free tier handles this volume). Ably free tier covers the real-time needs.

---

## Project Scope

### In Scope (v1)
- Master ingredient database with PHP pricing (seeded from existing sweetytreats data)
- Purchase recording with weighted average cost calculation
- Stock tracking with low-stock alerts
- Recipe builder with auto-costing engine
- Batch calculator with availability checking
- Batch production log (start/complete/cancel) with auto stock deduction
- Multi-business support (BakingMama + SweetyTreats)
- Auto-pricing with configurable markups and rounding
- Dashboard with key metrics
- Price list generation (printable)
- Better Auth with admin/owner roles
- Cloudflare Pages deployment

### Out of Scope (not v1)
- **Order taking / POS:** This is a backend tool, not a customer-facing ordering system
- **Delivery tracking:** Out of scope
- **Customer management / CRM:** No customer database in v1
- **Accounting / BIR compliance:** Not handling tax calculations or receipts
- **Storefront e-commerce:** The BakingMama and SweetyTreats storefronts in v1 are read-only catalogs with price lists, not full e-commerce
- **Notifications / email:** No email alerts. Dashboard alerts only.
- **Mobile app:** Web-first, responsive design. No native app.

### Future Considerations (v2+)
- **Order management:** Accept orders through storefronts, track fulfillment
- **Customer database:** Repeat customers, order history, favorites
- **Supplier management:** Track multiple suppliers per ingredient, compare prices
- **Waste tracking analytics:** Predict waste rates per recipe and factor into costing
- **White-label SaaS:** Package BakeOps for other home bakers as a subscription service
- **Offline mode:** Full RxDB offline-first with sync for use in areas with spotty internet

---

## Success Metrics
- Both businesses have all active recipes costed within 1 week of launch
- Per-unit cost accuracy within ₱2 of manual calculation (validated by cross-checking 5 recipes)
- Mother and wife can independently run a batch (calculator → produce → complete) without help within 2 weeks
- Ingredient reorder alerts prevent at least 1 stockout per month
- Time to generate an updated price list drops from "manually recalculate everything" (~30 min) to under 30 seconds

---

## Risks & Mitigations
| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Users don't log purchases consistently | Costs become inaccurate | High | Make purchase entry dead-simple (3 fields max). Add a "Quick Buy" button on the ingredient card. |
| Ingredient prices fluctuate wildly | Auto-pricing causes confusing price changes | Medium | Add price change alerts. Allow "lock price" mode per product. Show margin warnings. |
| Two businesses cause data confusion | Wrong recipes appear for wrong business | Low | Enforce business_id scoping at the database query level, not just UI filtering. |
| Family politics (who spent more on ingredients) | Tension | Medium | Ingredient costs are shared — don't try to split them per business. Frame it as "household baking supplies." |
| Adoption resistance (mother prefers manual) | App goes unused | Medium | Start with just the batch calculator (most immediately useful). Add inventory tracking once the habit forms. |
