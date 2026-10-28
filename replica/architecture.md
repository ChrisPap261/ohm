# Architecture: OHM Next (a rebuild of Olive Harvest Manager)

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Next.js 15 App Router + TypeScript | User choice; SSR auth gates, Server Actions replace PHP APIs |
| styling | Tailwind CSS + CSS variables from original olive palette | Fast layout parity; tokens refined in `/replica-design` |
| database | Supabase Postgres | User choice; managed Postgres + RLS matches per-user `user_id` model |
| client / ORM | `@supabase/ssr` + typed Database types (generated); optional Drizzle later | One data path with RLS; no second auth layer |
| auth | Supabase Auth (email + password) | Replaces PHP sessions; `profiles` holds username / full_name |
| payments | — | Not in original product |
| email | Supabase Auth emails only (confirm/reset) | No transactional product mail in core loop |
| jobs | none for v1 | No reminders/webhooks needed for harvest CRUD |
| charts | Recharts | React-native Chart.js replacement; same dashboard/analytics charts |
| hosting | Vercel + Supabase | Boring, documented, cheap at zero users |
| i18n | Greek (`el`) as default copy; `Europe/Athens` display TZ | Matches original UI |

Domain constants (shared `lib/domain.ts`):

```ts
export const KG_PER_CRATE = 22.5;
export const LITERS_PER_KG_OIL = 1.1;
export const CURRENCY = 'EUR';
```

Auth note: original login is **username**. Clone signs up with email + password and stores `username` on `profiles`. Login form accepts email (or username → lookup email via a secured RPC / server action before `signInWithPassword`).

## Schema

Tables: **10** (+ `auth.users`). Access rules: **Postgres RLS** — every owned row `user_id = auth.uid()`; profiles `id = auth.uid()`. Full SQL: `replica/schema.sql`.

Highlights vs MariaDB dump:

- UUID primary keys (`gen_random_uuid()`)
- `profiles` linked to `auth.users` (trigger on signup)
- Money: integer cents + `currency` default `'EUR'`
- Dates: `date` for business days; `timestamptz` for audit columns (UTC)
- Unique partial index: **one active season per user**
- `activate_season(uuid)` RPC clears other actives atomically
- FK `oil_sales.customer_id` → `customers` ON DELETE SET NULL (missing in original dump)
- View `dashboard_oil_remaining` for inventory inputs (app still applies L÷1.1)

```
profiles 1—n seasons | fields | customers | harvests | mill_processing
                      | oil_inventory | oil_sales | olive_sales | transactions
seasons 1—n harvests, mill_processing, oil_inventory, oil_sales, olive_sales, transactions
fields 1—n harvests
customers 0—n oil_sales, olive_sales
```

Hard constraints:

- `seasons.end_date >= start_date`
- Non-negative crates/kg/amounts
- Transaction `type in ('income','expense','donation')`
- Remaining oil is **derived**, not a stored column:  
  `produced_kg − round(sold_L/1.1) − round(free_L/1.1) + previous_oil_inventory_kg`

## API

Prefer **Server Actions** under `app/(app)/…/actions.ts` (and thin route handlers only if needed for autocomplete fetch). All require authenticated session; RLS is the second gate.

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `POST /auth/register` (or SA `signUp`) | create user + profile meta | guest | email, password, username, full_name | session / error | F01 |
| `POST /auth/login` (SA `signIn`) | password login | guest | email\|username, password | session | F01 |
| `POST /auth/logout` | end session | user | — | redirect `/login` | F01 |
| `GET /auth/me` | current profile | user | — | profile | F01 |
| `GET /seasons` | list seasons | user | — | Season[] | F02 |
| `GET /seasons/active` | active season | user | — | Season\|null | F02 |
| `POST /seasons` | create | user | name, start, end, is_active? | Season | F02 |
| `PATCH /seasons/:id` | update | user | fields | Season | F02 |
| `DELETE /seasons/:id` | delete (cascades ops) | user | — | ok | F02 |
| `POST /seasons/:id/activate` | RPC activate_season | user | id | Season | F02 |
| `GET\|POST\|PATCH\|DELETE /fields` | CRUD fields | user | Field | Field(s) | F03 |
| `GET /fields/:id` | field + harvests (season filter) | user | season=all\|id | FieldDetail | F03 |
| `GET\|POST\|PATCH\|DELETE /harvests` | CRUD; filter season_id | user | Harvest | Harvest(s) | F03 |
| `GET\|POST\|PATCH\|DELETE /mill` | CRUD mill_processing | user | MillRow | MillRow(s) | F04 |
| `GET\|POST\|PATCH\|DELETE /customers` | CRUD customers | user | Customer | Customer(s) | F05 |
| `GET /customers/:id` | card + sales history | user | id | CustomerCard | F05 |
| `GET /customers/search?q=` | autocomplete | user | q | Customer[] | F05/F06 |
| `GET\|POST\|PATCH\|DELETE /oil-sales` | CRUD oil sales | user | OilSale | OilSale(s) | F05 |
| `PATCH /oil-sales/:id/status` | delivered / paid only | user | {delivered?, paid?} | OilSale | F05 |
| `GET\|POST\|PATCH\|DELETE /olive-sales` | CRUD olive sales | user | OliveSale | OliveSale(s) | F06 |
| `PATCH /olive-sales/:id/status` | delivered / paid | user | flags | OliveSale | F06 |
| `GET\|POST\|PATCH\|DELETE /transactions` | CRUD finance rows | user | Tx | Tx(s) | F07 |
| `GET /stats/dashboard?season_id=` | aggregates + remaining oil | user | season_id | DashboardStats | F08 |
| `GET /stats/harvests-by-field?season_id=` | chart data | user | season_id | FieldYield[] | F08 |
| `GET /stats/oil-yield-by-season` | analytics | user | — | YieldRow[] | F08 |
| `GET /stats/field-crates-by-season` | analytics | user | — | FieldSeasonRow[] | F08 |
| `GET\|POST\|PATCH\|DELETE /oil-inventory` | carryover CRUD (could) | user | OilInventory | OilInventory(s) | F08+ |

