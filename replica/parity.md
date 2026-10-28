# Parity report: OHM Next vs Olive Harvest Manager (PHP)

Date: 2026-10-28 (Europe/Bucharest)  
Clone: Next.js App Router + localStorage demo / Supabase-ready  
Original: PHP/jQuery SPA in this repo  

## Verdict: **shippable**

- Must-haves: **30 / 30** done  
- Feature score: **99.1 / 100**  
- Open S1/S2 bugs: **none** (BUG-001 S3 fixed)  
- Layout score: **n/a** — `replica/screens/` has no original reference shots yet  

A straight visual clone of the original logo/PNG is intentionally partial (clean-room mark `Ω` + olive tokens). That is the only scored gap.

## Feature parity

```
Parity: 99.1 / 100
features 99.1  (38 counted, must-haves 30 of 30 done)
```

### By area (weakest first)

| area | score | notes |
| --- | --- | --- |
| brand | 50.0 | partial logo / mark |
| auth, seasons, fields, harvests, mill, sales, customers, finance, dashboard, analytics, shell, i18n | 100.0 | |

### Missing (build order)

1. **[should] brand** — Olive brand colors and logo → *partial*: accent olive tokens ship; custom `Ω` mark instead of original PNG (keep unless `/replica-brand` supplies a final mark)

### Left out on purpose (not scored)

- Copy PHP session auth as-is → Supabase Auth / local session instead  
- Ship original DB credentials or PHP code → clean-room rewrite  

### Clone-only ideas (original=`no`, not scored)

- Manual `oil_inventory` CRUD UI (schema ready)  
- Multi-user team sharing  
- Public read-only farm report  
- CSV export  

## Layout diff

Not run. Need original screenshots at matching viewports:

| screen | clone artifact | original needed |
| --- | --- | --- |
| S04 Dashboard | `replica/clone-screens/S04-dashboard.png` | `replica/screens/S04.png` |
| S07 Harvests | `replica/clone-screens/S07-harvests.png` | `replica/screens/S07.png` |
| S08 Mill | `replica/clone-screens/S08-mill.png` | `replica/screens/S08.png` |

When originals exist (from your live PHP instance):

```bash
mkdir -p replica/diffs
python3 replica/imgdiff.py replica/screens/S04.png replica/clone-screens/S04-dashboard.png --out replica/diffs/S04.png --json > replica/diffs/S04.json
python3 replica/parity.py replica/features.csv --visual replica/diffs/*.json --markdown > replica/parity.md
```

Colour differences must not count against you; `imgdiff` layout mode ignores colour.

## Behaviour diff

| flow | original does | clone does | fix or keep |
| --- | --- | --- | --- |
| F01 Auth | PHP session cookie, username login | localStorage session **or** Supabase Auth cookies; username→email RPC when Supabase | keep |
| F01 Register | no seed data | seeds demo season/field/harvest/mill/sale (local only) | keep for demo; Supabase starts empty |
| F02 Seasons | `activate` API clears others | same (local) / `activate_season` RPC (Supabase) | keep |
| F03 Harvest | crates × 22.5 autofill | same | keep |
| F04 Mill | kg × 1.1 liters, yield ratio | same | keep |
| F05/F06 Sales | jQuery autocomplete + status toggles | React autocomplete + `role=switch` | keep |
| F08 Remaining oil | PHP stats L÷1.1 + free oil + prior inventory | same formula in `lib/data/stats.ts` | keep |
| Copy / i18n | Greek labels in PHP | Fresh Greek copy (not verbatim) | keep |
| Brand | `olive-logo.png` | Token olive + `Ω` mark | improve via brand skill if desired |
| Hosting | shared PHP/MariaDB | Vercel + Supabase (when keys set) | keep |

Core-loop click count is similar or lower (App Router nav vs SPA hash modules). Fewer stack hops for the user is a win.

## Evidence

- E2E: 18/18 Playwright (`web/e2e/`, see `replica/test-plan.md`)  
- Bugs: `replica/bugs.md` — no open S1/S2  
- Feature matrix: `replica/features.csv`  

## Top five next

1. Create Supabase project, apply migration, set `.env.local`, verify RLS with a second user (SEC-01)  
2. Capture original PHP screenshots into `replica/screens/` and run `imgdiff` for layout scores  
3. Decide brand: keep `Ω` or commission a final mark (`/replica-brand`)  
4. Optional could-haves: oil inventory UI, CSV export  
5. `/replica-deploy` when ready for production host + domain  

## Goal note

**Shippable** today for feature parity. **Better than the original** needs `/replica-entrepreneur` (user-pain fixes) on top of this baseline — a straight copy has no reason to exist; the Next/Supabase stack, a11y chart fix, and dual-mode backend are already differentiators.
