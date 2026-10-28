# OHM Next

Clean-room rebuild of Olive Harvest Manager (PHP) as a Next.js App Router app.

## Run locally (demo mode)

No Supabase keys required — data lives in `localStorage` after you register.

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Registration seeds sample Greek demo data in the browser.

## Run with Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the schema:
   - **SQL editor:** paste and run `supabase/migrations/20261028000000_ohm_schema.sql`, or
   - **CLI:** link the project and run `supabase db push` from `web/`.
3. Copy env template:

   ```bash
   cp .env.example .env.local
   ```

4. Set in `.env.local` (from Supabase → Project Settings → API Keys):

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — use the **publishable** key (`sb_publishable_…`); legacy anon JWT also works
   - Optional alias: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (same value; either name is enough)
   - Optional server-only: `SUPABASE_SERVICE_ROLE_KEY` / secret key (admin scripts; never expose to the browser)

5. Optional for local dev: **Authentication → Providers → Email** → turn off “Confirm email” so sign-up works immediately.

6. `npm run dev` — the app uses Supabase Auth + Postgres (RLS). After first signup, create a season on the Seasons page (no automatic demo seed in cloud mode).

See also `../replica/backend.md` for the security checklist.

## Stack

- Next.js 15 + TypeScript + Tailwind
- Design tokens: `../replica/design/`
- Data: `src/lib/data/*` (Supabase or localStorage fallback)
- SQL + RLS: `supabase/migrations/`

## Build

```bash
npm run build
```
