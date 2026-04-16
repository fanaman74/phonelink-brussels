-- PhoneLink Brussels — Core schema
-- All tenant-filtered tables carry network_id inline (denormalized) so RLS + Realtime
-- filter are both fast. See plan: lib/docs/ARCHITECTURE.md

create extension if not exists "uuid-ossp";
create extension if not exists pg_cron;

-- ============================================================================
-- networks: multi-network support (Brussels phone shops, future: pharmacies...)
-- ============================================================================
create table networks (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text not null default 'Brussels',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- shops: one per participating business. user_id links to Supabase auth.
-- ============================================================================
create table shops (
  id uuid primary key default uuid_generate_v4(),
  network_id uuid not null references networks(id) on delete restrict,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  owner_name text not null,
  phone text not null,
  commune text,
  lat double precision,
  lng double precision,
  language_pref text not null default 'fr' check (language_pref in ('fr', 'en', 'nl')),
  created_at timestamptz not null default now()
);

create index idx_shops_network_id on shops(network_id);
create index idx_shops_user_id on shops(user_id);

-- ============================================================================
-- devices: canonical device catalog, pre-seeded, no RLS (public read)
-- ============================================================================
create table devices (
  id uuid primary key default uuid_generate_v4(),
  brand text not null,
  model text not null,
  storage_gb int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (brand, model, storage_gb)
);

create index idx_devices_active on devices(is_active) where is_active = true;

-- ============================================================================
-- inventory: what each shop has in stock. Denormalized network_id for RLS.
-- ============================================================================
create table inventory (
  shop_id uuid not null references shops(id) on delete cascade,
  network_id uuid not null references networks(id) on delete restrict,
  device_id uuid not null references devices(id) on delete restrict,
  available boolean not null default false,
  quantity int,
  price_eur numeric(8,2),
  updated_at timestamptz not null default now(),
  primary key (shop_id, device_id)
);

-- Hot path: "find shops in network X that have device Y available"
create index idx_inventory_lookup on inventory(network_id, device_id) where available = true;
create index idx_inventory_network_id on inventory(network_id);

-- ============================================================================
-- requests: broadcasts from shops who couldn't find a device in auto-match.
-- 4h TTL enforced by pg_cron, with client-side fallback filter.
-- ============================================================================
create table requests (
  id uuid primary key default uuid_generate_v4(),
  network_id uuid not null references networks(id) on delete restrict,
  requesting_shop_id uuid not null references shops(id) on delete cascade,
  device_id uuid not null references devices(id) on delete restrict,
  specs_note text,
  status text not null default 'open' check (status in ('open', 'matched', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '4 hours')
);

create index idx_requests_network_status on requests(network_id, status) where status = 'open';
create index idx_requests_requesting_shop on requests(requesting_shop_id);
create index idx_requests_expires_at on requests(expires_at) where status = 'open';

-- ============================================================================
-- responses: shops that tapped "Je l'ai" on a request. Unique per (req, shop).
-- ============================================================================
create table responses (
  id uuid primary key default uuid_generate_v4(),
  network_id uuid not null references networks(id) on delete restrict,
  request_id uuid not null references requests(id) on delete cascade,
  responding_shop_id uuid not null references shops(id) on delete cascade,
  has_device boolean not null default true,
  price_eur numeric(8,2),
  created_at timestamptz not null default now(),
  unique (request_id, responding_shop_id)
);

create index idx_responses_request on responses(request_id);
create index idx_responses_network on responses(network_id);

-- ============================================================================
-- recovered_sales: self-reported sales after match, drives analytics counter.
-- UNIQUE (request_id, responding_shop_id) prevents double-tap double-count.
-- ============================================================================
create table recovered_sales (
  id uuid primary key default uuid_generate_v4(),
  network_id uuid not null references networks(id) on delete restrict,
  request_id uuid not null references requests(id) on delete cascade,
  responding_shop_id uuid not null references shops(id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  unique (request_id, responding_shop_id)
);

create index idx_recovered_network_date on recovered_sales(network_id, confirmed_at desc);

-- ============================================================================
-- pending_invites: invite bootstrap for new shops. Phone must match OTP phone.
-- ============================================================================
create table pending_invites (
  id uuid primary key default uuid_generate_v4(),
  network_id uuid not null references networks(id) on delete restrict,
  invited_by_shop_id uuid not null references shops(id) on delete cascade,
  phone text not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  name_hint text,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz
);

create index idx_invites_token on pending_invites(token) where accepted_at is null;
create index idx_invites_phone on pending_invites(phone) where accepted_at is null;
