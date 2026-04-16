/**
 * Seeds the devices table from lib/devices.ts.
 * Run: `bun run seed:devices` after `supabase db reset`.
 *
 * Idempotent: uses ON CONFLICT (brand, model, storage_gb) DO NOTHING.
 */
import { createClient } from "@supabase/supabase-js";
import { DEVICES } from "../lib/devices";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  console.log(`Seeding ${DEVICES.length} devices...`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("devices")
    .upsert(DEVICES, { onConflict: "brand,model,storage_gb", ignoreDuplicates: true });
  if (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
  console.log(`Seeded. Rows returned: ${(data as unknown[])?.length ?? 0}`);
}

main();
