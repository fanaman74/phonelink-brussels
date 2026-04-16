import { getMyInventory } from "@/app/actions/inventory";
import { DEVICES } from "@/lib/devices";
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
 */
export default async function StockPage() {
  const result = await getMyInventory();
  const dbRows = (result.data ?? []) as InventoryRow[];

  return <StockClient dbInventory={dbRows} />;
}
