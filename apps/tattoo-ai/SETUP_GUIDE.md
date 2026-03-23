# Tattoo AI — Setup Guide

Step-by-step instructions to get tattoo-ai running locally and deployed to Vercel.

## Prerequisites

- Node.js 18+ with npm
- Neon PostgreSQL account (free tier works)
- Facebook Developer account (for Messenger API)
- Google Cloud account (for Calendar API)
- Groq API key (free at console.groq.com)
- Cloudflare account (for R2 storage)
- Inngest account (for async functions)

## Local Development Setup

### 1. Clone & Install

```bash
cd /path/to/midcodes/apps/tattoo-ai
npm install
```

### 2. Create Neon Database

1. Go to [neon.tech](https://neon.tech)
2. Create a new project → Copy connection string
3. Create `.env` file:

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname
BETTER_AUTH_SECRET=your-random-secret-here
BETTER_AUTH_URL=http://localhost:5176
```

### 3. Push Database Schema

```bash
npm run db:push
```

This creates:
- `users` table (fb_id PK)
- `inquiries` table (with status enum)
- `chat_history` table

### 4. Set Up Facebook Messenger

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create/select app → Go to Messenger product
3. Generate **Page Access Token** → Add to `.env`:

```env
FB_PAGE_ACCESS_TOKEN=your-token-here
FB_VERIFY_TOKEN=your-verify-token-here
FB_APP_SECRET=your-app-secret-here
```

4. Set Webhook:
   - URL: `http://localhost:5176/api/webhooks/messenger`
   - Verify Token: (your FB_VERIFY_TOKEN)
   - Subscribe to: `messages`

### 5. Set Up Google Calendar API

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → Enable Calendar API
3. Create Service Account:
   - Service Account > Actions > Create Key (JSON)
   - Download JSON file
4. Share a calendar with the service account email
5. Add to `.env`:

```env
GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 6. Set Up Groq

1. Go to [console.groq.com](https://console.groq.com)
2. Create API key
3. Add to `.env`:

```env
GROQ_API_KEY=your-groq-key-here
```

### 7. Set Up Cloudflare R2

1. Go to Cloudflare dashboard → R2 → Create bucket
2. Create API token (for S3 access)
3. Add to `.env`:

```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=tattoo-ai-uploads
```

### 8. Set Up Inngest

1. Go to [app.inngest.com](https://app.inngest.com)
2. Create project → Get Event Key & Signing Key
3. Add to `.env`:

```env
INNGEST_EVENT_KEY=your-event-key-here
INNGEST_SIGNING_KEY=your-signing-key-here
```

### 9. Run Locally

```bash
npm run dev
```

Open http://localhost:5176

### 10. Test Webhook

Send a test message to your Facebook Page's Messenger → Should appear in chat history table.

## Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial tattoo-ai scaffold"
git push origin main
```

### 2. Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Select framework: **SvelteKit**
4. Build command: `npm run build` (auto-detected)

### 3. Add Environment Variables

In Vercel project settings, add all vars from `.env`:

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://your-vercel-domain.vercel.app
GROQ_API_KEY=...
FB_PAGE_ACCESS_TOKEN=...
FB_VERIFY_TOKEN=...
FB_APP_SECRET=...
GOOGLE_CALENDAR_ID=...
GOOGLE_SERVICE_ACCOUNT_KEY=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

### 4. Update Facebook Webhook

After deployment:

1. Update Webhook URL in Facebook App:
   - `https://your-vercel-domain.vercel.app/api/webhooks/messenger`
   - Keep same Verify Token

2. Update BETTER_AUTH_URL in Vercel to production URL

### 5. Deploy

```bash
git push origin main
```

Vercel auto-deploys.

## Verifying Deployment

1. Visit your deployed app: `https://your-app.vercel.app`
2. Should redirect to login page
3. Send test message to Facebook Page → Should process

## Common Issues

### "DATABASE_URL not found"
- Make sure `.env` file exists locally
- For Vercel, check project settings > Environment Variables

### "Facebook webhook not responding"
- Ensure `200 OK` is returned within 50ms
- Check webhook URL is correct in Facebook App settings
- Verify FB_VERIFY_TOKEN matches

### "Google Calendar integration failing"
- Verify service account is shared with calendar
- Check GOOGLE_CALENDAR_ID format (ends with @gmail.com)
- Ensure JSON in GOOGLE_SERVICE_ACCOUNT_KEY is valid

### "Images not uploading to R2"
- Verify R2 credentials are correct
- Ensure bucket exists and is accessible
- Check R2_BUCKET_NAME matches actual bucket name

### "Groq API errors"
- Verify GROQ_API_KEY is valid
- Check rate limits (Groq free tier has limits)

## Development Commands

```bash
# Start dev server
npm run dev

# Run type checks
npm run check

# Format code
npm run format

# Lint
npm run lint

# Generate DB migrations
npm run db:generate

# Push migrations to DB
npm run db:push

# Open Drizzle Studio (interactive DB editor)
npm run db:studio

# Build for production
npm run build

# Preview production build
npm run preview
```

## Database Editing (Drizzle Studio)

```bash
npm run db:studio
```

Opens web UI to browse/edit database directly.

## File Organization

```
src/
├── lib/
│   ├── server/     # Backend only (DB, AI, APIs)
│   └── types.ts    # Shared types
└── routes/
    ├── (admin)/    # Protected admin pages
    ├── (auth)/     # Public auth pages
    └── api/        # Webhooks + API routes
```

## Key API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/webhooks/messenger` | GET | FB webhook verification |
| `/api/webhooks/messenger` | POST | FB message ingestion |
| `/api/inngest` | POST | Inngest function serve |

## Admin Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/admin/dashboard` | Kanban board of inquiries |
| Inquiry Detail | `/admin/inquiries/[id]` | View & approve/reject |
| Calendar | `/admin/calendar` | Booked sessions |
| Clients | `/admin/clients` | Client list & search |
| Settings | `/admin/settings` | Config & integrations |

## Next: Development

Start implementing these features:

1. **Better Auth** — magic link auth
2. **Inquiry form** — client can submit via Messenger or web
3. **Email notifications** — send confirmations
4. **Photo gallery** — display tattoo portfolio
5. **Analytics** — track conversion funnel

See `README.md` for architecture details.

---

**Questions?** Check the scaffold comments in each file or the main `README.md`.
