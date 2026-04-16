"use server";

import { createClient } from "@/lib/supabase/server";
import { classifyError } from "@/lib/supabase/errors";
import { z } from "zod";

const CreateRequestSchema = z.object({
  device_id: z.string().uuid(),
  specs_note: z.string().max(500).nullable().optional(),
});

export async function createRequest(input: z.infer<typeof CreateRequestSchema>) {
  const parsed = CreateRequestSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid_input" as const };

  const supabase = await createClient();

  // network_id and requesting_shop_id populated by trigger
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("requests")
    .insert({
      device_id: parsed.data.device_id,
      specs_note: parsed.data.specs_note ?? null,
    })
    .select("id")
    .single();

  if (error) {
    const key = classifyError(error);
    // Postgres trigger raises rate_limit_exceeded
    if (error.message?.includes("rate_limit_exceeded")) return { error: "rate_limit" as const };
    return { error: key };
  }

  return { data, error: null };
}

export async function getNetworkOpenRequests() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("requests")
    .select(`
      id,
      device_id,
      specs_note,
      status,
      created_at,
      expires_at,
      requesting_shop_id,
      shops!requesting_shop_id (id, name, commune),
      devices (id, brand, model, storage_gb)
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: classifyError(error) };
  return { data, error: null };
}

export async function getMyRequests() {
  const supabase = await createClient();

  // auth_shop_id() resolved server-side via RLS helper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (supabase as any)
    .rpc("auth_shop_id")
    .single();

  if (!shop) return { data: null, error: "not_found" as const };

  const { data, error } = await supabase
    .from("requests")
    .select(`
      id,
      device_id,
      specs_note,
      status,
      created_at,
      expires_at,
      devices (id, brand, model, storage_gb),
      responses (id, responding_shop_id, has_device, price_eur, shops!responding_shop_id(name))
    `)
    .eq("requesting_shop_id", shop)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: classifyError(error) };
  return { data, error: null };
}
