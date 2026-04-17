"use server";

import { createClient } from "@/lib/supabase/server";
import { classifyError } from "@/lib/supabase/errors";
import { z } from "zod";

const UpsertInventorySchema = z.object({
  device_id: z.string().uuid(),
  available: z.boolean(),
  quantity: z.number().int().min(0).nullable().optional(),
  price_eur: z.number().min(0).nullable().optional(),
});

export type UpsertInventoryInput = z.infer<typeof UpsertInventorySchema>;

export async function upsertInventory(input: UpsertInventoryInput) {
  try {
    const parsed = UpsertInventorySchema.safeParse(input);
    if (!parsed.success) {
      console.error("[upsertInventory] invalid input:", parsed.error);
      return { error: "invalid_input" as const };
    }

    const supabase = await createClient();

    // Resolve shop_id for the current user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shopId, error: shopErr } = await (supabase as any).rpc("auth_shop_id") as { data: string | null; error: unknown };
    if (shopErr) console.error("[upsertInventory] auth_shop_id error:", shopErr);
    if (!shopId) {
      console.error("[upsertInventory] no shopId for current user — not authenticated or no shop row");
      return { error: "forbidden" as const };
    }

    // network_id is populated by trigger (set_network_id_from_shop); shop_id is PK so must be provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("inventory").upsert(
      {
        shop_id: shopId,
        device_id: parsed.data.device_id,
        available: parsed.data.available,
        quantity: parsed.data.quantity ?? null,
        price_eur: parsed.data.price_eur ?? null,
      },
      { onConflict: "shop_id,device_id" }
    );

    if (error) {
      console.error("[upsertInventory] upsert error:", error);
      return { error: classifyError(error) };
    }

    return { success: true };
  } catch (e) {
    console.error("[upsertInventory] unexpected exception:", e);
    return { error: "unknown" as const };
  }
}

export async function getMyInventory() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory")
    .select(`
      device_id,
      available,
      quantity,
      price_eur,
      updated_at,
      devices (id, brand, model, storage_gb, is_active)
    `)
    .order("updated_at", { ascending: false });

  if (error) return { data: null, error: classifyError(error) };
  return { data, error: null };
}

export async function getNetworkInventory(deviceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory")
    .select(`
      shop_id,
      available,
      quantity,
      price_eur,
      updated_at,
      shops (id, name, commune, phone)
    `)
    .eq("device_id", deviceId)
    .eq("available", true)
    .order("price_eur", { ascending: true, nullsFirst: false });

  if (error) return { data: null, error: classifyError(error) };
  return { data, error: null };
}
