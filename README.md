# Slide Starter (Next.js + Prisma + PostGIS)

This is a minimal, working skeleton for the **Slide** MVP:

- Next.js (App Router, TS), Tailwind
- Prisma (Postgres) + **PostGIS** radius queries via raw SQL
- NextAuth (Google OAuth) adapter wired, but you can run without auth during dev
- Event Create → Nearby API → Event Page
- Seed data for **Orlando** and a dev promoter/seeker

## Prereqs
- **Node.js 20+**
- **Postgres 14+** (local or hosted via Neon/Supabase)
- **PostGIS** extension enabled (we add it via `scripts/postgis.sql`)
- (Optional) `psql` CLI for convenience

## Quickstart
```bash
# 1) Install deps
npm i

# 2) Copy env
cp .env.example .env.local
# -> fill DATABASE_URL and Google OAuth if you want auth

# 3) Prisma generate & migrate
npm run prisma:generate
npm run db:migrate

# 4) Enable PostGIS + geom column
npm run db:postgis

# 5) Seed sample data (Orlando)
npm run db:seed

# 6) Run
npm run dev
# http://localhost:3000
```

### Nearby API
`GET /api/events/nearby?lat=28.5383&lng=-81.3792&radiusMi=5`

### Create Event (dev only)
Open `http://localhost:3000/create` and submit. During dev, the event is attributed to the seeded promoter.

### Notes
- We maintain `lat/lng` in Prisma and mirror to a **geography(Point,4326)** column (`geom`) via SQL. We update `geom` on create via a SQL `UPDATE` and in seed.
- For production auth, set Google OAuth IDs and switch the `createdById` in `/api/events` to use the session user.
- Stripe + image upload are stubbed; wire them as you go.

## Where to extend
- **Ranking**: sort by time proximity + distance now; add engagement and Boost floors later.
- **Boosts**: after Stripe Checkout, set a `Promotion` active window and apply a score floor in the nearby SQL (left as an exercise).
- **Moderation**: add an admin panel + queue for flagged images (upload service placeholder not included here).

Good luck & have fun! 🚀
