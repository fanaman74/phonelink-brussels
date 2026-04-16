-- Supabase local seed. For dev/demo only.
-- Network + shops are seeded here; devices come from scripts/seed-devices.ts
-- (too many to write by hand and easier to maintain in TS).

insert into networks (id, name, city) values
  ('00000000-0000-0000-0000-000000000001', 'Brussels Phone Shops', 'Brussels')
on conflict do nothing;

-- Example shops for local dev. In production, use the invite flow.
-- These shops have no user_id set — link them via SQL once you have auth users.
insert into shops (id, network_id, name, owner_name, phone, commune, lat, lng, language_pref)
values
  ('10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'GSM Molenbeek', 'Youssef', '+32475000001', 'Molenbeek',
   50.8551, 4.3244, 'fr'),
  ('10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'Phone City Schaerbeek', 'Fatima', '+32475000002', 'Schaerbeek',
   50.8676, 4.3795, 'fr'),
  ('10000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'Mobile Expert Anderlecht', 'Ahmed', '+32475000003', 'Anderlecht',
   50.8339, 4.3073, 'fr'),
  ('10000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   'Tech Ixelles', 'Mehdi', '+32475000004', 'Ixelles',
   50.8336, 4.3719, 'fr'),
  ('10000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000001',
   'Phone Hub Saint-Gilles', 'Karim', '+32475000005', 'Saint-Gilles',
   50.8280, 4.3462, 'fr')
on conflict do nothing;
