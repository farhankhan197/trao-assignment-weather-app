# Mausam

An assignment I built for the TRAO hiring process.

**Web App**: [https://mausam.farhankhan.site](https://mausam.farhankhan.site)  
**API**: [https://api-mausam.farhankhan.site](https://api-mausam.farhankhan.site)

A full-stack weather dashboard where users can track multiple cities, view live weather data, get AI-powered insights, and discover weather memory streaks. I also added a Google Calendar integration that scans upcoming events and warns you if the forecast looks unusual for the event day.

---


**Why I did not deviate from the given tech stack:** 

I believe the preferred stack is genuinely well-suited for this kind of CRUD + external API dashboard.

I used turborepo to help me organize the codebase and to take advantage of the caching and build speed features. I used pnpm as the package manager because it is a fast and efficient package manager and it is a dependency of turborepo.

I also used Bun as the runtime for the API because it is a fast and efficient runtime and the server hot reloading functionality. 

These decisions helped me spend my time actually building the product instead of hopping between terminals.

### since the api is also hosted on vercel, a serverless hosting platform, cold starts to the first request are to be expected. i used vercel to deploy the backend for its ease of use and to quickly have the production version up but in a real world production grade scenario i would rather host my backend on a vps or a 24/7 up server.

---

## Tech Stack Details

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Frontend** | Next.js 16 (App Router) + TypeScript | Server components, nested layouts, excellent DX |
| **Styling** | Tailwind CSS 3 + CSS Variables | Utility-first, consistent light theme, runtime theming ready |
| **Animations** | Framer Motion | Declarative React animations (stagger, spring, layout transitions) |
| **Charts** | Recharts | Lightweight, composable React charts for the favorites view |
| **Backend** | Express 5 + TypeScript | Minimal, fast, familiar REST patterns |
| **Database** | MongoDB Atlas + Mongoose | Flexible schema, easy horizontal scaling, no migrations needed |
| **Auth** | JWT in httpOnly cookies | XSS-resistant, simple stateless sessions |
| **AI** | LangChain.js + Groq (`openai/gpt-oss-120b`) | Free tier, fast inference, robust tool-calling support |
| **Weather Data** | Open-Meteo API | Free, no API key, generous limits |
| **Geocoding** | OpenWeatherMap Geocoding API | Free tier, accurate city search |
| **Calendar** | Google Calendar API + OAuth 2.0 | Standard OAuth flow, `node-cron` for background scans |
| **Monorepo** | Turborepo + pnpm | Shared types, coordinated builds, caching, workspace-aware installs |
| **API Dev Runtime** | Bun | `--hot` reload is faster than `ts-node`/`nodemon` for local API development |
| **Deployment** | Vercel (both frontend + backend) | Zero-config Next.js; serverless Express API with `export default app` |
| **Frontend Cache** | Axios request/response interceptors | 5-minute in-memory TTL cache for GET requests |

---

## Quick Start (Local)

### Prerequisites

- Node.js 18+
- pnpm (the workspace uses `pnpm@10.21.0`)
- Bun (for the API dev server)
- MongoDB Atlas account (free M0 cluster)
- OpenWeatherMap API key (free tier)
- Groq API key (free tier)
- Google OAuth credentials (only if you want to test Calendar Alerts)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/mausam.git
cd mausam
pnpm install
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

> Optional for Calendar Alerts: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**Frontend** — create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Run Development

```bash
# From monorepo root — starts both apps via Turborepo
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000

If you prefer to run the API directly with Bun hot reload:

```bash
cd apps/api
bun --hot src/index.ts
```

---

## System and Monorepo Architecture
<img width="1370" height="1148" alt="system and monorepo architecture" src="https://github.com/user-attachments/assets/733a9f69-7c46-4984-9c95-f53323aea58b" />


---

## Authentication & Authorization

### Approach

I use **JWT tokens** stored in `httpOnly` cookies. This is XSS-resistant because JavaScript cannot read the cookie. The cookie is set with:

- `httpOnly: true`
- `secure: true` in production
- `sameSite: 'lax'`
- 7-day expiry

It is **stateless**: no session store is needed on the server. The token contains `userId` and `email`.

### Data Isolation

Every database query for user-scoped data includes `userId: req.user.id`:

```typescript
const cities = await City.find({ userId: req.user!.id });
const city = await City.findOne({ _id: req.params.id, userId: req.user!.id });
```

A compound unique index prevents duplicate cities per user:

```typescript
CitySchema.index({ userId: 1, lat: 1, lon: 1 }, { unique: true });
```

### Authorization Flow

1. Client sends requests with cookies automatically (`withCredentials: true`).
2. `authenticate` middleware verifies the JWT signature.
3. `req.user` is populated with `{ id, email }`.
4. Controllers enforce `userId` filtering on every query.
5. 401 responses are caught by an axios interceptor on the frontend, which redirects to `/login`.

---

## AI Agent Design

### Purpose

The AI agent acts as a **personal weather analyst** that can:
- Answer natural language questions about your saved cities
- Compare weather between multiple cities
- Generate personalized weather insights for favorite cities
- Provide actionable recommendations (what to wear, umbrella alerts)
- Surface calendar weather alerts and weather memory streaks

### Implementation

I built the agent with **LangChain.js + Groq** using the `openai/gpt-oss-120b` model. The agent has **9 custom tools** scoped to the authenticated user:

1. **`list_agent_capabilities`** — Explains what the agent can do.
2. **`get_user_cities`** — Returns all saved cities.
3. **`get_favorite_cities`** — Returns only favorited cities.
4. **`get_weather_current`** — Fetches live current weather for a saved city.
5. **`get_weather_forecast`** — Fetches a 7-day daily forecast for a saved city.
6. **`get_weather_streak`** — Analyzes the last 15 days and reports consecutive-day streaks.
7. **`search_city_weather`** — Geocodes and fetches weather for any city worldwide (even if not saved).
8. **`get_calendar_weather_alerts`** — Returns upcoming calendar events with unusual weather alerts.
9. **`compare_cities`** — Side-by-side weather comparison across multiple saved cities.

### Conversation Flow

<img width="1732" height="908" alt="ai assistant conversation flow" src="https://github.com/user-attachments/assets/53e85500-03d1-4a78-ab47-c0fde279cd19" />


### UI Integration

The AI lives in a **slide-in sidebar** (not a separate page) so users can chat without leaving their dashboard context. I used Framer Motion for the sidebar slide animation and message stagger.

---

## Creative Feature: Weather Memory Streaks

### Problem Solved

Most weather apps show "today's weather" — but they do not tell the story. Has London been rainy for 8 days straight? Is this the first sunny day in weeks? **Weather Memory Streaks** track consecutive days of the same weather condition and surface them as insights.

### How It Works

Instead of storing daily snapshots in MongoDB (which requires a cron job and produces stale data for new cities), I fetch **15 days of live historical data** from Open-Meteo on-demand and calculate streaks dynamically:

```typescript
const streak = calculateStreak(historyDays);
// { condition: 'rainy', days: 8, label: "🌧️ Rainy for 8 days" }
```

### Why This Approach?

| Approach | Pros | Cons |
|----------|------|------|
| **MongoDB snapshots + cron** | Fast reads | Requires cron job, stale for new cities, infrastructure overhead |
| **Live OpenMeteo historical** (chosen) | No cron, instant for all cities, always fresh | Slightly slower (one extra API call) |

For an assessment, **zero infrastructure dependency** felt like the right trade-off. In production with thousands of users, I would add Redis caching (TTL 1 hour).

### UI

Streaks appear as colored badges on city cards and in the favorites detail view:
- ☀️ "5-day sunshine streak"
- 🌧️ "Rainy for 8 days"
- ❄️ "Snow for 3 days"

### Possible Streaks

Streaks count **backwards from today**. The same condition must hold for **at least 2 consecutive days** to trigger a badge.

| Condition | Label Format | Example |
|-----------|-------------|---------|
| **sunny** | `{n}-day sunshine streak` | "5-day sunshine streak" |
| **cloudy** | `Overcast {n} days running` | "Overcast 4 days running" |
| **rainy** | `Rainy for {n} days` | "Rainy for 8 days" |
| **snowy** | `Snow for {n} days` | "Snow for 3 days" |
| **stormy** | `Stormy {n}-day stretch` | "Stormy 2-day stretch" |

When conditions have been mixed or today's weather is only a single-day occurrence, no streak badge appears.

---

## Bonus Feature: Calendar Weather Alerts

I connect your Google Calendar and the app scans upcoming events with locations. If the weather forecast for an event day looks unusual (rain on a usually sunny day, sudden temperature drop, etc.), it creates an alert so you can plan accordingly.

**How it works:**
1. Connect Google Calendar in Settings (`/auth/calendar/connect` OAuth flow).
2. A daily cron job scans all connected users' calendars at 6:00 AM UTC.
3. For each event with a location, geocode the location and fetch the weather forecast.
4. If the forecast deviates from historical norms, create a `CalendarAlert`.
5. Alerts appear on `/alerts` with read/unread status.

This demonstrates OAuth integration, background job design with `node-cron`, and proactive user assistance.

---

## Key Design Decisions & Trade-offs

### 1. Live Historical Data Over DB Snapshots

**Decision**: I removed the `WeatherSnapshot` model and cron job entirely.

**Reason**: Snapshots require infrastructure (cron job, background worker) and produce stale data for newly-added cities. Live data from Open-Meteo gives instant historical context for any city.

**Trade-off**: One extra API call per city detail view. In production, Redis caching (TTL 1 hour) would mitigate this.

### 2. Turborepo for a 2-App Project

**Decision**: I used Turborepo even though this is just a frontend + backend monorepo.

**Reason**: `turbo run dev` starts both apps with one command. The build pipeline (`turbo.json`) caches `.next/**` and `dist/**` outputs, so subsequent builds skip unchanged packages. I also get shared `typescript-config` and `eslint-config` packages for free, which keeps both apps on the same TypeScript strictness rules and avoids version drift.

**Trade-off**: For only two apps, Turborepo is arguably overkill — `pnpm` workspaces alone would handle package isolation. The `turbo.json` and `packages/*` scaffolding adds files that wouldn't exist in a simpler setup.

### 3. Bun for API Development

**Decision**: I used Bun (`bun --hot src/index.ts`) for the local API dev server instead of `ts-node` or `nodemon`.

**Reason**: Bun's `--hot` reload is genuinely faster than `nodemon` + `ts-node` for this scale. File changes restart the server almost instantly, which matters when you're iterating on AI agent prompts and weather data parsing. It's also a single binary install.

**Trade-off**: Bun is newer than Node and occasionally has edge cases with native modules. For deployment, I still build with `tsc` and the server runs on standard Node.js (via `node dist/index.js` or Vercel's runtime), so Bun is strictly a local dev convenience, not a production dependency.

### 4. Serverless Vercel for the Backend

**Decision**: I deployed the Express API to Vercel serverless functions (`export default app`) instead of a long-running VPS or Railway.

**Reason**: Zero-config deployment from the same platform as the frontend — no CORS issues, no domain management, no server patching. The `isServerless` flag skips `app.listen()` locally so the same code runs on both local dev and serverless. For an assessment project, it's one less infrastructure concern.

**Trade-off**: Serverless functions have cold starts and ephemeral state. The `node-cron` calendar alert job (`startCalendarAlertJob()`) only runs in local/non-serverless mode — on Vercel production, background cron jobs don't persist. I would need Vercel's separate Cron Jobs feature (or move to Railway/Render) for the daily 6 AM scan to actually execute reliably in production.

### 5. Open-Meteo + OpenWeatherMap Instead of Just OWM

**Decision**: I use OpenWeatherMap only for geocoding (city search), and Open-Meteo for all actual weather data (current, forecast, historical).

**Reason**: Open-Meteo is completely free, requires no API key, and has generous rate limits. OWM's free tier caps at 60 calls/minute, requires an API key, and historical data access is more limited. Open-Meteo is purpose-built for weather forecasting and has a much richer parameter set (WMO codes, apparent temperature, etc.).

**Trade-off**: Two external dependencies instead of one. If either API goes down, the app breaks in different ways (can't search cities vs. can't fetch weather). Also, Open-Meteo doesn't have a city search/geocoding endpoint, so I'm locked into OWM for that one feature regardless.

### 6. Frontend In-Memory Cache Over No Cache

**Decision**: I added a simple in-memory cache to the axios client (`lib/api.ts`) that caches GET responses for 5 minutes.

**Reason**: Without caching, switching between dashboard, favorites, and city detail pages causes redundant API calls for the same weather data. The cache dramatically reduces server load and makes navigation feel snappier — especially on mobile connections.

**Trade-off**: It's an in-memory cache (not localStorage or IndexedDB), so it clears on page refresh. It also means data can be stale for up to 5 minutes. For write operations (add city, toggle favorite), the cache is bypassed, but GET requests still show old data briefly. A more robust solution would be TanStack Query with proper invalidation.

---

## Known Limitations

1. **No Redis caching on backend**: Live historical data is fetched on every city detail view. With many users, this could hit Open-Meteo rate limits. The frontend does have a 5-minute in-memory axios cache to reduce redundant API calls.
2. **No rate limiting on backend**: The Express server is open to abuse. I should add `express-rate-limit`.
3. **AI agent tool errors are silent to the user**: If a tool fails (e.g., city not found), the agent retries but does not always surface the error clearly in the chat.
4. **No offline support**: All weather data requires an internet connection.
5. **Mobile experience is functional but not native-feeling**: PWA features (service worker, install prompt) are not implemented.
6. **Weather data accuracy**: Open-Meteo is excellent globally but may not match local weather station data exactly.

---

## Deployment

Both the frontend and backend are deployed on **Vercel**.

### Why Vercel for both?

I chose to deploy both apps on Vercel because it keeps everything on one platform — no CORS headaches between Railway and Vercel, and the serverless Express setup with `export default app` works cleanly for an assessment-scale API.

### Environment Variables

**Frontend (`apps/web`)** — Set in Vercel dashboard:

```env
NEXT_PUBLIC_API_URL=https://api-mausam.farhankhan.site
```

**Backend (`apps/api`)** — Set in Vercel dashboard:

```env
MONGODB_URI=
JWT_SECRET=
OWM_API_KEY=
GROQ_API_KEY=
CLIENT_URL=https://mausam.farhankhan.site
NODE_ENV=production
```

> Optional for Calendar Alerts: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

### Deploy from CLI

```bash
# Frontend
cd apps/web
vercel --prod

# Backend
cd apps/api
vercel --prod
```

### Post-Deploy

Make sure the backend `CLIENT_URL` matches your actual Vercel frontend domain for CORS.

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | ✗ | Create account |
| POST | /auth/login | ✗ | Login, receive JWT cookie |
| POST | /auth/logout | ✗ | Clear cookie |
| GET | /auth/me | ✓ | Get current user |
| GET | /auth/calendar/connect | ✓ | Get Google OAuth URL |
| GET | /auth/calendar/callback | ✗ | Google OAuth callback |
| GET | /auth/calendar/status | ✓ | Check calendar connection |
| POST | /auth/calendar/disconnect | ✓ | Disconnect calendar |
| GET | /api/cities | ✓ | Get user's cities |
| GET | /api/cities/:id | ✓ | Get single city |
| POST | /api/cities | ✓ | Add city |
| PATCH | /api/cities/:id | ✓ | Toggle favorite |
| DELETE | /api/cities/:id | ✓ | Remove city |
| GET | /api/cities/:id/history | ✓ | 15-day historical weather |
| GET | /api/cities/:id/streak | ✓ | Weather memory streak |
| GET | /api/weather/search?q= | ✓ | Geocode city search |
| GET | /api/weather/current?lat=&lon= | ✓ | Current weather |
| POST | /api/ai/chat | ✓ | Chat with AI agent |
| GET | /api/ai/insights | ✓ | Auto-generate insights for favorite cities |
| GET | /api/calendar/alerts | ✓ | Get calendar weather alerts |
| PATCH | /api/calendar/alerts/:id/read | ✓ | Mark alert as read |
| POST | /api/calendar/alerts/check | ✓ | Manually trigger calendar scan |

---

## Test User Account

For quick testing:
- **Email**: `test@mausam.me`
- **Password**: `password123`

I made this test user with auto fill credentials button to help test the apps functionality faster with pre loaded data, nothing is hard coded and the test user is a real user in the database.

---

## Walkthrough Video

[Watch the walkthrough video here](https://youtu.be/8RchmKMz9eI?si=lkcQZAUOAYwRoXHO)

Covers: app flow, authentication, multi-city dashboard, city detail page, favorites with charts, AI agent, calendar alerts, weather streaks, and architecture overview.

---

Built by Farhan

Thank you for your time and consideration.
