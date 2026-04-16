import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

// ---------------------------------------------------------------------------
// Apple-style home dashboard — server component
// ---------------------------------------------------------------------------

async function getHomeData() {
  const supabase = await createClient();

  const [shopResult, networkResult] = await Promise.all([
    supabase.rpc("auth_shop_id").single(),
    supabase.rpc("auth_network_id").single(),
  ]);

  const shopId = (shopResult.data as string | null) ?? null;
  const networkId = (networkResult.data as string | null) ?? null;

  if (!shopId || !networkId) return null;

  // Fetch shop info
  const { data: shop } = await supabase
    .from("shops")
    .select("name, commune")
    .eq("id", shopId)
    .single() as { data: { name: string; commune: string | null } | null; error: unknown };

  // Fetch open request count in network
  const { count: openRequests } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("network_id", networkId)
    .eq("status", "open");

  // Fetch recovered sales this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: salesThisWeek } = await supabase
    .from("recovered_sales")
    .select("id", { count: "exact", head: true })
    .eq("responding_shop_id", shopId)
    .gte("confirmed_at", weekAgo);

  // Fetch my in-stock count
  const { count: inStockCount } = await supabase
    .from("inventory")
    .select("device_id", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .eq("available", true);

  // Fetch 3 most recent open requests
  const { data: recentRequests } = await supabase
    .from("requests")
    .select("id, status, expires_at, shops(name, commune), devices(brand, model, storage_gb)")
    .eq("network_id", networkId)
    .eq("status", "open")
    .neq("requesting_shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(3);

  return {
    shopName: shop?.name ?? "Ma boutique",
    shopCommune: shop?.commune ?? null,
    openRequests: openRequests ?? 0,
    salesThisWeek: salesThisWeek ?? 0,
    inStockCount: inStockCount ?? 0,
    recentRequests: (recentRequests ?? []) as Array<{
      id: string;
      status: string;
      expires_at: string;
      shops: { name: string; commune: string | null } | null;
      devices: { brand: string; model: string; storage_gb: number | null } | null;
    }>,
  };
}

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function timeUntil(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expirée";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h${m > 0 ? m + "m" : ""} restantes`;
  return `${m}m restantes`;
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let data;
  try {
    data = await getHomeData();
  } catch {
    data = null;
  }

  // If no shop/network (unauthenticated gets caught by SessionGuard already),
  // redirect to demandes as fallback
  if (!data) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f9f9f7]">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f9f9f7]">

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div className="relative bg-brand-500 overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />

        <div className="relative px-5 pt-10 pb-7">
          {/* Logo + settings */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                  <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" />
                </svg>
              </div>
              <span className="text-white/90 font-bold text-sm tracking-tight">PhoneLink</span>
            </div>
            <div className="text-white/40 text-xs font-medium">
              {new Date().toLocaleDateString("fr-BE", { weekday: "short", day: "numeric", month: "short" })}
            </div>
          </div>

          {/* Greeting */}
          <p className="text-white/60 text-sm font-medium mb-0.5">{greetingByHour()}</p>
          <h1 className="text-white text-2xl font-bold leading-tight tracking-tight">
            {data.shopName}
          </h1>
          {data.shopCommune && (
            <p className="text-white/50 text-xs mt-0.5 font-medium">{data.shopCommune}</p>
          )}
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────── */}
      <div className="mx-4 -mt-5 z-10 relative">
        <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {[
              { value: data.openRequests, label: "Demandes", color: "text-brand-500" },
              { value: data.inStockCount, label: "En stock", color: "text-success" },
              { value: data.salesThisWeek, label: "Ventes / sem.", color: "text-accent" },
            ].map(({ value, label, color }) => (
              <div key={label} className="flex flex-col items-center py-4 px-2">
                <p className={`text-2xl font-bold ${color} leading-none`}>{value}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1 text-center leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <div className="px-4 mt-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Actions rapides</p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/${locale}/chercher`}
            className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-4 hover:shadow-card-md transition-shadow active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-brand-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">Chercher</p>
              <p className="text-[11px] text-gray-400 leading-tight">Trouver un appareil</p>
            </div>
          </Link>

          <Link
            href={`/${locale}/stock`}
            className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-4 hover:shadow-card-md transition-shadow active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-success">
                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">Mon stock</p>
              <p className="text-[11px] text-gray-400 leading-tight">Gérer l&apos;inventaire</p>
            </div>
          </Link>

          <Link
            href={`/${locale}/demandes`}
            className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-4 hover:shadow-card-md transition-shadow active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">Demandes</p>
              <p className="text-[11px] text-gray-400 leading-tight">{data.openRequests} en cours</p>
            </div>
          </Link>

          <Link
            href={`/${locale}/carte`}
            className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-4 hover:shadow-card-md transition-shadow active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-orange-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">Carte</p>
              <p className="text-[11px] text-gray-400 leading-tight">Le réseau</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Recent network requests ──────────────────────────────────── */}
      {data.recentRequests.length > 0 && (
        <div className="px-4 mt-5 pb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Demandes du réseau
            </p>
            <Link href={`/${locale}/demandes`} className="text-[11px] font-semibold text-brand-500 hover:text-brand-700">
              Voir tout
            </Link>
          </div>

          <div className="space-y-2.5">
            {data.recentRequests.map((req) => {
              const device = req.devices;
              const shop = req.shops;
              const timeLeft = timeUntil(req.expires_at);
              const isExpiring = new Date(req.expires_at).getTime() - Date.now() < 60 * 60 * 1000;

              return (
                <Link
                  key={req.id}
                  href={`/${locale}/demandes`}
                  className="flex items-center gap-3 bg-white rounded-2xl shadow-card px-4 py-3.5 hover:shadow-card-md transition-shadow active:scale-[0.99]"
                >
                  {/* Dot */}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isExpiring ? "bg-accent" : "bg-brand-200"}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                      {device ? `${device.brand} ${device.model}${device.storage_gb ? ` ${device.storage_gb}Go` : ""}` : "—"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {shop?.name ?? "—"}{shop?.commune ? ` · ${shop.commune}` : ""}
                    </p>
                  </div>

                  {/* Time */}
                  <span className={`text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded-full ${isExpiring ? "text-accent bg-accent-50" : "text-gray-400 bg-gray-50"}`}>
                    {timeLeft}
                  </span>

                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-300 flex-shrink-0">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when no requests */}
      {data.recentRequests.length === 0 && (
        <div className="px-4 mt-5 pb-6">
          <div className="bg-white rounded-2xl shadow-card px-4 py-8 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-brand-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Réseau calme</p>
            <p className="text-xs text-gray-400">Aucune demande active pour l&apos;instant</p>
          </div>
        </div>
      )}
    </div>
  );
}
