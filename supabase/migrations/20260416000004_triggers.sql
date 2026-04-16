-- PhoneLink Brussels — Triggers and derived logic

-- When a response is inserted and has_device = true, flip the request to 'matched'.
create or replace function mark_request_matched() returns trigger
language plpgsql as $$
begin
  if new.has_device then
    update requests
    set status = 'matched'
    where id = new.request_id and status = 'open';
  end if;
  return new;
end;
$$;

create trigger trg_response_marks_matched
after insert on responses
for each row execute function mark_request_matched();

-- Rate limit: max 20 open requests per shop at a time.
create or replace function check_request_rate_limit() returns trigger
language plpgsql as $$
declare
  open_count int;
begin
  select count(*) into open_count
  from requests
  where requesting_shop_id = new.requesting_shop_id and status = 'open';
  if open_count >= 20 then
    raise exception 'rate_limit_exceeded: max 20 open requests per shop';
  end if;
  return new;
end;
$$;

create trigger trg_request_rate_limit
before insert on requests
for each row execute function check_request_rate_limit();

-- Auto-set network_id on writes from the authenticated shop's network.
-- This prevents clients from spoofing network_id and makes inserts simpler.
create or replace function set_network_id_from_shop() returns trigger
language plpgsql security definer as $$
begin
  if new.network_id is null then
    new.network_id := auth_network_id();
  end if;
  return new;
end;
$$;

-- We only apply this to tables where clients insert directly.
create trigger trg_requests_network before insert on requests
  for each row execute function set_network_id_from_shop();

create trigger trg_responses_network before insert on responses
  for each row execute function set_network_id_from_shop();

create trigger trg_recovered_network before insert on recovered_sales
  for each row execute function set_network_id_from_shop();

create trigger trg_inventory_network before insert on inventory
  for each row execute function set_network_id_from_shop();

-- updated_at on inventory changes
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_inventory_touch before update on inventory
  for each row execute function touch_updated_at();
