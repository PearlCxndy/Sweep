-- Sweep: stores and profiles.
--
-- Store rows are shared across users and keyed on place_id, so two people who
-- shop at the same branch share one row and, later, one pooled layout.

create table if not exists public.stores (
  id          uuid primary key default gen_random_uuid(),
  retailer    text not null,
  branch      text not null,
  place_id    text unique,
  lat         double precision,
  lng         double precision,
  has_layout  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Only one row per real place. Manual entries carry a null place_id, and
-- Postgres treats nulls as distinct, so they never collide with each other.
create index if not exists stores_retailer_idx on public.stores (retailer);

create table if not exists public.profiles (
  id               uuid primary key default gen_random_uuid(),
  display_name     text,
  primary_store_id uuid references public.stores (id) on delete set null,
  created_at       timestamptz not null default now()
);

-- Aisle placements for the branches we have data for. A product does not have
-- an aisle globally: it has an aisle at a store.
create table if not exists public.store_placements (
  store_id    uuid not null references public.stores (id) on delete cascade,
  product_id  text not null,
  aisle       integer not null,
  section     text not null,
  aisle_order integer not null,
  primary key (store_id, product_id)
);

alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.store_placements enable row level security;

-- Stores and layouts are shared reference data: readable by anyone, written
-- only by the server (the service role bypasses RLS).
create policy "stores are readable" on public.stores for select using (true);
create policy "placements are readable" on public.store_placements
  for select using (true);

-- A profile is private to its owner. No policy for anon: onboarding creates
-- profiles through the server, not from the browser.
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
