# HiveTrack – Beekeeper Management App

A full-featured web app for beekeepers to manage apiary locations, track hive
health, log inspections, and collaborate in real time.

## Tech stack

- **Next.js 14** (App Router, client components)
- **Supabase** — PostgreSQL + Auth (email/password) + Realtime
- **Tailwind CSS** — custom apiary theme (honey gold + deep charcoal)
- **date-fns** — date formatting

## One-time Supabase setup

The Vercel ↔ Supabase integration injects the env vars automatically. You just
need to set up the database schema once:

1. Go to your **Supabase project → SQL Editor**
2. Paste the contents of **`supabase/schema.sql`** and click **Run**

That's it. Tables, RLS policies, realtime, and indexes are all created in one shot.

### Optional: disable email confirmation for faster testing

Supabase requires email confirmation by default. To skip it during development:

> Supabase → Authentication → Providers → Email → uncheck **"Confirm email"**

## Local development

```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# from Supabase > Project Settings > API

npm install
npm run dev
```

## Features

- **Email/password auth** with display name, auto-creates a profile row on signup
- **Apiary (Garden) management** — create, delete, manage per-location collaborators
- **Hive tracking** — add hives, update health status (Healthy / Needs Attention / Swarming / Dormant)
- **Inspection log** — timeline with manual back-dating, per-author delete
- **Date filter sidebar** — quick-tap buttons for dates that have entries
- **Collaborator invite** — email lookup validates the user exists before adding
- **Global activity feed** — all inspections across all your apiaries, grouped by date
- **Real-time sync** — Supabase `postgres_changes` subscriptions update every client instantly

## Data model

```
profiles        id, email, display_name, created_at
gardens         id, name, location, owner_id, owner_email, created_at, updated_at
garden_collaborators  garden_id, user_id, email, display_name, added_at
hives           id, name, garden_id, owner_id, status, created_at, updated_at
inspections     id, hive_id, garden_id, author_id, author_name, message, timestamp, created_at
```

## Security

Row-Level Security (RLS) policies are defined in `supabase/schema.sql` and
enforced at the database level:

- Gardens/hives/inspections are only readable by the owner or collaborators
- Only the owner can modify garden metadata and manage collaborators
- Inspections are immutable (no UPDATE policy); only the author can delete their own
- Status enum and string length constraints enforced in the DB schema itself
