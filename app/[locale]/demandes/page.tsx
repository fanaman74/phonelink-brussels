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
  // role to bypass RLS. Three separate flat queries — avoids PostgREST
  // nested join issues entirely.
  let myReservations: MyReservation[] = [];
  if (myShopId) {
    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // 1. Fetch requests
    const { data: reqRows } = await svc
      .from("requests")
      .select("id, status, created_at, device_id")
      .eq("requesting_shop_id", myShopId)
      .order("created_at", { ascending: false })
      .limit(20);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reqs = (reqRows ?? []) as any[];

    if (reqs.length > 0) {
      const reqIds = reqs.map((r) => r.id as string);
      const deviceIds = [...new Set(reqs.map((r) => r.device_id as string).filter(Boolean))];

      // 2. Fetch responses for those requests
      const { data: respRows } = await svc
        .from("responses")
        .select("request_id, responding_shop_id, price_eur")
        .in("request_id", reqIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resps = (respRows ?? []) as any[];

      // 3. Batch-fetch devices and shops
      const deviceMap: Record<string, { brand: string; model: string; storage_gb: number | null }> = {};
      if (deviceIds.length > 0) {
        const { data: devRows } = await svc.from("devices").select("id, brand, model, storage_gb").in("id", deviceIds);
        (devRows ?? []).forEach((d: { id: string; brand: string; model: string; storage_gb: number | null }) => {
          deviceMap[d.id] = { brand: d.brand, model: d.model, storage_gb: d.storage_gb };
        });
      }

      const shopIds = [...new Set(resps.map((r) => r.responding_shop_id as string).filter(Boolean))];
      const shopMap: Record<string, string> = {};
      if (shopIds.length > 0) {
        const { data: shopRows } = await svc.from("shops").select("id, name").in("id", shopIds);
        (shopRows ?? []).forEach((s: { id: string; name: string }) => { shopMap[s.id] = s.name; });
      }

      // Build response lookup by request_id
      const respByReqId: Record<string, { responding_shop_id: string; price_eur: number | null }> = {};
      resps.forEach((r) => { respByReqId[r.request_id] = r; });

      myReservations = reqs.map((r) => {
        const resp = respByReqId[r.id];
        return {
          id: r.id as string,
          status: r.status as string,
          created_at: r.created_at as string,
          devices: deviceMap[r.device_id] ?? null,
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
