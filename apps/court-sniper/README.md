# Court Sniper

A pickleball court finder and auto-booking app using modern full-stack architecture.

## Stack

- **Frontend**: SvelteKit 5, Svelte 5 runes, shadcn-svelte, TailwindCSS
- **Local DB**: RxDB v16 + Dexie (IndexedDB)
- **Server DB**: Neon PostgreSQL + Drizzle ORM
- **Auth**: Better-auth
- **Maps**: Mapbox GL JS
- **Payments**: PayMongo
- **Mobile**: Capacitor, FCM
- **Forms**: sveltekit-superforms, Zod
- **Deploy**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon)
- Mapbox API token
- PayMongo API keys

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret (min 32 chars)
- `VITE_MAPBOX_TOKEN` - Mapbox public token
- `PAYMONGO_SECRET_KEY` - PayMongo secret key

### Database Setup

```bash
npm run db:generate  # Generate Drizzle migrations
npm run db:push     # Apply migrations to database
npm run db:studio   # Open Drizzle Studio UI
```

### Development

```bash
npm run dev
```

App will start at `http://localhost:5175`

### Build

```bash
npm run build
npm run preview
```

## Architecture

### Frontend Structure

```
src/
├── routes/              # SvelteKit pages and layouts
│   ├── (auth)/         # Public auth routes
│   ├── (player)/       # Player dashboard
│   ├── (venue)/        # Venue manager dashboard
│   ├── (admin)/        # Admin panel
│   └── api/            # Server endpoints
├── lib/
│   ├── rxdb/           # RxDB setup and collections
│   ├── server/         # Server-only utilities
│   │   ├── db.ts       # Drizzle ORM setup
│   │   └── schema.ts   # Database schema
│   ├── stores/         # Svelte stores (auth, map, bookings, snipes)
│   └── types.ts        # TypeScript types
└── app.html            # Root HTML

```

### Database Schema

**Core Tables:**
- `users` - Player, venue manager, and admin accounts
- `venues` - Pickleball court venues
- `courts` - Individual courts within venues
- `slots` - Available booking time slots
- `bookings` - Completed or pending bookings

**Sniper System:**
- `snipes` - Auto-booking rules set by players
- `snipes` matching engine runs on cron to auto-book available slots

**Payments:**
- `payments` - Transaction records
- `payouts` - Venue payouts processed monthly

**Social:**
- `reviews` - Player ratings and feedback

## Key Features

### Player Features
- Browse venues on interactive map
- Set snipes (auto-booking rules) with criteria:
  - Max price, distance, court type
  - Preferred times and days
  - Auto-pay option
- View booking history
- Leave reviews and ratings

### Venue Manager Features
- Dashboard with revenue and booking stats
- Availability calendar management
- Booking history and status tracking
- Analytics (retention, cancellation rate, peak hours)
- Revenue tracking and payout management

### Admin Features
- Platform-wide statistics
- User and venue management
- Payout processing
- Reports and analytics

## APIs

### Auth Endpoints
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

### Venues & Slots
- `GET /api/venues` - List venues with filters
- `GET /api/venues/:id` - Venue details
- `GET /api/courts` - List courts
- `GET /api/slots` - List available slots with date/venue filters

### Bookings
- `GET /api/bookings` - Player's bookings
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Snipes
- `GET /api/snipes` - Player's snipes
- `POST /api/snipes` - Create snipe
- `PATCH /api/snipes/:id` - Update snipe
- `DELETE /api/snipes/:id` - Delete snipe

### Sync & Webhooks
- `POST /api/sync` - RxDB replication endpoint
- `POST /api/webhooks/paymongo` - PayMongo payment webhook
- `POST /api/cron/sniper` - Sniper matching cron job

## Development Notes

### RxDB Sync
Client RxDB collections sync with server via `/api/sync`. Offline-first design means users can browse, filter, and manage bookings even without connectivity.

### Sniper Engine
Runs on a scheduled cron endpoint that:
1. Finds active snipes expiring soon
2. Queries available slots matching criteria
3. Creates bookings and processes payments
4. Sends notifications

### Payments
PayMongo integration handles:
- Card, GCash, and bank transfer payments
- Automatic refunds and chargebacks
- Commission calculation and payout splitting

## Testing

```bash
npm run test
```

## Deployment

The app is configured for Vercel with the `@sveltejs/adapter-vercel` adapter.

Deploy to Vercel:
```bash
vercel
```

Environment variables must be set in Vercel project settings.

## License

Proprietary - MidCodes
