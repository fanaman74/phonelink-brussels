"use server";

import { createClient } from "@/lib/supabase/server";
import { classifyError } from "@/lib/supabase/errors";
import { z } from "zod";

const AcceptInviteSchema = z.object({
  token: z.string().min(1),
  shop_name: z.string().min(1).max(100),
  owner_name: z.string().min(1).max(100),
  commune: z.string().max(100).optional(),
  language_pref: z.enum(["fr", "en", "nl"]).default("fr"),
});

export async function getInviteByToken(token: string) {
  const supabase = await createClient();

  // pending_invites has no user RLS → call SECURITY DEFINER RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .rpc("get_invite_by_token", { p_token: token })
    .single();

  if (error || !data) return { data: null, error: "not_found" as const };
  return {
    data: data as {
      id: string;
      network_id: string;
      name_hint: string | null;
      expires_at: string;
      accepted_at: string | null;
    },
    error: null,
  };
}

export async function acceptInvite(input: z.infer<typeof AcceptInviteSchema>) {
  const parsed = AcceptInviteSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid_input" as const };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "forbidden" as const };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invite, error: inviteError } = await (supabase as any)
    .rpc("accept_invite_and_create_shop", {
      p_token: parsed.data.token,
      p_user_id: user.id,
      p_shop_name: parsed.data.shop_name,
      p_owner_name: parsed.data.owner_name,
      p_commune: parsed.data.commune ?? null,
      p_language_pref: parsed.data.language_pref,
    })
    .single();

  if (inviteError) {
    if (inviteError.message?.includes("invalid_token")) return { error: "invalid_token" as const };
    return { error: classifyError(inviteError) };
  }

  return { data: invite as { shop_id: string }, error: null };
}

export async function createInvite(input: { phone: string; name_hint?: string }) {
  const supabase = await createClient();

  // pending_invites requires service role — this action should only be called server-side by admins.
  // network_id and invited_by_shop_id are set by trigger from the authenticated user's shop.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pending_invites")
    .insert({
      phone: input.phone,
      name_hint: input.name_hint ?? null,
    })
    .select("token")
    .single();

  if (error) return { error: classifyError(error) };
  return { data: data as { token: string }, error: null };
}
