"use server";

import { createClient } from "@/lib/supabase/server";
import { classifyError, isDuplicate } from "@/lib/supabase/errors";
import { z } from "zod";

const ConfirmSaleSchema = z.object({
  request_id: z.string().uuid(),
  responding_shop_id: z.string().uuid(),
});

/**
 * Confirm a recovered sale.
 * Called by the requesting shop after a device was sourced via the network.
 * UNIQUE constraint on (request_id, responding_shop_id) prevents double-count.
 */
export async function confirmSale(input: z.infer<typeof ConfirmSaleSchema>) {
  const parsed = ConfirmSaleSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid_input" as const };

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("recovered_sales").insert({
    request_id: parsed.data.request_id,
    responding_shop_id: parsed.data.responding_shop_id,
  });

  if (error) {
    // Double-tap → idempotent, swallow silently
    if (isDuplicate(error)) return { success: true };
    return { error: classifyError(error) };
  }

  return { success: true };
}

export async function getMyStats() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shopId = await (supabase as any).rpc("auth_shop_id").single();
  if (shopId.error || !shopId.data) return { data: null, error: "not_found" as const };

  const myShopId = shopId.data as string;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [requestsSent, requestsReceived, responsesGiven, salesAllTime, salesWeek] =
    await Promise.all([
      // Requests I sent
      supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("requesting_shop_id", myShopId),

      // Requests I received (not my own open ones, but network ones I saw)
      supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .neq("requesting_shop_id", myShopId),

      // Responses I gave
      supabase
        .from("responses")
        .select("id", { count: "exact", head: true })
        .eq("responding_shop_id", myShopId),

      // All-time recovered sales where I was the responding shop
      supabase
        .from("recovered_sales")
        .select("id", { count: "exact", head: true })
        .eq("responding_shop_id", myShopId),

      // This week's recovered sales
      supabase
        .from("recovered_sales")
        .select("id", { count: "exact", head: true })
        .eq("responding_shop_id", myShopId)
        .gte("confirmed_at", weekAgo),
    ]);

  const responseCount = responsesGiven.count ?? 0;
  const receivedCount = requestsReceived.count ?? 0;
  const matchRate = receivedCount > 0 ? Math.round((responseCount / receivedCount) * 100) : 0;

  return {
    data: {
      requests_sent: requestsSent.count ?? 0,
      requests_received: receivedCount,
      responses_given: responseCount,
      sales_all_time: salesAllTime.count ?? 0,
      sales_this_week: salesWeek.count ?? 0,
      match_rate: matchRate,
    },
    error: null,
  };
}

export async function getRecoveredSalesDetail() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recovered_sales")
    .select(`
      id,
      confirmed_at,
      request_id,
      requests (device_id, devices(brand, model, storage_gb), shops!requesting_shop_id(name))
    `)
    .order("confirmed_at", { ascending: false })
    .limit(50);

  if (error) return { data: null, error: classifyError(error) };
  return { data, error: null };
}
