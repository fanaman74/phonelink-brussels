import { createClient } from "@/lib/supabase/server";
import { getMyInventory } from "@/app/actions/inventory";
import StockClient from "./StockClient";

export type InventoryRow = {
  device_id: string;
  available: boolean;
  quantity: number | null;
  price_eur: number | null;
  updated_at: string;
  devices: {
    id: string;
    brand: string;
    model: string;
    storage_gb: number | null;
    is_active: boolean;
  } | null;
};

/**
 * Server Component — fetches current inventory from Supabase, then passes
 * it to the Client Component for interactive toggle/price editing.
 *
 * We merge the static DEVICES catalog with the DB inventory so every device
 * appears in the list (with available=false as default for unsaved ones).
 *
 * We also fetch all device IDs so cards can navigate to the detail page
 * even for devices the shop hasn't added to inventory yet.
 */
export default async function StockPage() {
  const supabase = await createClient();

  const [inventoryResult, devicesResult] = await Promise.all([
    getMyInventory(),
    supabase.from("devices").select("id, brand, model, storage_gb"),
  ]);

  const dbRows = (inventoryResult.data ?? []) as InventoryRow[];

  // Build a lookup: "brand||model||storage_gb" → device DB id
  const deviceIdMap: Record<string, string> = {};
  for (const d of (devicesResult.data ?? []) as { id: string; brand: string; model: string; storage_gb: number | null }[]) {
    const key = `${d.brand}||${d.model}||${d.storage_gb ?? "null"}`;
    deviceIdMap[key] = d.id;
  }

  return <StockClient dbInventory={dbRows} deviceIdMap={deviceIdMap} />;
}
