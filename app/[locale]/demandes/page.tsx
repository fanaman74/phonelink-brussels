import { createClient } from "@/lib/supabase/server";
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

  const requestIds = requests.map((r) => r.id);
  const responsesResult = await getMyResponsesForRequests(requestIds);
  const myResponses = (responsesResult.data ?? []) as MyResponse[];

  return (
    <DemandesClient
      initialRequests={requests}
      initialMyResponses={myResponses}
      myShopId={myShopId}
      networkId={networkId}
    />
  );
}
