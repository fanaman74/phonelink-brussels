import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getHomeData(locale: string) {
  const supabase = await createClient();

  const [shopResult, networkResult] = await Promise.all([
    supabase.rpc("auth_shop_id").single(),
    supabase.rpc("auth_network_id").single(),
  ]);

  const shopId = (shopResult.data as string | null) ?? null;
  const networkId = (networkResult.data as string | null) ?? null;

  const defaults = {
    shopName: "Ma boutique",
    shopCommune: null as string | null,
    openRequests: 0,
    salesThisWeek: 0,
    inStockCount: 0,
    recentRequests: [] as Array<{
      id: string; status: string; expires_at: string;
      shops: { name: string; commune: string | null } | null;
      devices: { brand: string; model: string; storage_gb: number | null } | null;
    }>,
  };

  if (!shopId || !networkId) return defaults;

  const { data: shop } = await supabase
    .from("shops")
    .select("name, commune")
    .eq("id", shopId)
    .single() as { data: { name: string; commune: string | null } | null; error: unknown };

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [openReqResult, salesResult, stockResult, recentResult] = await Promise.all([
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("network_id", networkId).eq("status", "open"),
    supabase.from("recovered_sales").select("id", { count: "exact", head: true }).eq("responding_shop_id", shopId).gte("confirmed_at", weekAgo),
    supabase.from("inventory").select("device_id", { count: "exact", head: true }).eq("shop_id", shopId).eq("available", true),
    supabase.from("requests").select("id, status, expires_at, shops(name, commune), devices(brand, model, storage_gb)").eq("network_id", networkId).eq("status", "open").neq("requesting_shop_id", shopId).order("created_at", { ascending: false }).limit(5),
  ]);

  return {
    shopName: shop?.name ?? "Ma boutique",
    shopCommune: shop?.commune ?? null,
    openRequests: openReqResult.count ?? 0,
    salesThisWeek: salesResult.count ?? 0,
    inStockCount: stockResult.count ?? 0,
    recentRequests: (recentResult.data ?? []) as typeof defaults.recentRequests,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  if (h > 0) return `${h}h${m > 0 ? m + "m" : ""}`;
  return `${m}m`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let data;
  try { data = await getHomeData(locale); } catch { data = null; }

  const d = data ?? {
    shopName: "Ma boutique", shopCommune: null,
    openRequests: 0, salesThisWeek: 0, inStockCount: 0, recentRequests: [],
  };

  const quickActions = [
    { href: `/${locale}/chercher`, label: "Chercher", sub: "Trouver un appareil", bg: "bg-brand-50", iconColor: "text-brand-500", icon: <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /> },
    { href: `/${locale}/stock`, label: "Mon stock", sub: `${d.inStockCount} appareils en stock`, bg: "bg-success-50", iconColor: "text-success", icon: <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /> },
    { href: `/${locale}/demandes`, label: "Demandes", sub: `${d.openRequests} en cours`, bg: "bg-blue-50", iconColor: "text-blue-500", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /> },
    { href: `/${locale}/carte`, label: "Carte", sub: "Réseau de boutiques", bg: "bg-orange-50", iconColor: "text-orange-500", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /> },
    { href: `/${locale}/stats`, label: "Statistiques", sub: `${d.salesThisWeek} ventes cette semaine`, bg: "bg-violet-50", iconColor: "text-violet-500", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f7]">

      {/* ── Cinematic video hero ─────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ height: "520px" }}>
        {/* Background video */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=1280"
        >
          <source src="https://videos.pexels.com/video-files/3130284/3130284-hd_1280_720_25fps.mp4" type="video/mp4" />
          <source src="https://videos.pexels.com/video-files/5624982/5624982-hd_1280_720_25fps.mp4" type="video/mp4" />
        </video>

        {/* Dark gradient overlay — bottom heavier so text is legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-500/95 via-brand-500/50 to-brand-500/20" />

        {/* Top nav bar */}
        <div className="absolute top-0 left-0 right-0 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">PhoneLink Brussels</span>
          </div>
          <p className="text-white/50 text-sm font-medium">
            {new Date().toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-8 pb-10">
          <p className="text-white/60 text-base font-medium mb-1">{greetingByHour()}</p>
          <h1 className="text-white text-4xl font-bold tracking-tight leading-tight mb-2">
            {d.shopName}
            {d.shopCommune && <span className="text-white/60 text-2xl font-medium ml-3">· {d.shopCommune}</span>}
          </h1>
          <p className="text-white/50 text-sm font-medium">
            Réseau de boutiques téléphonie à Bruxelles
          </p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-5 mb-8 mt-8">
          {[
            { value: d.openRequests, label: "Demandes actives", color: "text-brand-500", bg: "bg-brand-50", border: "border-brand-100" },
            { value: d.inStockCount, label: "Appareils en stock", color: "text-success", bg: "bg-success-50", border: "border-success-100" },
            { value: d.salesThisWeek, label: "Ventes récupérées (semaine)", color: "text-accent", bg: "bg-accent-50", border: "border-accent-100" },
          ].map(({ value, label, color, bg, border }) => (
            <div key={label} className={`bg-white rounded-2xl border ${border} shadow-card-md px-7 py-5 flex items-center gap-5`}>
              <p className={`text-5xl font-bold ${color} leading-none tabular-nums`}>{value}</p>
              <p className="text-sm font-semibold text-gray-500 leading-snug max-w-[120px]">{label}</p>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-3 gap-6">

          {/* Left: quick actions (2/3) */}
          <div className="col-span-2 space-y-6">
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Navigation</h2>
              <div className="grid grid-cols-3 gap-4">
                {quickActions.map(({ href, label, sub, bg, iconColor, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex flex-col gap-4 bg-white rounded-2xl border border-gray-100 shadow-card p-5 hover:shadow-card-md hover:border-gray-200 transition-all duration-150 active:scale-[0.99]"
                  >
                    <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`w-5 h-5 ${iconColor}`}>
                        {icon}
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-tight">{sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: live requests (1/3) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Demandes réseau</h2>
              <Link href={`/${locale}/demandes`} className="text-xs font-semibold text-brand-500 hover:text-brand-700">
                Voir tout →
              </Link>
            </div>

            {d.recentRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card px-5 py-8 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-600">Réseau calme</p>
                <p className="text-xs text-gray-400 mt-1">Aucune demande active</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {d.recentRequests.map((req) => {
                  const device = req.devices;
                  const shop = req.shops;
                  const timeLeft = timeUntil(req.expires_at);
                  const isExpiring = new Date(req.expires_at).getTime() - Date.now() < 60 * 60 * 1000;

                  return (
                    <Link
                      key={req.id}
                      href={`/${locale}/demandes`}
                      className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-card px-4 py-3.5 hover:shadow-card-md hover:border-gray-200 transition-all"
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isExpiring ? "bg-accent" : "bg-brand-200"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                          {device ? `${device.brand} ${device.model}${device.storage_gb ? ` ${device.storage_gb}Go` : ""}` : "—"}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {shop?.name ?? "—"}{shop?.commune ? ` · ${shop.commune}` : ""}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isExpiring ? "text-accent bg-accent-50" : "text-gray-400 bg-gray-100"}`}>
                        {timeLeft}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
