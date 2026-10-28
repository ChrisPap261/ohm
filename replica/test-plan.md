# Test plan: OHM Next

Build: local `web/`  Date: 2026-10-28  Env: localStorage demo (no Supabase keys)  
Suite: `cd web && npx playwright test` → **18 passed**

| case | flow | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- | --- |
| F01-H1 | Εγγραφή και είσοδος | happy | register unique user → dashboard | dashboard visible | e2e | pass |
| F01-H2 | Είσοδος | happy | logout → login | dashboard again | e2e | pass |
| F01-N1 | | negative: wrong password | bad password | error toast, stay on login | e2e | pass |
| F01-N2 | | negative: password mismatch | passwords differ | error, no account | e2e | pass |
| F01-N3 | | negative: duplicate username | register twice | error on second | e2e | pass |
| F01-E1 | | edge: accents in name | Greek accents | shown in shell | e2e | pass |
| F01-E2 | | edge: mobile 390px | burger logout + login | dashboard + burger | e2e | pass |
| F02-H1 | Περίοδος | happy | seeded active season | sidebar shows ενεργή περίοδος | e2e | pass |
| F02-E1 | | edge: no active season | delete season → harvests | NoSeasonState | e2e | pass |
| F03-H1 | Συγκομιδή | happy | crates 10 → kg 225 | row in table | e2e | pass |
| F03-E1 | | edge: editable autofill | override kg to 100 | saved 100 kg | e2e | pass |
| F04-H1 | Ελαιοτριβείο | happy | mill row | liters + yield | e2e | pass |
| F05-H1 | Πώληση λαδιού | happy | new oil sale | 11 L row | e2e | pass |
| F05-E1 | | edge: paid toggle | flip switch | aria-checked flips | e2e | pass |
| F06-H1 | Πώληση ελιών | happy | olive sale | 50 kg row | e2e | pass |
| F07-H1 | Συναλλαγές | happy | expense | Καύσιμα + € | e2e | pass |
| F08-H1 | Dashboard | happy | overview | stats visible | e2e | pass |
| F08-H2 | Analytics | happy | analytics | heading | e2e | pass |
| A11Y-01 | | axe dashboard | after login | no serious+ violations | e2e | pass |
| F08-E1 | | keyboard nav | Tab/Enter sidebar | page changes | manual | to check |
| SEC-01 | | second user | Supabase RLS | no cross-tenant data | manual | to check |
