# Half Marathon Training Tracker

Personal training dashboard for a 21-week half marathon block (race day **Sun 11 Oct 2026**, Week 1 starts **Mon 18 May 2026**). Mobile-first PWA. Single user, no auth, just a shared-secret URL.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Postgres + Prisma 6
- Recharts for progression / body comp charts
- Luxon (timezone `Australia/Perth`)
- Deploys to Railway

## Local setup

```bash
# 1. Install
npm install

# 2. Configure env (see .env.example)
cp .env.example .env
# Fill in DATABASE_URL (local Postgres or Railway dev DB), APP_SHARED_SECRET, COOKIE_SECRET

# 3. Push schema + seed the 21-week plan
npm run db:push
npm run db:seed

# 4. Run
npm run dev
```

Then visit `http://localhost:3000/unlock?key=$APP_SHARED_SECRET` to drop the auth cookie. You'll be redirected to the calendar.

## Environment variables

| Variable             | Required | Purpose                                                            |
| -------------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`       | yes      | Postgres connection string                                          |
| `APP_SHARED_SECRET`  | yes      | Secret you append as `?key=...` to `/unlock` to gain access         |
| `COOKIE_SECRET`      | yes      | HMAC key that signs the auth cookie. Long random string.            |

Generate strong values with `openssl rand -base64 32`.

## Architecture

- All pages are React Server Components; only forms / nav / FAB are `'use client'`.
- All mutations are server actions in `app/**/actions.ts` — no hand-rolled API routes.
- `lib/plan.ts` is the single source of truth for the 21-week training plan. `prisma/seed.ts` materialises it into `Day` + `PlannedActivity` rows.
- Status colour is computed by `lib/status.ts` from logs, persisted on `Day.status` + `percentComplete`, and recalculated after every log change.
- Access lock: `proxy.ts` (Next 16's middleware) checks an HMAC-signed cookie; `/unlock?key=…` issues it. Bookmark the unlocked URL on your phone.

## Deploying to Railway

1. **Create a new Railway project** and add a **Postgres** plugin. Railway populates `DATABASE_URL` automatically.
2. **Connect this GitHub repo** as a service. Railway detects Next.js via Nixpacks and uses the `railway.json` start/build commands.
3. Set service env vars:
   - `APP_SHARED_SECRET` — long random string
   - `COOKIE_SECRET` — long random string (different from above)
4. Deploy. On first boot, `prisma db push` will run automatically before `next start` (creates/updates tables to match the schema).
5. Open `https://YOUR-RAILWAY-DOMAIN/unlock?key=YOUR_SECRET` once on your iPhone, then **Share → Add to Home Screen**.

### Seeding production

After the first deploy, run the seed script once. Either:

```bash
# Locally, pointed at the Railway DB
DATABASE_URL="<railway-postgres-url>" npm run db:seed
```

…or open a Railway shell on the service and run `npm run db:seed`. Re-running it is safe — it upserts.

## Re-seeding the plan

If you tweak `lib/plan.ts`, run `npm run db:seed` again. It upserts `Day` rows (preserving your logs) and wipes-and-recreates `PlannedActivity` rows (since those are plan-defined).

## Project layout

```
app/                 # Server components + server actions
  page.tsx           # Calendar
  day/[date]/        # Day detail + logging
  strength/          # Progression charts
  body/              # Body composition
  unlock/            # Issues auth cookie from ?key=
components/
  bottom-nav.tsx
  calendar/          # DayRow, WeekSummary, TodayFab
  day/               # Run/Swim/Strength/Structure log rows + day actions
  body/              # Body form
  charts/            # Strength + body chart wrappers
  ui/                # Button, Input, Card, Label, Textarea (shadcn-style)
lib/
  plan.ts            # 21-week plan as typed data — single source of truth
  dates.ts           # Luxon helpers, Australia/Perth
  status.ts          # Percent-complete + status-colour calc
  auth.ts            # HMAC sign/verify for the lock cookie
  db.ts, queries.ts, utils.ts
prisma/
  schema.prisma
  seed.ts
proxy.ts             # Auth gate (Next 16's replacement for middleware.ts)
public/
  manifest.webmanifest, icons/, sw.js
```

## What this app does *not* do

By design: no Strava, no Apple Health, no food/sleep/medication tracking, no weather, no notifications, no AI insights. Just the plan, the log, and the charts.
