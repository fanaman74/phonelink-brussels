# PhoneLink Brussels

A coordination webapp for independent mobile phone shops in Brussels — replaces phone calls between shop owners with a shared inventory dashboard and real-time request broadcasting system.

**Stack:** Next.js 15 · Supabase (Auth + Realtime + RLS) · Tailwind CSS · next-intl (FR/EN/NL)

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd phonelink-brussels
npm install
```

### 2. Set environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → service_role secret key |

> **Already configured** for `https://ivzergvkfmqhxrkqjfyr.supabase.co` — just add the service role key.

### 3. Run database migrations

```bash
# Link to your project
npx supabase link --project-ref ivzergvkfmqhxrkqjfyr

# Push all migrations
npx supabase db push
```

Migrations applied (in order):
1. `000001_schema.sql` — 8 tables (networks, shops, devices, inventory, requests, responses, recovered_sales, pending_invites)
2. `000002_rls.sql` — Row-Level Security policies + Realtime publication
3. `000003_cron.sql` — pg_cron jobs (expire requests every 15 min, cleanup invites daily)
4. `000004_triggers.sql` — request matching, rate limiting, network_id auto-population
5. `000005_invite_rpcs.sql` — SECURITY DEFINER functions for invite flow

### 4. Seed demo data (optional)

```bash
# Seed device catalog (~180 devices)
npx tsx scripts/seed-devices.ts

# Seed demo network + 5 Brussels shops (local dev only)
npx supabase db reset   # runs supabase/seed.sql
```

### 5. Run dev server

```bash
npm run dev
# → http://localhost:3000  (redirects to /fr/demandes)
```

---

## Project Structure

```
app/
├── [locale]/
│   ├── layout.tsx          # Locale layout + SessionGuard + BottomNav
│   ├── login/page.tsx      # Email OTP login (2-step)
│   ├── demandes/           # Dashboard — inbound requests + Realtime
│   ├── stock/              # Inventory management
│   ├── chercher/           # Search + request blast
│   ├── carte/              # Network map (Leaflet + OSM)
│   ├── stats/              # Analytics — recovered sales
│   └── invite/[token]/     # Invite acceptance flow
├── actions/                # Server Actions (Zod-validated)
│   ├── inventory.ts
│   ├── requests.ts
│   ├── responses.ts
│   ├── sales.ts
│   └── invites.ts
components/
├── BottomNav.tsx           # 5-tab bottom navigation
└── SessionGuard.tsx        # Client-side auth guard
lib/
├── routing.ts              # next-intl locale config (fr/en/nl)
├── devices.ts              # Static device catalog + displayDevice()
├── ttl.ts                  # Client-side TTL check + time-remaining
└── supabase/
    ├── client.ts           # Browser Supabase client (singleton)
    ├── server.ts           # Server Supabase client (SSR cookies)
    ├── types.ts            # Full DB type definitions
    ├── errors.ts           # Error classifier → toast key
    └── realtime.ts         # Realtime subscription helpers
messages/
├── fr.json                 # French UI strings
├── en.json                 # English UI strings
└── nl.json                 # Dutch UI strings
supabase/
├── migrations/             # SQL migrations (push with supabase db push)
└── seed.sql                # Demo data (1 network + 5 shops)
tests/                      # Vitest unit tests
e2e/                        # Playwright E2E tests
```

---

## Key Architecture Decisions

### Realtime security
Supabase Realtime Postgres Changes respects RLS automatically. All rows are denormalized with `network_id` so RLS policies are fast (`WHERE network_id = auth_network_id()`) and Realtime channel filters are cheap (`filter: network_id=eq.{id}`).

### Auth
Email OTP via Supabase Auth (no Twilio/phone required). New shops join via invite link (`/invite/[token]`) — creates their `shops` row atomically via a `SECURITY DEFINER` function that validates the token.

### Rate limiting
Postgres trigger `check_request_rate_limit()` blocks any shop from having >20 open requests simultaneously. The Server Action maps this to a `rate_limit` error key shown as a toast.

### TTL
pg_cron expires requests every 15 min. Client-side `isOpenClientSide()` provides a ±2 min clock-skew buffer as defense-in-depth.

---

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
npx supabase db push # Push migrations to remote
```

---

## Deploy to Vercel

1. Push repo to GitHub
2. Import in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy — Vercel auto-detects Next.js

---

## Inviting a new shop

From within the app (once authenticated), a shop owner can generate an invite link:

```typescript
import { createInvite } from "@/app/actions/invites";
const { data } = await createInvite({ name_hint: "Boutique Molenbeek" });
// Share: https://your-domain.com/fr/invite/{data.token}
```

The invitee signs in with email OTP, then fills in their shop details. The `accept_invite_and_create_shop` RPC validates the token atomically and creates their `shops` row.
