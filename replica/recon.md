# Recon map: Olive Harvest Manager / OHM (web)

Scope: Πλήρες clone του PHP SPA — auth, περίοδοι, αγροτεμάχια, συγκομιδές, ελαιοτριβείο, πωλήσεις (λάδι/ελιές), πελάτες, έσοδα/έξοδα, dashboard & analytics. Target stack: **Next.js + Supabase**.
For: Ιδιοκτήτης/διαχειριστής ελαιοπαραγωγής (ελληνικό UI, Europe/Athens).
Date: 2026-10-28

## Sources

| # | source | URL / path | notes |
| --- | --- | --- | --- |
| 1 | Own app source (this repo) | `/workspace` PHP + jQuery SPA | Primary: screens, APIs, schema |
| 2 | SQL dump | `ohm.sql` | Full MariaDB schema + FKs |
| 3 | REST-ish PHP APIs | `api/*.php` | action query param pattern |
| 4 | Front modules | `assets/js/*.js` | Per-page CRUD + charts |
| 5 | Styles / brand | `assets/css/style.css`, `assets/images/olive-logo.png` | Olive green palette |

## Core loop

Ο χρήστης ορίζει **ενεργή περίοδο**, καταγράφει συγκομιδή ανά αγροτεμάχιο, επεξεργασία στο ελαιοτριβείο, πουλάει λάδι/ελιές σε πελάτες και βλέπει απόθεμα + οικονομικά στην επισκόπηση.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Login | `login.php` | Σύνδεση με username/password | form, alert, link to register | empty, error, success redirect |
| S02 | Register | `register.php` | Νέος λογαριασμός | form (full_name, username, email, password×2) | empty, validation, username taken, success |
| S03 | App shell | `index.php` (auth gate) | Sidebar + mobile nav + outlet | sidebar, burger, user footer, logout | desktop sidebar / mobile drawer |
| S04 | Επισκόπηση (Dashboard) | nav `dashboard` | Stats + charts για περίοδο | season select, stat cards, Chart.js bar/doughnut | no active season, loading, filled |
| S05 | Analytics | nav `analytics` | Απόδοση λαδιού ανά περίοδο + τελάρα ανά χωράφι | yield chart, field dropdown, field chart | empty seasons, filtered by field |
| S06 | Αγροτεμάχια | nav `fields` | CRUD χωραφιών | table/mobile cards, modal form, detail card | empty, list, modal create/edit, detail with harvests |
| S07 | Συγκομιδές | nav `harvests` | CRUD συγκομιδών (ενεργή περίοδος) | table, modal (field select, crates→kg auto) | no season, empty, CRUD |
| S08 | Ελαιοτριβείο | nav `mill` | Καταγραφή επεξεργασίας | table, modal (crates→olives kg, oil kg, cost) | no season, empty, CRUD, yield ratio |
| S09 | Πωλήσεις ελαιολάδου | nav `oil_sales` | CRUD πωλήσεων λαδιού | table, autocomplete customer, delivered/paid toggles | no season, empty, CRUD, status toggle |
| S10 | Πωλήσεις ελιών | nav `olive_sales` | CRUD πωλήσεων ελιών | same pattern as S09, kg + €/kg | no season, empty, CRUD, status toggle |
| S11 | Πελάτες | nav `customers` | CRUD πελατών + κάρτα αγορών | table, modal, customer card with purchase history | empty, list, detail |
| S12 | Έσοδα/Έξοδα | nav `transactions` | Manual income/expense/donation | table, modal (type, amount in €) | no season, empty, CRUD |
| S13 | Περίοδοι | nav `seasons` | CRUD περιόδων + activate | table, modal, activate button, is_active badge | empty, list, one active |

Screenshots reference (όχι για ship): `replica/screens/` — να συμπληρωθούν από live instance αν υπάρχει.

## Flows

