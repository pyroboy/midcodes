# Court Sniper — MVP Product Requirements Document

**Product:** Court Sniper — Pickleball Booking + Community for the Philippines
**Launch Regions:** Bohol, Cebu, Davao
**Timeline:** 2 weeks to MVP
**Revenue Model:** Booking commission (venue pays) + venue listing fees

---

## Core Identity

- **What:** Fastest way to book pickleball courts and find games in the Philippines
- **Who:** Individual picklers + barkada organizers
- **Why:** Replace the Facebook/Viber/GCash booking mess with one app
- **Killer Feature:** Speed + simplicity — faster booking + integrated chat

---

## User Roles

### Player
- Find and book courts
- Join open play sessions
- Find players / matchmaking
- Community chat
- Group/barkada booking

### Venue Owner
- List courts with schedules
- Manage availability (block times, add courts)
- View bookings calendar
- Revenue/earnings report
- Chat with booked players

---

## Week 1 — Core Features

### 1. Court Listing + Booking (Priority #1)
- **Listing:** Court name, venue, location, type (indoor/outdoor/covered), price/hr, available time slots
- **Booking flow:** Minimum info — name + time + pay → done
- **Confirmation:** Auto-confirm if pre-paid, manual confirm if pay-at-venue
- **Payment:** GCash only for MVP (via PayMongo)
- **Cancellation:** Venue decides their own policy
- **Schedules:** Static weekly templates provided by venue (real-time sync later)
- **Filters:** Location, time, skill level (Beginner/Intermediate/Advanced), court type, price range

### 2. Group/Barkada Booking (Priority #2)
- One person creates a booking
- Shares a link to their barkada
- Others join via the link + pay their share (GCash)
- OR: one person pays everything, splits later
- Auto-create a group chat for that session's players

### 3. Community Chat (Priority #3)
- **Login required** (email + password via Supabase Auth)
- **Channel types:**
  - Area-based: #bohol, #cebu, #davao
  - Skill-based: #beginners, #intermediate, #advanced
  - General: #general, #looking-for-game
  - Per-venue channels (auto-created when venue is onboarded)
- **Game request cards:** Special format in #looking-for-game with "Book together" button
- **Chat → Booking connection:**
  - "Looking for game" posts can auto-create group bookings
  - After booking, auto-create group chat for session players
  - "Book together" button on game request cards
- **Moderation:** Mix of admin tools + keyword filter (auto-moderation)

---

## Week 2 — Expand

### 4. Facebook Messenger Chatbot
- **Entry:** Player messages Court Sniper page on FB Messenger
- **Flow:**
  - "Hi" → Bot shows: [Find Court] [Join Chat] [My Bookings]
  - "Court Cebu" → Bot shows available courts in Cebu
  - "Book" → Where? → When? → How many? → Pay via GCash → Confirmed!
- **Proactive notifications:** "Your regular court is available!"
- **Tech:** Meta Messenger Platform API

### 5. Venue Owner Dashboard
- Calendar of all bookings
- Revenue/earnings report
- Manage court availability (block times, add/remove courts)
- Player reviews/ratings (Phase 2)
- Chat with booked players

### 6. Push Notifications
- Booking confirmed / cancelled / reminder (1hr before)
- "Your regular court is available" (smart alerts)
- "3 players looking for a game near you" (social)
- "New tournament in Cebu this weekend" (events)
- Push for critical (booking, reminders), in-app for social/events

### 7. Player Profiles
- Name, skill level (Beginner/Intermediate/Advanced)
- Preferred venues
- Play style (Competitive/Recreational)
- Booking history

### 8. Auto-Snipe
- Player sets criteria: venue, time, max price
- System monitors availability
- Auto-books when matching slot opens
- Notification: "We booked Court 3 at BGC for you — 6PM Tuesday"

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | SvelteKit 5 + Svelte 5 runes | Web app |
| Mobile | Capacitor | iOS + Android wrapper |
| Backend/DB | Supabase (PostgreSQL) | Auth, database, API |
| Realtime | Supabase Realtime | Chat, live updates |
| Auth | Supabase Auth | Email/password, social login |
| Payments | PayMongo | GCash integration |
| FB Chatbot | Meta Messenger Platform API | Facebook bot |
| Deploy | Cloudflare Pages | Edge hosting |
| Push | Supabase + FCM | Push notifications |
| Styling | TailwindCSS v3 | UI |

**Why Supabase:** Auth + DB + realtime chat + push notifications all-in-one. Fastest path to MVP with chat + booking. No need for separate services.

---

## Venue Onboarding Strategy

- **Phase 1:** Manual onboard — personally contact venues in Bohol/Cebu/Davao (mix of known contacts + cold outreach)
- **Phase 2:** Self-serve — venues sign up and manage own listings
- **Data collection:** Scrape/aggregate existing booking info where possible
- **Initial data:** Mock data for development, replace with real venue data before launch

---

## Booking Flow

### Player Books a Court
```
1. Browse courts (filter by location, time, level, price)
2. Tap court → see details + available slots
3. Select time slot
4. Enter: name + number of players
5. Pay via GCash (PayMongo) OR select "Pay at venue"
6. If pre-paid → auto-confirmed ✅
7. If pay-at-venue → venue manually confirms
8. Booking confirmation notification
9. Reminder notification 1hr before
```

### Barkada Group Booking
```
1. One person books (steps above)
2. Gets a shareable link
3. Shares to barkada via Messenger/Viber
4. Others open link → join + pay their share
5. Auto-create group chat for the session
6. Everyone gets confirmation + reminder
```

---

## Activity Types (Tabs in App)

1. **Courts** — Find and book courts (default)
2. **Open Play** — Join existing sessions (rec play, drills, mixers)
3. **Find Players** — Matchmaking by skill level + play style

Tournaments moved to secondary section (not a tab — horizontal strip).

---

## Skill Levels (replacing DUPR)

- **Beginner** — learning rules, basic strokes
- **Intermediate** — consistent play, understands positioning
- **Advanced** — competitive, tournament-level

No numeric rating. Simple 3-tier system. Players self-select.

---

## Success Metrics (Month 1)

| Metric | Target |
|--------|--------|
| Bookings | 50 |
| Active users | 100 |
| Venues onboarded | 10 |
| Chat messages | 500 |

---

## Branding

- **Name:** Court Sniper (keeping it)
- **Logo:** TBD (needs design)
- **Colors:** Current green primary (sports/energy feel)
- **Positioning:** "The fastest way to book and find pickleball games in the Philippines"
- **Domain:** TBD

---

## Phase 2 (Post-MVP)

- Real-time venue availability (API sync)
- Player ratings/reviews
- Coach marketplace
- Tournament bracket management
- Weather-aware notifications for outdoor courts
- Multi-language (Tagalog/Bisaya)
- Metro Manila expansion
- Paddle lending/rental tracking
- Split payment built into app (not external GCash)

---

*Generated from product interview — March 21, 2026*
*Built by MidCodes*
