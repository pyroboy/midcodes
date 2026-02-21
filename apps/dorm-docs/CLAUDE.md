# D.A. Tirol Dormitory Documentation App

A SvelteKit 5 documentation and knowledge base application for D.A. Tirol Dormitory operations, business planning, and data reporting.

## Tech Stack

- **Framework**: SvelteKit 2.16+ with Svelte 5
- **Language**: TypeScript 5
- **Build Tool**: Vite 6
- **Adapter**: `@sveltejs/adapter-auto`

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Type checking
pnpm check

# Build
pnpm build
```

## Project Structure

```
src/
├── app.html              # HTML template
├── app.d.ts              # TypeScript declarations
├── lib/
│   ├── data/             # JSON data files
│   │   ├── contracts.json
│   │   ├── electricity.json
│   │   ├── monthly.json
│   │   ├── population.json
│   │   ├── projects.json
│   │   ├── property.json    # Property/room configurations
│   │   ├── rents.json
│   │   ├── revenue.json
│   │   └── water.json
│   └── types/            # TypeScript type definitions
└── routes/
    ├── +layout.svelte    # Root layout
    ├── +page.svelte      # Dashboard/home page
    ├── docs/
    │   ├── business-plan/  # 18 chapter business plan
    │   │   ├── +layout.svelte
    │   │   ├── chapters.ts
    │   │   ├── 01-executive-summary/
    │   │   ├── 02-company-profile/
    │   │   ├── 03-property-overview/
    │   │   ├── 04-market-analysis/
    │   │   ├── 05-services-amenities/
    │   │   ├── 06-operations/
    │   │   ├── 07-organization/
    │   │   ├── 08-financials/
    │   │   ├── 09-marketing/
    │   │   ├── 10-risk-management/
    │   │   ├── 11-growth-strategy/
    │   │   ├── 12-appendices/
    │   │   ├── 13-printable-logs/
    │   │   ├── 14-inventory-assets/
    │   │   ├── 15-daily-checklists/
    │   │   ├── 16-contingency-emergency/
    │   │   ├── 17-complaint-handling/
    │   │   └── 18-app-specification/
    │   └── reports/        # Data report pages
    │       ├── +layout.svelte
    │       ├── contracts/
    │       ├── electricity/
    │       ├── monthly/
    │       ├── population/
    │       ├── projects/
    │       ├── rents/
    │       ├── revenue/
    │       └── water/
    ├── llms.txt/           # AI context endpoint
    └── print-all/          # Print-friendly view
```

## Key Conventions

### Page Structure
- Each business plan chapter is in its own folder with a `+page.svelte`
- Report pages consume data from `$lib/data/*.json`
- Layouts handle navigation and shared styling

### CSS Variables
The app uses CSS custom properties defined in the root layout:
- `--color-primary` - Primary blue theme color
- `--color-accent` - Accent/success color  
- `--color-black` - Dark text color
- `--font-header` - Header font family

### Data Files
- Located in `src/lib/data/`
- Import using `$lib/data/filename.json`
- `property.json` contains room configurations, capacities, and amenities

## Business Context

**Property**: D.A. Tirol Dormitory  
**Location**: 0187 Maria Clara Street, Cogon, Tagbilaran City, Bohol  
**Managers**: Arturo Jose Tirol Magno & Raclaire Stephan Trigo Magno

### Property Layout
- **2nd Floor**: 3 rooms (air-conditioned)
- **3rd Floor**: 7 rooms (non-AC, includes communal kitchen/dining)
- **Total Capacity**: ~47 bedspaces

### Key Operational Details
- Standard bedspace rate: ₱2,000/month
- Minimum lease: 6 months
- Security deposit: 1 month + 1 month advance
- Curfew: 10:00 PM