```
F01 Εγγραφή και είσοδος
    S02 -> S01 -> S03/S04
    happy path clicks: ~4
    edge: username υπάρχει ήδη, κωδικοί δεν ταιριάζουν, λάθος credentials

F02 Ρύθμιση περιόδου εργασίας
    S13 create season (is_active) -> activeSeason στο shell -> S04 unlocks
    happy path clicks: ~5
    edge: καμία ενεργή περίοδος (όλα τα season-scoped pages δείχνουν μήνυμα)

F03 Καταγραφή συγκομιδής
    S06 (προαιρετικά νέο χωράφι) -> S07 νέα συγκομιδή (field, date, crates, kg)
    happy path clicks: ~6
    edge: crates auto-fill kg = crates × 22.5 (editable)

F04 Επεξεργασία στο ελαιοτριβείο
    S08 νέα επεξεργασία (crates, olives_kg, oil_kg, expenses)
    happy path clicks: ~5
    edge: crates × 22.5 για olives; λίτρα = kg × 1.1; απόδοση olives:oil

F05 Πώληση λαδιού σε πελάτη
    S11 (προαιρετικά) -> S09 νέα πώληση + autocomplete buyer -> toggles delivered/paid
    happy path clicks: ~7
    edge: free oil (price/total 0) μετράει ως δωρεάν στο inventory calc

F06 Πώληση ελιών
    S10 ίδια ροή με F05 αλλά olives_kg + price_per_kg
    happy path clicks: ~6
    edge: delivered/paid status updates χωρίς full edit

F07 Οικονομική καταγραφή
    S12 create income|expense|donation
    happy path clicks: ~5
    edge: amounts σε cents στο DB· mill expenses + oil revenue μπαίνουν στο dashboard aggregate

F08 Επισκόπηση / analytics
    S04 season switcher + stats· S05 yield charts
    happy path clicks: ~2–4
    edge: remaining oil = produced − sold − free + previous oil_inventory; all-seasons remaining
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, sm | default, hover | all |
| Form control / select / textarea | text, number, date, tel, email | required, muted help | modals S01–S13 |
| Modal dialog | create/edit | open/closed | S06–S13 |
| Data table | desktop | empty row, filled | S06–S13 |
| Mobile cards | responsive ≤768px | empty, filled, actions | S06–S13 via mobile-utils |
| Sidebar nav | leaf + submenu (Πωλήσεις) | active, open | S03 |
| Mobile navbar + burger | — | open drawer | S03 |
| Stat card | highlight border | — | S04, S11 detail |
| Chart (Chart.js) | bar, doughnut/line | empty data | S04, S05 |
| Autocomplete dropdown | customer search | open/closed | S09, S10 |
| Status toggle switch | delivered, paid | on/off | S09, S10 |
| Toast/alert | success, danger, warning, info | auto-dismiss 3s | shell + auth |
| Season selector | global active + page dropdown | — | S04, field card |
| User footer | avatar initial | — | S03 |

## Inferred data model

```
User          id, username (unique), password_hash, email, full_name, timestamps
              evidence: users table, Auth.php, S01/S02
              confidence: high

Season        id, user_id, name, start_date, end_date, is_active, timestamps
              evidence: seasons, S13, active season gate
              confidence: high

Field         id, user_id, name, location, area (m²), tree_count, timestamps
              evidence: fields, S06
              confidence: high

Harvest       id, user_id, field_id, season_id, harvest_date, crates, olives_kg, notes
              evidence: harvests, S07; crates×22.5 heuristic
              confidence: high

MillProcessing id, user_id, season_id, processing_date, crates, olives_kg, oil_kg, expenses (cents), notes
              evidence: mill_processing, S08
              confidence: high

OilInventory  id, user_id, season_id, inventory_date, oil_kg, notes
              evidence: oil_inventory used only in stats.php carryover — no UI CRUD
              confidence: high (schema), UI = missing in original

Customer      id, user_id, name, phone, timestamps
              evidence: customers, S11
              confidence: high

OilSale       id, user_id, season_id, customer_id?, sale_date, oil_liters,
              price_per_liter (cents), total_amount (cents), buyer, notes, delivered, paid
              evidence: oil_sales, S09
              confidence: high

OliveSale     id, user_id, season_id, customer_id?, sale_date, olives_kg,
              price_per_kg (cents), total_amount (cents), buyer, notes, delivered, paid
              evidence: olive_sales, S10
              confidence: high

Transaction   id, user_id, season_id, type (income|expense|donation), category?,
              transaction_date, description, amount (cents), notes
              evidence: transactions, S12
              confidence: high
```

Relationships: User 1-n Season, Field, Customer, and all operational rows. Season 1-n Harvest, MillProcessing, OilInventory, OilSale, OliveSale, Transaction. Field 1-n Harvest. Customer 0-n OilSale/OliveSale (SET NULL on delete for olive_sales).

Domain constants (preserve in clone):
- `1 crate ≈ 22.5 kg` olives (auto-fill)
- `1 kg oil ≈ 1.1 L` (display + remaining calc uses L→kg ÷ 1.1)
- Money stored as **integer cents**
- Timezone: Europe/Athens; UI lang: el

Multi-tenancy: κάθε πίνακας φιλτράρει με `user_id` (session). Στο Supabase: Auth users + RLS by `auth.uid()`.

## Feature matrix

See `features.csv`. Must: 28, should: 8, could: 4, skip: 2.

## Out of scope (cannot or should not be cloned)

- Αποθήκευση plaintext DB credentials στο repo (το original `includes/config.php` έχει secrets — το clone χρησιμοποιεί μόνο env / Supabase)
- Copy του ίδιου PHP/jQuery κώδικα ως-είναι — clean-room Next.js rewrite
- Real-time multi-user collaboration (το original είναι single-user session SPA)
- Δημόσιο marketplace / τρίτοι λογαριασμοί παραγωγών
- Αυτόματο import από το live MariaDB χωρίς συγκατάθεση (migration data είναι optional follow-up)

## Size

Screens 13, flows 8, entities 10. Hard parts: (1) oil remaining inventory math across seasons + oil_inventory carryover, (2) Supabase Auth + RLS multi-tenant parity με user_id, (3) season-scoped UX + dashboard aggregates + Chart analytics, (4) customer autocomplete + sale status toggles. Size: **M** (πλήρες product clone σε Next.js App Router + Supabase).

## Target architecture (proposed for `/replica-architect`)

- Next.js (App Router) + TypeScript
- Supabase Auth (email preferred; map username→email ή κρατάμε username σε profiles)
- Postgres schema από `ohm.sql` με UUID PKs optional, RLS policies
- Server Actions / Route Handlers αντί για `api/*.php?action=`
- Charts: Chart.js ή Recharts
- i18n el ως default
