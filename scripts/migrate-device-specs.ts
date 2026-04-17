/**
 * Adds spec columns to the devices table and populates them from lib/deviceSpecs.ts.
 * Run: `bun run migrate:specs`
 *
 * Uses the Supabase Management API to run the ALTER TABLE DDL,
 * then updates all rows with specs data.
 */
import { createClient } from "@supabase/supabase-js";
import { getDeviceSpecs } from "../lib/deviceSpecs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Project ref extracted from the URL
const projectRef = url.replace("https://", "").split(".")[0];

async function runSql(sql: string): Promise<{ error?: string }> {
  if (!accessToken) {
    return { error: "No SUPABASE_ACCESS_TOKEN — cannot run DDL. See instructions below." };
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: text };
  }
  return {};
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  // Step 1: Apply DDL
  console.log("Applying ALTER TABLE migration...");
  const ddl = `
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
  `;

  const ddlResult = await runSql(ddl);
  if (ddlResult.error) {
    if (ddlResult.error.includes("SUPABASE_ACCESS_TOKEN")) {
      console.log("\n⚠️  Cannot run DDL automatically. Please do one of:");
      console.log("   A) Run this SQL in Supabase Dashboard → SQL Editor:");
      console.log(`\n${ddl}`);
      console.log("\n   B) Set SUPABASE_ACCESS_TOKEN in .env.local and re-run.");
      console.log("      Get token: https://supabase.com/dashboard/account/tokens\n");
      console.log("After adding columns, re-run: bun run migrate:specs\n");
    } else {
      console.error("DDL failed:", ddlResult.error);
    }
    // Try to continue anyway in case columns already exist
    console.log("Attempting to populate specs anyway (columns may already exist)...\n");
  } else {
    console.log("✓ Columns added.\n");
  }

  // Step 2: Fetch all devices
  const { data: devices, error: fetchErr } = await supabase
    .from("devices")
    .select("id, brand, model");

  if (fetchErr || !devices) {
    console.error("Failed to fetch devices:", fetchErr);
    process.exit(1);
  }

  console.log(`Found ${devices.length} devices. Populating specs...`);

  let updated = 0;
  let missing = 0;

  for (const device of devices) {
    const specs = getDeviceSpecs(device.brand, device.model);
    if (!specs) {
      missing++;
      continue;
    }

    const { error } = await supabase
      .from("devices")
      .update({
        display: specs.display,
        display_hz: specs.display_hz ?? null,
        camera_main: specs.camera_main,
        camera_front: specs.camera_front,
        processor: specs.processor,
        ram_gb: specs.ram_gb,
        battery_mah: specs.battery_mah,
        sim: specs.sim,
        connectivity: specs.connectivity,
        release_year: specs.year,
      })
      .eq("id", device.id);

    if (error) {
      // Column doesn't exist yet — DDL step needed first
      if (error.code === "42703") {
        console.error("\n✗ Columns not found in DB. Please run the SQL above in Supabase Dashboard first.");
        process.exit(1);
      }
      console.error(`  ✗ ${device.brand} ${device.model}:`, error.message);
    } else {
      process.stdout.write(".");
      updated++;
    }
  }

  console.log(`\n\n✓ Done. Updated: ${updated} | No specs data: ${missing}`);
}

main();
