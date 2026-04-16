-- PhoneLink Brussels — Scheduled jobs
-- Expire open requests past their 4h TTL every 15 minutes.
-- Client-side TTL filter (lib/ttl.ts) is the defense-in-depth fallback.

select cron.schedule(
  'expire-open-requests',
  '*/15 * * * *',
  $$
    update requests
    set status = 'expired'
    where status = 'open' and expires_at < now()
  $$
);

-- Clean up expired invites daily at 3am Brussels time (02:00 UTC).
select cron.schedule(
  'cleanup-expired-invites',
  '0 2 * * *',
  $$
    delete from pending_invites
    where accepted_at is null and expires_at < now()
  $$
);
