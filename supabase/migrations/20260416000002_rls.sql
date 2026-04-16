-- PhoneLink Brussels — Row Level Security
-- CRITICAL: RLS is the only security boundary for Realtime Postgres Changes.
-- private Channel option does NOT apply to Postgres Changes. Tests for this
-- are in e2e/rls-isolation.spec.ts.

-- Helper: returns the network_id of the authenticated shop user.
-- Security definer so it can read shops table bypassing RLS on itself.
create or replace function auth_network_id() returns uuid
language sql stable security definer as $$
  select network_id from shops where user_id = auth.uid() limit 1
$$;

create or replace function auth_shop_id() returns uuid
language sql stable security definer as $$
  select id from shops where user_id = auth.uid() limit 1
$$;

-- ============================================================================
-- networks: public read (needed for invite flow before shop exists)
-- ============================================================================
alter table networks enable row level security;

create policy networks_read on networks for select using (true);

-- ============================================================================
-- shops: see own network's shops. Write own row only.
-- ============================================================================
alter table shops enable row level security;

create policy shops_read_network on shops for select
  using (network_id = auth_network_id());

create policy shops_update_self on shops for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- inserts handled by acceptInvite (service role); no direct insert policy.

-- ============================================================================
-- devices: public read (canonical catalog)
-- ============================================================================
alter table devices enable row level security;

create policy devices_read on devices for select using (is_active = true);

-- ============================================================================
-- inventory: see own network. Write own shop only.
-- ============================================================================
alter table inventory enable row level security;

create policy inventory_read on inventory for select
  using (network_id = auth_network_id());

create policy inventory_write_own on inventory for all
  using (shop_id = auth_shop_id() and network_id = auth_network_id())
  with check (shop_id = auth_shop_id() and network_id = auth_network_id());

-- ============================================================================
-- requests: see own network. Write own shop only.
-- ============================================================================
alter table requests enable row level security;

create policy requests_read on requests for select
  using (network_id = auth_network_id());

create policy requests_insert_own on requests for insert
  with check (requesting_shop_id = auth_shop_id() and network_id = auth_network_id());

create policy requests_update_own on requests for update
  using (requesting_shop_id = auth_shop_id())
  with check (requesting_shop_id = auth_shop_id());

-- ============================================================================
-- responses: see own network. Write as responding shop only.
-- ============================================================================
alter table responses enable row level security;

create policy responses_read on responses for select
  using (network_id = auth_network_id());

create policy responses_insert_own on responses for insert
  with check (responding_shop_id = auth_shop_id() and network_id = auth_network_id());

-- ============================================================================
-- recovered_sales: see own network. Write as responding shop only.
-- ============================================================================
alter table recovered_sales enable row level security;

create policy recovered_read on recovered_sales for select
  using (network_id = auth_network_id());

create policy recovered_insert_own on recovered_sales for insert
  with check (responding_shop_id = auth_shop_id() and network_id = auth_network_id());

-- ============================================================================
-- pending_invites: only service role reads/writes (invite flow handled server-side)
-- ============================================================================
alter table pending_invites enable row level security;
-- no policies = no anon/authenticated access. Service role bypasses RLS.

-- ============================================================================
-- Realtime publication: only tables that clients subscribe to
-- ============================================================================
alter publication supabase_realtime add table requests;
alter publication supabase_realtime add table responses;
alter publication supabase_realtime add table inventory;
alter publication supabase_realtime add table recovered_sales;
