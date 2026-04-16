"use server";

import { createClient } from "@/lib/supabase/server";
import { classifyError, isDuplicate } from "@/lib/supabase/errors";
import { z } from "zod";

const RespondSchema = z.object({
  request_id: z.string().uuid(),
  has_device: z.boolean(),
  price_eur: z.number().min(0).nullable().optional(),
});

export async function respondToRequest(input: z.infer<typeof RespondSchema>) {
  const parsed = RespondSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid_input" as const };

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("responses").insert({
    request_id: parsed.data.request_id,
    has_device: parsed.data.has_device,
    price_eur: parsed.data.has_device ? (parsed.data.price_eur ?? null) : null,
  });

  if (error) {
    // UNIQUE violation → already responded → silently OK
    if (isDuplicate(error)) return { success: true, alreadyResponded: true };
    return { error: classifyError(error) };
  }

  return { success: true };
}

export async function getMyResponsesForRequests(requestIds: string[]) {
  if (requestIds.length === 0) return { data: [], error: null };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("responses")
    .select("request_id, has_device, price_eur")
    .in("request_id", requestIds);

  if (error) return { data: null, error: classifyError(error) };
  return { data, error: null };
}
