# OHM Next

Clean-room rebuild of Olive Harvest Manager (PHP) as a Next.js App Router app.

## Run locally

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register a user — demo data is seeded in `localStorage` (no Supabase keys required yet).

## Stack

- Next.js 15 + TypeScript + Tailwind
- Design tokens: `../replica/design/`
- Data layer: client store (`src/lib/store.tsx`) matching the planned Supabase schema
- SQL + RLS: `../replica/schema.sql` (apply when connecting Supabase)

## Next

`/replica-backend` — swap the local store for Supabase Auth + Postgres.
