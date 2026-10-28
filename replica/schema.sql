-- Olive Harvest Manager (OHM) — Supabase Postgres schema
-- Clean-room rewrite of ohm.sql for Next.js + Supabase Auth + RLS.
-- Run via Supabase SQL editor or as the first migration.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_len check (char_length(username) between 2 and 50)
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));

-- Auto-create profile on signup (expects username / full_name in raw_user_meta_data)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seasons
-- ---------------------------------------------------------------------------
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seasons_date_range check (end_date >= start_date)
);

create index seasons_user_id_idx on public.seasons (user_id);
create index seasons_user_active_idx on public.seasons (user_id, is_active);
-- At most one active season per user
create unique index seasons_one_active_per_user
  on public.seasons (user_id)
  where is_active = true;

create trigger seasons_updated_at
  before update on public.seasons
  for each row execute function public.set_updated_at();

-- Activate: set this season active and clear others for the same user
create or replace function public.activate_season(p_season_id uuid)
returns public.seasons
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_row public.seasons;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  update public.seasons
  set is_active = false
  where user_id = v_user and is_active = true and id <> p_season_id;

  update public.seasons
  set is_active = true
  where id = p_season_id and user_id = v_user
  returning * into v_row;

  if v_row.id is null then
    raise exception 'season not found';
  end if;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fields (αγροτεμάχια)
-- ---------------------------------------------------------------------------
create table public.fields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  location text,
  area integer, -- m²
  tree_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fields_area_nonneg check (area is null or area >= 0),
  constraint fields_trees_nonneg check (tree_count is null or tree_count >= 0)
);

create index fields_user_id_idx on public.fields (user_id);

create trigger fields_updated_at
  before update on public.fields
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Harvests
-- ---------------------------------------------------------------------------
create table public.harvests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  field_id uuid not null references public.fields(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  harvest_date date not null,
  crates integer not null,
  olives_kg integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint harvests_crates_nonneg check (crates >= 0),
  constraint harvests_kg_nonneg check (olives_kg >= 0)
);

create index harvests_user_season_idx on public.harvests (user_id, season_id);
create index harvests_field_id_idx on public.harvests (field_id);
create index harvests_date_idx on public.harvests (harvest_date);

create trigger harvests_updated_at
  before update on public.harvests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Mill processing
-- ---------------------------------------------------------------------------
create table public.mill_processing (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  processing_date date not null,
  crates integer,
  olives_kg integer not null,
  oil_kg integer not null,
  expenses integer not null default 0, -- cents EUR
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mill_crates_nonneg check (crates is null or crates >= 0),
  constraint mill_olives_nonneg check (olives_kg >= 0),
  constraint mill_oil_nonneg check (oil_kg >= 0),
  constraint mill_expenses_nonneg check (expenses >= 0)
);

create index mill_user_season_idx on public.mill_processing (user_id, season_id);
create index mill_date_idx on public.mill_processing (processing_date);

create trigger mill_updated_at
  before update on public.mill_processing
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Oil inventory (carryover / opening stock per season)
-- ---------------------------------------------------------------------------
create table public.oil_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  inventory_date date not null,
  oil_kg integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint oil_inv_kg_nonneg check (oil_kg >= 0)
);

create index oil_inv_user_season_idx on public.oil_inventory (user_id, season_id);
create index oil_inv_date_idx on public.oil_inventory (inventory_date);

create trigger oil_inv_updated_at
  before update on public.oil_inventory
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_user_id_idx on public.customers (user_id);
create index customers_name_idx on public.customers (user_id, name);

create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Oil sales
-- ---------------------------------------------------------------------------
create table public.oil_sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  sale_date date not null,
  oil_liters integer not null,
  price_per_liter integer not null default 0, -- cents
  total_amount integer not null default 0, -- cents
  currency text not null default 'EUR',
  buyer text,
  notes text,
  delivered boolean not null default false,
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint oil_sales_liters_nonneg check (oil_liters >= 0),
  constraint oil_sales_price_nonneg check (price_per_liter >= 0),
  constraint oil_sales_total_nonneg check (total_amount >= 0)
);

create index oil_sales_user_season_idx on public.oil_sales (user_id, season_id);
create index oil_sales_customer_id_idx on public.oil_sales (customer_id);
create index oil_sales_date_idx on public.oil_sales (sale_date);

