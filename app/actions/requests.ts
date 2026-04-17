"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { classifyError } from "@/lib/supabase/errors";
import { z } from "zod";
import { redirect } from "next/navigation";

// Service-role client — bypasses RLS for cross-shop writes (responses insert)
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const CreateRequestSchema = z.object({
  device_id: z.string().uuid(),
  specs_note: z.string().max(500).nullable().optional(),
});

export async function createRequest(input: z.infer<typeof CreateRequestSchema>) {
  const parsed = CreateRequestSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid_input" as const };

  const supabase = await createClient();
  // Force session refresh before any authenticated DB call
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "forbidden" as const };

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

const ReserveSchema = z.object({
  device_id: z.string().uuid(),
  responding_shop_id: z.string().uuid(),
  price_eur: z.number().min(0).nullable().optional(),
  locale: z.string().default("fr"),
});

export async function reserveDevice(input: z.infer<typeof ReserveSchema>) {
  const parsed = ReserveSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid_input" as const };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = supabase as any;

  // Force session refresh so auth.uid() is valid in subsequent RPC/DB calls.
  // Without this, an expired JWT means auth.uid() returns null inside Postgres.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "forbidden" as const };

  // Resolve current shop
  const { data: myShopId } = await s.rpc("auth_shop_id");
  if (!myShopId) return { error: "forbidden" as const };

  // Guard: can't reserve from yourself
  if (myShopId === parsed.data.responding_shop_id) {
    return { error: "self_reserve" as const };
  }

  // 1. Create the request — trigger sets requesting_shop_id + network_id
  const { data: req, error: reqErr } = await s
    .from("requests")
    .insert({ device_id: parsed.data.device_id })
    .select("id")
    .single();

  if (reqErr) {
    if (reqErr.message?.includes("rate_limit_exceeded")) return { error: "rate_limit" as const };
    return { error: classifyError(reqErr) };
  }

  // 2. Pre-create the response on behalf of the target shop.
  //    RLS prevents the requesting user from inserting a response for another shop,
  //    so we use the service-role client which bypasses RLS.
  const svc = getServiceClient();
  const { error: respErr } = await svc.from("responses").insert({
    request_id: req.id,
    responding_shop_id: parsed.data.responding_shop_id,
    has_device: true,
    price_eur: parsed.data.price_eur ?? null,
  });

  if (respErr) {
    console.error("[reserveDevice] response insert error:", respErr);
  }

  // 3. Mark request as matched (service role to bypass RLS on update)
  await svc.from("requests").update({ status: "matched" }).eq("id", req.id);

  redirect(`/${parsed.data.locale}/demandes`);
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
