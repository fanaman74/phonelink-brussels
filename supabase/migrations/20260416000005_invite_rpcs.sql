-- ============================================================
-- Invite flow helper RPCs (SECURITY DEFINER)
-- These bypass RLS on pending_invites (which has no user policies)
-- ============================================================

-- 1. Public read of an invite by token (for the invite page to show shop name hint)
create or replace function get_invite_by_token(p_token text)
returns table (
  id          uuid,
  network_id  uuid,
  name_hint   text,
  expires_at  timestamptz,
  accepted_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select id, network_id, name_hint, expires_at, accepted_at
  from pending_invites
  where token = p_token
  limit 1;
$$;

-- 2. Accept an invite and create the shop row atomically
create or replace function accept_invite_and_create_shop(
  p_token         text,
  p_user_id       uuid,
  p_shop_name     text,
  p_owner_name    text,
  p_commune       text,
  p_language_pref text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite      pending_invites%rowtype;
  v_shop_id     uuid;
begin
  -- Lock and fetch invite
  select * into v_invite
  from pending_invites
  where token = p_token
  for update;

  if not found then
    raise exception 'invalid_token';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'invalid_token';
  end if;

  if v_invite.accepted_at is not null then
    raise exception 'invalid_token';
  end if;

  -- Check a shop isn't already registered for this user
  if exists (select 1 from shops where user_id = p_user_id) then
    raise exception 'duplicate';
  end if;

  -- Create the shop
  insert into shops (network_id, user_id, name, owner_name, commune, language_pref)
  values (v_invite.network_id, p_user_id, p_shop_name, p_owner_name, p_commune, p_language_pref)
  returning id into v_shop_id;

  -- Mark invite as accepted
  update pending_invites
  set accepted_at = now()
  where id = v_invite.id;

  return json_build_object('shop_id', v_shop_id);
end;
$$;

-- Grant execute to authenticated users
grant execute on function get_invite_by_token(text) to anon, authenticated;
grant execute on function accept_invite_and_create_shop(text, uuid, text, text, text, text) to authenticated;