create trigger oil_sales_updated_at
  before update on public.oil_sales
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Olive sales
-- ---------------------------------------------------------------------------
create table public.olive_sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  sale_date date not null,
  olives_kg integer not null,
  price_per_kg integer not null default 0, -- cents
  total_amount integer not null default 0, -- cents
  currency text not null default 'EUR',
  buyer text,
  notes text,
  delivered boolean not null default false,
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint olive_sales_kg_nonneg check (olives_kg >= 0),
  constraint olive_sales_price_nonneg check (price_per_kg >= 0),
  constraint olive_sales_total_nonneg check (total_amount >= 0)
);

create index olive_sales_user_season_idx on public.olive_sales (user_id, season_id);
create index olive_sales_customer_id_idx on public.olive_sales (customer_id);
create index olive_sales_date_idx on public.olive_sales (sale_date);

create trigger olive_sales_updated_at
  before update on public.olive_sales
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Transactions (manual income / expense / donation)
-- ---------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'donation')),
  category text,
  transaction_date date not null,
  description text not null,
  amount integer not null, -- cents
  currency text not null default 'EUR',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_amount_nonneg check (amount >= 0)
);

create index transactions_user_season_idx on public.transactions (user_id, season_id);
create index transactions_type_idx on public.transactions (type);
create index transactions_date_idx on public.transactions (transaction_date);

create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Domain helpers (optional SQL views for dashboard)
-- ---------------------------------------------------------------------------
-- Constants used in app code (document; keep in TypeScript too):
--   KG_PER_CRATE = 22.5
--   LITERS_PER_KG_OIL = 1.1

create or replace view public.dashboard_oil_remaining
with (security_invoker = true)
as
select
  mp.user_id,
  mp.season_id,
  coalesce(sum(mp.oil_kg), 0) as produced_kg,
  (
    select coalesce(sum(
      case
        when os.price_per_liter > 0 or os.total_amount > 0 then os.oil_liters
        else 0
      end
    ), 0)
    from public.oil_sales os
    where os.user_id = mp.user_id and os.season_id = mp.season_id
  ) as sold_paid_liters,
  (
    select coalesce(sum(
      case
        when os.price_per_liter = 0 and os.total_amount = 0 then os.oil_liters
        else 0
      end
    ), 0)
    from public.oil_sales os
    where os.user_id = mp.user_id and os.season_id = mp.season_id
  ) as given_free_liters,
  (
    select coalesce(sum(oi.oil_kg), 0)
    from public.oil_inventory oi
    where oi.user_id = mp.user_id
      and oi.season_id in (
        select s.id from public.seasons s
        where s.user_id = mp.user_id
          and s.created_at < (select s2.created_at from public.seasons s2 where s2.id = mp.season_id)
      )
  ) as previous_inventory_kg
from public.mill_processing mp
group by mp.user_id, mp.season_id;

-- ---------------------------------------------------------------------------
-- Row Level Security — owner isolation via auth.uid()
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.fields enable row level security;
alter table public.harvests enable row level security;
alter table public.mill_processing enable row level security;
alter table public.oil_inventory enable row level security;
alter table public.customers enable row level security;
alter table public.oil_sales enable row level security;
alter table public.olive_sales enable row level security;
alter table public.transactions enable row level security;

-- Profiles
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid());

-- Generic owner policies (user_id = auth.uid())
create policy seasons_all_own on public.seasons
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy fields_all_own on public.fields
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy harvests_all_own on public.harvests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy mill_all_own on public.mill_processing
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy oil_inv_all_own on public.oil_inventory
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy customers_all_own on public.customers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy oil_sales_all_own on public.oil_sales
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy olive_sales_all_own on public.olive_sales
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy transactions_all_own on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.seasons to authenticated;
grant select, insert, update, delete on public.fields to authenticated;
grant select, insert, update, delete on public.harvests to authenticated;
grant select, insert, update, delete on public.mill_processing to authenticated;
grant select, insert, update, delete on public.oil_inventory to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.oil_sales to authenticated;
grant select, insert, update, delete on public.olive_sales to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select on public.dashboard_oil_remaining to authenticated;
grant execute on function public.activate_season(uuid) to authenticated;
