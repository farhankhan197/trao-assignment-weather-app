# Mausam — Multi-User Weather Dashboard

**Live App**: [https://mausam-xyz.vercel.app](https://mausam-xyz.vercel.app) *(update after deployment)*
**API**: [https://mausam-api.up.railway.app](https://mausam-api.up.railway.app) *(update after deployment)*

A full-stack weather dashboard where users can track multiple cities, view live weather data, get AI-powered insights, and discover weather memory streaks.

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Frontend** | Next.js 15 (App Router) + TypeScript | Server components, file-based routing, excellent DX |
| **Styling** | Tailwind CSS + CSS Variables | Utility-first, consistent light theme system |
| **Animations** | Framer Motion | Declarative React animations (stagger, crossfade, layout) |
| **Charts** | Recharts | Lightweight, composable React charts |
| **Backend** | Express + TypeScript | Minimal, fast, familiar API patterns |
| **Database** | MongoDB Atlas + Mongoose | Flexible schema, easy horizontal scaling |
| **Auth** | JWT in httpOnly cookies | XSS-resistant, simple stateless sessions |
| **AI** | LangChain.js + Groq (llama-3.1-8b-instant) | Free tier, fast inference, tool-calling support |
| **Weather Data** | Open-Meteo API | Free, no API key required, generous rate limits |
| **Geocoding** | OpenWeatherMap Geocoding API | Free tier, accurate city search |
| **Deployment** | Vercel (frontend) + Railway (backend) | Zero-config Next.js on Vercel, simple Dockerless deploy on Railway |
| **Monorepo** | Turborepo | Shared types, coordinated builds, caching |

---

## Quick Start (Local)

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free M0 cluster)
- OpenWeatherMap API key (free tier)
- Groq API key (free tier)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/mausam.git
cd mausam
npm install
```

### 2. Environment Variables

**Backend** — create `apps/api/.env`:

```env
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mausam
JWT_SECRET=your-super-secret-key-min-32-chars
CLIENT_URL=http://localhost:3000
OWM_API_KEY=your_openweathermap_key
GROQ_API_KEY=your_groq_key
NODE_ENV=development
```

**Frontend** — create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Run Development

```bash
# From monorepo root — starts both apps
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000

---

## Architecture

```
Browser (Next.js App Router)
       │
       │ fetch/axios (withCredentials)
       ▼
Express API (apps/api)  ◄──── JWT middleware
       │                           │
       │                    MongoDB Atlas
       │                    (Users, Cities)
       │
       ├── Open-Meteo API (weather data, historical)
       ├── OWM Geocoding API (city search)
       └── LangChain Agent (Groq llama-3.1-8b-instant)
```

### Monorepo Structure

```
mausam/
├── apps/
│   ├── api/          # Express backend
│   │   ├── src/
│   │   │   ├── controllers/    # Auth, City, Weather, AI, Calendar
│   │   │   ├── middleware/     # JWT authenticate
│   │   │   ├── models/         # User, City
│   │   │   ├── routes/         # API routes
│   │   │   ├── agents/         # LangChain tools + weatherAgent
│   │   │   └── utils/          # weather.service.ts, streak.ts
│   │   └── .env.example
│   └── web/          # Next.js frontend
│       ├── app/                # Pages (dashboard, favorites, login, etc.)
│       ├── components/         # Reusable UI (Navbar, CityCard, CitySearch, AIChatSidebar)
│       ├── components/landing/ # Landing page sections
│       ├── components/weather/ # Weather atmosphere effects
│       ├── context/            # AuthContext, AIChatContext
│       ├── hooks/              # useRequireAuth
│       └── lib/                # api.ts (axios client)
├── turbo.json        # Pipeline config
└── package.json      # Workspace root
```

---

## Authentication & Authorization

### Approach

- **JWT tokens** stored in `httpOnly` cookies (XSS-resistant)
- `secure: true` in production, `sameSite: 'lax'`
- **Stateless**: no server-side session store needed
- Token expiry: 7 days

### Data Isolation

Every database query for user-scoped data includes `userId: req.user.id`:

```typescript
// City controller
const cities = await City.find({ userId: req.user!.id });
const city = await City.findOne({ _id: req.params.id, userId: req.user!.id });
```

Compound unique index prevents duplicate cities per user:

```typescript
CitySchema.index({ userId: 1, lat: 1, lon: 1 }, { unique: true });
```

### Authorization Flow

1. Client sends request with cookie (auto via `withCredentials: true`)
2. `authenticate` middleware verifies JWT signature
3. `req.user` populated with `{ id, email }`
4. Controllers enforce `userId` filter on all queries
5. 401 redirect handled by axios interceptor on frontend

---

## AI Agent Design

### Purpose

The AI agent acts as a **personal weather analyst** that can:
- Answer natural language questions about your saved cities
- Compare weather between cities
- Generate daily briefings for favorite cities
- Provide actionable recommendations (what to wear, umbrella alerts)

### Implementation

**LangChain.js + Groq** (`llama-3.1-8b-instant`) with 3 custom tools:

1. **`get_user_cities`** — returns all saved cities for the authenticated user
2. **`get_weather_for_city`** — fetches live weather for a specific city
3. **`compare_cities_weather`** — side-by-side weather comparison

### Conversation Flow

```
User: "Which of my cities is best for a run today?"
  → Agent calls get_user_cities
  → Agent calls get_weather_for_city for each city
  → Agent synthesizes: "London is 12°C and cloudy — ideal for running. Paris is 28°C and sunny — bring water."
```

### UI Integration

The AI lives in a **slide-in sidebar** (not a separate page) so users can chat without leaving their dashboard context.

---

## Bonus Feature: Calendar Weather Alerts

Connect your Google Calendar and the app will scan upcoming events with locations. If the weather forecast for an event day looks unusual (rain on a usually sunny day, sudden temperature drop, etc.), it creates an alert so you can plan accordingly.

**How it works:**
1. Connect Google Calendar in Settings (`/auth/calendar/connect` OAuth flow)
2. Daily cron job scans all connected users' calendars
3. For each event with a location, geocode the location and fetch weather forecast
4. If the forecast deviates from historical norms, create a `CalendarAlert`
5. Alerts appear on `/alerts` page with read/unread status

This demonstrates OAuth integration, background job design, and proactive user assistance.

---

## Creative Feature: Weather Memory Streaks

### Problem Solved

Most weather apps show "today's weather" — but they don't tell the story. Has London been rainy for 8 days straight? Is this the first sunny day in weeks? **Weather Memory Streaks** track consecutive days of the same weather condition and surface them as insights.

### How It Works

Instead of storing daily snapshots in MongoDB (which requires a cron job and stale data for new cities), we fetch **15 days of live historical data** from Open-Meteo on-demand and calculate streaks dynamically:

```typescript
// Calculate consecutive days with same condition
const streak = calculateStreak(historyDays); // { condition: 'rainy', days: 8, label: "🌧️ Rainy for 8 days" }
```

### Why This Approach?

| Approach | Pros | Cons |
|----------|------|------|
| **MongoDB snapshots + cron** | Fast reads | Requires cron job, stale for new cities, infrastructure overhead |
| **Live OpenMeteo historical** (chosen) | No cron, instant for all cities, always fresh | Slightly slower (one extra API call) |

For an assessment, **zero infrastructure dependency** felt like the right trade-off. In production with thousands of users, I'd add Redis caching.

### UI

Streaks appear as colored badges on city cards and in the favorites detail view:
- ☀️ "5-day sunshine streak"
- 🌧️ "Rainy for 8 days"
- ❄️ "Snow for 3 days"

---

## Key Design Decisions & Trade-offs

### 1. Light Theme Over Dark

**Decision**: Switched from dark (`slate-950`) to light (`#f8fafc`) theme.

**Reason**: Weather apps feel more natural in light — it evokes daylight, open skies, and clarity. Dark themes feel more suited to developer tools or entertainment.

**Trade-off**: Light themes can look "boring" if not carefully designed. We added glassmorphism, subtle gradients, and weather-themed particle effects to maintain visual interest.

### 2. Live Historical Data Over DB Snapshots

**Decision**: Removed the `WeatherSnapshot` model and cron job entirely.

**Reason**: Snapshots require infrastructure (cron job, background worker) and produce stale data for newly-added cities. Live data from Open-Meteo gives instant historical context for any city.

**Trade-off**: One extra API call per city detail view. In production, Redis caching (TTL 1 hour) would mitigate this.

### 3. AI Sidebar Over Dedicated Page

**Decision**: Replaced the `/ai-briefing` route with a slide-in chat sidebar.

**Reason**: AI should be contextually available, not buried in a separate page. Users can ask "How's London?" while looking at their dashboard.

**Trade-off**: Sidebar has less space than a full page. Conversations are more concise.

### 4. Favorites Detail View Over City Detail Page

**Decision**: Consolidated city detail into the favorites page (sidebar + chart) instead of a separate `/dashboard/[cityId]` route.

**Reason**: Switching between favorite cities is faster when they're all in a sidebar. The chart + day-by-day row gives richer context than a basic 7-day grid.

**Trade-off**: Individual city "shareable links" are no longer possible.

### 5. CSS Variables Over Tailwind darkMode

**Decision**: Used custom CSS properties (`--bg-primary`, `--accent`, etc.) instead of Tailwind's `darkMode: 'media'`.

**Reason**: Light theme only — no need for dual-theme complexity. CSS variables allow runtime theming if needed later.

---

## Known Limitations

1. **No Redis caching**: Live historical data is fetched on every city detail view. With many users, this could hit Open-Meteo rate limits.
2. **No rate limiting on backend**: Express server is open to abuse. Should add `express-rate-limit`.
3. **AI agent tool errors are silent**: If a tool fails (e.g., city not found), the agent retries but doesn't surface the error to the user clearly.
4. **No offline support**: All weather data requires an internet connection.
5. **Mobile experience is functional but not native-feeling**: PWA features (service worker, install prompt) not implemented.
6. **Weather data accuracy**: Open-Meteo is excellent globally but may not match local weather station data exactly.

---

## Deployment

### Backend (Railway)

```bash
cd apps/api
railway login
railway link
railway up
```

Set env vars in Railway dashboard:
- `MONGODB_URI`, `JWT_SECRET`, `OWM_API_KEY`, `GROQ_API_KEY`
- `CLIENT_URL=https://your-vercel-app.vercel.app`
- `NODE_ENV=production`

### Frontend (Vercel)

```bash
cd apps/web
vercel --prod
```

Set env var:
- `NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app`

### Post-Deploy

Update Railway `CLIENT_URL` with your actual Vercel domain for CORS.

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | ✗ | Create account |
| POST | /auth/login | ✗ | Login, receive JWT cookie |
| POST | /auth/logout | ✗ | Clear cookie |
| GET | /auth/me | ✓ | Get current user |
| GET | /api/cities | ✓ | Get user's cities |
| POST | /api/cities | ✓ | Add city |
| PATCH | /api/cities/:id | ✓ | Toggle favorite |
| DELETE | /api/cities/:id | ✓ | Remove city |
| GET | /api/cities/:id/history | ✓ | 15-day historical weather |
| GET | /api/cities/:id/streak | ✓ | Weather memory streak |
| GET | /api/weather/search?q= | ✓ | Geocode city search |
| GET | /api/weather/current?lat=&lon= | ✓ | Current weather |
| POST | /api/ai/chat | ✓ | Chat with AI agent |
| GET | /api/ai/briefing | ✓ | Auto-generate briefing |

---

## Demo Account

For quick testing:
- **Email**: `test@mausam.me`
- **Password**: `password123`

*(Only works if the deployer seeded this account)*

---

## Walkthrough Video

[Watch the 3-minute walkthrough](https://loom.com/share/your-link-here) *(update after recording)*

Covers: app flow, authentication, multi-city dashboard, favorites with charts, AI agent, weather streaks, and architecture overview.

---

Built with ☀️ by [Your Name]
