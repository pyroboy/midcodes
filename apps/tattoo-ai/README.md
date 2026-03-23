# Tattoo AI

Tattoo AI Booking Agent & CRM — A server-side SvelteKit 5 application powered by Groq AI, Neon PostgreSQL, and Inngest for handling tattoo inquiries via Facebook Messenger.

## Architecture

- **Frontend**: SvelteKit 5 + Svelte 5 runes + shadcn-svelte + TailwindCSS
- **Backend**: SvelteKit 5 (server-side) + Neon PostgreSQL + Drizzle ORM
- **AI**: Groq (Llama 3.3 70B) via Vercel AI SDK
- **Async Tasks**: Inngest (serverless functions)
- **Auth**: better-auth (magic link)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Integrations**:
  - Facebook Messenger API (webhooks + send)
  - Google Calendar API (event scheduling)
- **Forms**: sveltekit-superforms + Zod
- **Deployment**: Vercel

## Project Structure

```
tattoo-ai/
├── src/
│   ├── app.html              # HTML shell
│   ├── app.postcss           # TailwindCSS entry
│   ├── lib/
│   │   ├── server/
│   │   │   ├── ai.ts         # Groq + Vercel AI SDK setup
│   │   │   ├── calendar.ts   # Google Calendar API client
│   │   │   ├── db.ts         # Neon + Drizzle connection
│   │   │   ├── inngest.ts    # Inngest functions & client
│   │   │   ├── messenger.ts  # Facebook Messenger helpers
│   │   │   ├── r2.ts         # Cloudflare R2 upload
│   │   │   └── schema.ts     # Drizzle ORM schema
│   │   └── types.ts          # TypeScript types
│   └── routes/
│       ├── +layout.svelte    # Root layout
│       ├── +page.svelte      # Redirect to admin
│       ├── (auth)/
│       │   └── login/        # Magic link login
│       ├── (admin)/
│       │   ├── +layout.svelte    # Admin sidebar
│       │   ├── dashboard/        # Kanban board
│       │   ├── calendar/         # Calendar view
│       │   ├── clients/          # Client list
│       │   ├── settings/         # Settings page
│       │   └── inquiries/[id]/   # Inquiry detail
│       └── api/
│           ├── webhooks/messenger/  # FB Messenger webhook
│           └── inngest/             # Inngest serve endpoint
├── drizzle/                  # Generated migrations
├── .env.example              # Environment variables template
├── drizzle.config.ts         # Drizzle Kit config
├── package.json
├── svelte.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Database Schema

### users
- `fb_id` (text, PK) — Facebook user ID
- `name` (varchar) — Client name
- `phone_number` (varchar, optional) — Phone for contact
- `created_at` (timestamp) — Account creation date

### inquiries
- `id` (uuid, PK) — Unique inquiry ID
- `fb_id` (text, FK) — Associated user
- `status` (enum: pending/approved/rejected/completed/cancelled)
- `concept` (text) — Tattoo design concept
- `placement` (varchar) — Body placement
- `size` (varchar) — Desired size
- `reference_image_url` (text, optional) — URL to R2 image
- `quoted_price` (numeric, optional) — Artist's quote
- `scheduled_at` (timestamp, optional) — Booking date/time
- `gcal_event_id` (varchar, optional) — Google Calendar event ID
- `created_at` (timestamp)

### chat_history
- `id` (uuid, PK)
- `fb_id` (text, FK)
- `role` (enum: user/assistant)
- `content` (text) — Message text
- `timestamp` (timestamp)

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host/dbname
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:5176
GROQ_API_KEY=your-groq-key
FB_PAGE_ACCESS_TOKEN=your-fb-token
FB_VERIFY_TOKEN=your-verify-token
FB_APP_SECRET=your-app-secret
GOOGLE_CALENDAR_ID=your-calendar@gmail.com
GOOGLE_SERVICE_ACCOUNT_KEY={}
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=tattoo-ai-uploads
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
```

## Development

```bash
# Install dependencies
npm install

# Generate types from schema
npm run db:generate

# Push schema to database
npm run db:push

# Run dev server
npm run dev

# Open Drizzle Studio
npm run db:studio
```

## Key Features

### Admin Dashboard
- **Kanban Board**: Inquiries organized by status (Pending, Approved, Completed, Cancelled)
- **Inquiry Detail Page**: Full inquiry view with client info, tattoo specs, price quote, scheduling
- **Calendar View**: Visualize booked sessions via Google Calendar
- **Client List**: Manage clients and their inquiry history
- **Settings**: Notifications, integrations, privacy

### Messenger Integration
- Receives inquiries via Facebook Messenger webhook
- AI agent (Groq Llama 3.3 70B) engages clients conversationally
- Saves messages to chat history
- Inngest ensures reliable async processing

### Smart Scheduling
- Admin sets price and date/time when approving
- Automatically creates Google Calendar event
- Sends confirmation to client via Messenger

### Image Handling
- Client can send reference photos via Messenger
- Automatically uploaded to Cloudflare R2
- Persisted in inquiry record

## Deployment

Deploy to Vercel:

```bash
vercel
```

Ensure environment variables are set in Vercel project settings.

## Tech Stack Rationale

| Tech | Why |
|------|-----|
| **Neon** | Serverless PostgreSQL — no cold starts, per-request pricing |
| **Drizzle** | Type-safe ORM with migrations, lightweight |
| **Groq** | Fast inference for chat, 70B model for quality |
| **Inngest** | Reliable async tasks, webhook retry, durable execution |
| **better-auth** | Magic link auth — no passwords, easy user onboarding |
| **SvelteKit 5** | Server-side rendering, API routes, file-based routing |
| **Cloudflare R2** | S3-compatible object storage, cheap egress |
| **TailwindCSS + shadcn** | Fast UI development, accessible components |

## API Endpoints

### Webhooks
- `GET /api/webhooks/messenger` — FB webhook verification
- `POST /api/webhooks/messenger` — FB message ingestion

### Inngest
- `POST /api/inngest` — Inngest function serve endpoint

## License

MIT