App routes (Next.js):

| route | screen |
| --- | --- |
| `/login` | S01 |
| `/register` | S02 |
| `/(app)/layout` | S03 shell |
| `/(app)/` or `/dashboard` | S04 |
| `/(app)/analytics` | S05 |
| `/(app)/fields` | S06 |
| `/(app)/harvests` | S07 |
| `/(app)/mill` | S08 |
| `/(app)/sales/oil` | S09 |
| `/(app)/sales/olives` | S10 |
| `/(app)/customers` | S11 |
| `/(app)/transactions` | S12 |
| `/(app)/seasons` | S13 |

Webhooks in: none. Webhooks out: none.  
Jobs: none for v1 (optional later: season-end inventory snapshot).

## The parts that bite

- **time zones:** Business dates are calendar `date` (no TZ). Display with `el-GR` + `Europe/Athens`. Do not convert harvest/sale dates through UTC midnight bugs.
- **multi-tenancy / RLS:** Every insert must set `user_id = auth.uid()`. Client-side filters alone are not enough; RLS is mandatory. Test with two users.
- **one active season:** Unique partial index + `activate_season` RPC — UI must not flip `is_active` with two separate updates without clearing the other.
- **inventory math:** Liters→kg uses `round(liters / 1.1)`. Free oil (`price` and `total` both 0) reduces stock but not revenue. Prior seasons use `oil_inventory` sum (and/or created_at ordering) — document which seasons count as “previous” and match original stats.php.
- **money:** Always cents in DB; UI shows euros with two decimals. Never store floats.
- **cascade deletes:** Deleting a season wipes harvests/mill/sales/transactions for that season — confirm dialog required.
- **GDPR deletion:** Deleting `auth.users` cascades profile and all owned rows via FKs.
- **idempotency / races / offline / realtime:** N/A for v1 single-user CRUD.
- **search:** Customer autocomplete is `ilike` on name scoped by `user_id` (index `(user_id, name)`).

## Build order

1. **Vertical slice (prove the stack)**  
   Screens: S01, S02, S03, S13, S06, S07, S04 (stats without charts OK).  
   Tables: `profiles`, `seasons`, `fields`, `harvests`, `mill_processing`, `oil_sales` (minimal for remaining oil).  
   Routes: auth + seasons CRUD/activate + fields + harvests + dashboard remaining.  
   Goal: sign up → activate season → add field → log harvest → log mill → see remaining oil.

2. **Must-haves by area**  
   - Sales: S09/S10 + customers autocomplete + delivered/paid (F05/F06)  
   - Customers: S11 list CRUD  
   - Finance: S12 transactions  
   - Dashboard charts: harvests-by-field + income/expense  
   - Shell: sidebar submenu, mobile layout, Greek copy

3. **Should-haves**  
   Field detail card; customer purchase card; analytics S05; free-oil split; mobile cards; toasts; brand tokens/logo; oil_inventory wiring verified against PHP stats.

4. **Could-haves**  
   Manual oil_inventory UI; CSV export; public report; team sharing.

5. **Fixes from replica-entrepreneur**  
   After that skill runs (positioning / user pain) — fold into backlog.

## Env / project layout (clone root)

Suggested new app under `web/` (keep PHP untouched until cutover) or replace repo root in a later PR:

```
web/
  app/(auth)/login|register
  app/(app)/...
  lib/supabase/{server,client,middleware}.ts
  lib/domain.ts
  components/...
```

Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, migrations/admin only).

## Next step

`/replica-design` — design tokens, type scale, and component states from the olive green UI before `/replica-build` starts the vertical slice.
