# OHM — backend checklist

Backend for the Next.js clone: Supabase Auth + Postgres with row-level security. Payments, background jobs, and third-party integrations from the original app are out of scope.

## Auth

- [x] Email sign-up with password (Supabase Auth)
- [x] Login with username or email (username resolved server-side via `email_for_username` RPC)
- [x] Logout (Supabase `signOut` + session cookies via `@supabase/ssr`)
- [x] Session refresh in Next.js middleware when Supabase env is set
- [ ] Email verification enforced in production (disable confirm only for local dev)
- [ ] Password reset flow
- [ ] OAuth (Google / Apple) if needed later
- [ ] Account deletion (GDPR / App Store)

## Database

- [x] Migrations checked in: `web/supabase/migrations/20261028000000_ohm_schema.sql`
- [x] RLS enabled on all tenant tables; owner isolation via `auth.uid()`
- [x] Profile auto-created on signup (`handle_new_user` trigger)
- [x] `activate_season` RPC for single active season per user
- [x] Seed instructions in `web/supabase/seed.sql` (no fake PII in repo)
- [ ] Verify RLS with a second test user (manual QA)
- [ ] Confirm Supabase daily backups enabled on the host project

## Data layer (app)

- [x] `StoreApi` implemented against Postgres when `NEXT_PUBLIC_SUPABASE_URL` + anon key are set
- [x] localStorage demo fallback when Supabase env is empty
- [x] Snake_case ↔ camelCase mappers in `src/lib/data/mappers.ts`

## Payments

- N/A — OHM clone has no billing in scope

## Email

- [x] Auth email only via Supabase (no custom transactional provider)
- [ ] Custom domain / SMTP for production deliverability

## Background jobs

- N/A

## Integrations

- N/A

## Security checklist

- [x] Secrets only in env vars; `.env*` gitignored; service role never in client bundle
- [x] Server action `resolveLoginEmail` validates input with Zod
- [x] Authorization via RLS on every table (not client-trusted `user_id` alone)
- [ ] Rate limits on auth endpoints (Supabase / WAF / middleware)
- [ ] Webhooks N/A
- [ ] Uploads N/A
- [ ] Avoid logging emails or passwords
- [ ] Run `npm audit` before deploy
- [ ] Privacy policy listing Supabase as processor

## Setup (user-owned)

1. Create a [Supabase](https://supabase.com) project.
2. Run the migration SQL (SQL editor or `supabase db push` after linking CLI).
3. Copy `web/.env.example` → `web/.env.local` and paste **your** project URL and anon key (and optional service role for admin scripts only).
4. Optional local dev: Authentication → Providers → Email → disable “Confirm email”.
5. Register in the app; create your first season in the UI (no server seed with fake people).

## Next

- `/replica-test` — E2E against both local and Supabase modes
- `/replica-deploy` — production env and hosting
