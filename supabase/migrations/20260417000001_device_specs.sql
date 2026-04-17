-- Add technical spec columns to the devices table.
-- All nullable so existing rows don't break; populated by seed-devices.ts.

ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS display        text,
  ADD COLUMN IF NOT EXISTS display_hz     text,
  ADD COLUMN IF NOT EXISTS camera_main    text,
  ADD COLUMN IF NOT EXISTS camera_front   text,
  ADD COLUMN IF NOT EXISTS processor      text,
  ADD COLUMN IF NOT EXISTS ram_gb         integer,
  ADD COLUMN IF NOT EXISTS battery_mah    integer,
  ADD COLUMN IF NOT EXISTS sim            text,
  ADD COLUMN IF NOT EXISTS connectivity   text[],
  ADD COLUMN IF NOT EXISTS release_year   integer;
