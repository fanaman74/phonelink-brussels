import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getNetworkOpenRequests } from "@/app/actions/requests";
import { getMyResponsesForRequests } from "@/app/actions/responses";
import DemandesClient from "./DemandesClient";

export type RequestItem = {
  id: string;
  device_id: string;
  specs_note: string | null;
  status: "open" | "matched" | "expired";
  created_at: string;
  expires_at: string;
  requesting_shop_id: string;
  shops: { id: string; name: string; commune: string | null } | null;
  devices: { id: string; brand: string; model: string; storage_gb: number | null } | null;
};

export type MyReservation = {
  id: string;
  status: string;
  created_at: string;
  devices: { brand: string; model: string; storage_gb: number | null } | null;
  shop_name: string | null;
  price_eur: number | null;
};

export type MyResponse = {
  request_id: string;
  has_device: boolean;
  price_eur: number | null;
};

/**
 * Server Component — fetches initial data server-side, then hydrates the
 * client component which manages Realtime updates and interactive UI.
 */
export default async function DemandesPage() {
  const supabase = await createClient();

  const [requestsResult, shopResult, networkResult] = await Promise.all([
    getNetworkOpenRequests(),
    supabase.rpc("auth_shop_id").single(),
    supabase.rpc("auth_network_id").single(),
  ]);

  const requests = (requestsResult.data ?? []) as RequestItem[];
  const myShopId = (shopResult.data as string | null) ?? null;
  const networkId = (networkResult.data as string | null) ?? null;

  // Fetch the current shop's own reservations (all statuses) via service
  // role so RLS doesn't block the nested shop join.
  let myReservations: MyReservation[] = [];
  if (myShopId) {
    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { data: rawReservations } = await svc
      .from("requests")
      .select("id, status, created_at, devices:device_id(brand, model, storage_gb), responses(responding_shop_id, price_eur)")
      .eq("requesting_shop_id", myShopId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (rawReservations && rawReservations.length > 0) {
      // Collect all unique responding_shop_ids
      const shopIds = [...new Set(
        rawReservations.flatMap((r: { responses?: { responding_shop_id: string }[] }) =>
          (r.responses ?? []).map((resp) => resp.responding_shop_id).filter(Boolean)
        )
      )] as string[];

      // Batch-fetch shop names
      const shopMap: Record<string, string> = {};
      if (shopIds.length > 0) {
        const { data: shops } = await svc.from("shops").select("id, name").in("id", shopIds);
        (shops ?? []).forEach((s: { id: string; name: string }) => { shopMap[s.id] = s.name; });
      }

      myReservations = rawReservations.map((r: {
        id: string; status: string; created_at: string;
        devices: { brand: string; model: string; storage_gb: number | null } | null;
        responses?: { responding_shop_id: string; price_eur: number | null }[];
      }) => {
        const resp = r.responses?.[0];
        return {
          id: r.id,
          status: r.status,
          created_at: r.created_at,
          devices: r.devices,
          shop_name: resp?.responding_shop_id ? (shopMap[resp.responding_shop_id] ?? null) : null,
          price_eur: resp?.price_eur ?? null,
        };
      });
    }
  }

  const requestIds = requests.map((r) => r.id);
  const responsesResult = await getMyResponsesForRequests(requestIds);
  const myResponses = (responsesResult.data ?? []) as MyResponse[];

  return (
    <DemandesClient
      initialRequests={requests}
      initialMyResponses={myResponses}
      myShopId={myShopId}
      networkId={networkId}
      myReservations={myReservations}
    />
  );
}
