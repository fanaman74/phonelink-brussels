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
    networkShops: [] as Array<{ id: string; name: string; commune: string | null; phone: string | null; owner_name: string | null }>,
    currentShopId: null as string | null,
  };

  if (!shopId || !networkId) return defaults;

  const { data: shop } = await supabase
    .from("shops")
    .select("name, commune")
    .eq("id", shopId)
    .single() as { data: { name: string; commune: string | null } | null; error: unknown };

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [openReqResult, salesResult, stockResult, recentResult, shopsResult] = await Promise.all([
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("network_id", networkId).eq("status", "open"),
    supabase.from("recovered_sales").select("id", { count: "exact", head: true }).eq("responding_shop_id", shopId).gte("confirmed_at", weekAgo),
    supabase.from("inventory").select("device_id", { count: "exact", head: true }).eq("shop_id", shopId).eq("available", true),
    supabase.from("requests").select("id, status, expires_at, shops(name, commune), devices(brand, model, storage_gb)").eq("network_id", networkId).eq("status", "open").neq("requesting_shop_id", shopId).order("created_at", { ascending: false }).limit(5),
    supabase.from("shops").select("id, name, commune, phone, owner_name").eq("network_id", networkId).order("name"),
  ]);

  return {
    shopName: shop?.name ?? "Ma boutique",
    shopCommune: shop?.commune ?? null,
    openRequests: openReqResult.count ?? 0,
    salesThisWeek: salesResult.count ?? 0,
    inStockCount: stockResult.count ?? 0,
    recentRequests: (recentResult.data ?? []) as typeof defaults.recentRequests,
    networkShops: (shopsResult.data ?? []) as typeof defaults.networkShops,
    currentShopId: shopId,
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
    networkShops: [], currentShopId: null,
  };

  const quickActions = [
    { href: `/${locale}/chercher`, label: "Chercher", sub: "Trouver un appareil", bg: "bg-brand-50", iconColor: "text-brand-500", icon: <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /> },
    { href: `/${locale}/stock`, label: "Mon stock", sub: `${d.inStockCount} appareils`, bg: "bg-success-50", iconColor: "text-success", icon: <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /> },
    { href: `/${locale}/demandes`, label: "Demandes", sub: `${d.openRequests} en cours`, bg: "bg-blue-50", iconColor: "text-blue-500", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /> },
    { href: `/${locale}/carte`, label: "Carte", sub: "Réseau de boutiques", bg: "bg-orange-50", iconColor: "text-orange-500", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /> },
    { href: `/${locale}/stats`, label: "Statistiques", sub: `${d.salesThisWeek} ventes récupérées`, bg: "bg-violet-50", iconColor: "text-violet-500", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /> },
    { href: `/${locale}/chercher`, label: "Envoyer une demande", sub: "Alerter le réseau", bg: "bg-rose-50", iconColor: "text-rose-500", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /> },
  ];

  return (
    <div className="min-h-screen pb-6" style={{ background: "#111827" }}>

      {/* ── 1. TOP BAR ──────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: "#1f2937", borderColor: "#374151" }}
      >
        {/* Left: logo + wordmark */}
        <div className="flex items-center">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#1e3a5f" }}
          >
            <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5" aria-hidden="true">
              <rect x="7" y="4" width="11" height="18" rx="2" fill="white" fillOpacity="0.9"/>
              <rect x="9" y="6" width="7" height="11" rx="1" fill="#1e3a5f"/>
              <circle cx="12.5" cy="19.5" r="1" fill="white"/>
              <path d="M20 11 Q24 11 24 16 Q24 21 20 21" stroke="#f97316" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M20 14 Q22 14 22 16 Q22 18 20 18" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <span
            className="ml-2 text-lg text-white"
            style={{ fontFamily: "'Chango', cursive" }}
          >
            PhoneLink
          </span>
        </div>
        {/* Right: shop name */}
        <span className="text-sm" style={{ color: "#9ca3af" }}>{d.shopName}</span>
      </div>

      {/* ── 2. NETWORK STATUS BAR ───────────────────────────────────── */}
      <div
        className="flex items-center px-4 py-2 border-b"
        style={{ background: "rgba(30,58,95,0.3)", borderColor: "rgba(30,58,95,0.5)" }}
      >
        <span
          className="animate-pulse inline-block w-2 h-2 rounded-full mr-2 flex-shrink-0"
          style={{ background: "#22c55e" }}
        />
        <span className="text-xs" style={{ color: "#9ca3af" }}>
          Réseau actif · {d.networkShops.length} boutiques en ligne
        </span>
      </div>

      {/* ── 3. HERO METRIC CARD ─────────────────────────────────────── */}
      <div
        className="mx-4 mt-4 rounded-2xl border-t-4 p-6"
        style={{ background: "#1f2937", borderTopColor: "#f97316" }}
      >
        <p
          style={{
            fontFamily: "'Chango', cursive",
            fontSize: "96px",
            lineHeight: 1,
            color: "#f97316",
            textShadow: "0 0 24px rgba(249,115,22,0.5)",
          }}
        >
          {d.openRequests}
        </p>
        <p className="text-white text-lg font-semibold mt-1">demandes actives</p>
        <p className="text-sm mt-0.5" style={{ color: "#9ca3af" }}>dans le réseau</p>
      </div>

      {/* ── 4. TWO SECONDARY METRIC CARDS ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mx-4 mt-3">
        {/* Stock */}
        <div
          className="rounded-2xl border p-4"
          style={{ background: "#1f2937", borderColor: "#374151" }}
        >
          <p
            style={{
              fontFamily: "'Chango', cursive",
              fontSize: "40px",
              lineHeight: 1,
              color: "white",
            }}
          >
            {d.inStockCount}
          </p>
          <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>appareils en stock</p>
        </div>
        {/* Sales */}
        <div
          className="rounded-2xl border p-4"
          style={{ background: "#1f2937", borderColor: "#374151" }}
        >
          <p
            style={{
              fontFamily: "'Chango', cursive",
              fontSize: "40px",
              lineHeight: 1,
              color: "#f97316",
            }}
          >
            {d.salesThisWeek}
          </p>
          <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>ventes récupérées</p>
        </div>
      </div>

      {/* ── 5. QUICK STATS STRIP ────────────────────────────────────── */}
      <div
        className="flex gap-4 mx-4 mt-3 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {[
          { icon: "◉", label: `${d.networkShops.length} boutiques` },
          { icon: "⟳", label: "Réseau actif" },
          { icon: "📍", label: "Bruxelles" },
        ].map(({ icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap flex-shrink-0"
            style={{ color: "#9ca3af" }}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </span>
        ))}
      </div>

      {/* ── 6. RECENT REQUESTS SECTION ──────────────────────────────── */}
      <div className="mx-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#9ca3af" }}
          >
            DEMANDES RÉSEAU
          </h2>
          <Link
            href={`/${locale}/demandes`}
            className="text-xs"
            style={{ color: "#f97316" }}
          >
            Voir tout →
          </Link>
        </div>

        {d.recentRequests.length === 0 ? (
          <div
            className="rounded-xl px-4 py-6 flex items-center justify-center"
            style={{ background: "#1f2937", border: "1px solid #374151" }}
          >
            <p className="text-sm" style={{ color: "#9ca3af" }}>Réseau calme</p>
          </div>
        ) : (
          <div>
            {d.recentRequests.map((req, idx) => {
              const device = req.devices;
              const shop = req.shops;
              const timeLeft = timeUntil(req.expires_at);
              const isUrgent = idx === 0 || new Date(req.expires_at).getTime() - Date.now() < 60 * 60 * 1000;

              return (
                <Link
                  key={req.id}
                  href={`/${locale}/demandes`}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 mb-2 border-l-4"
                  style={{
                    background: "#1f2937",
                    borderLeftColor: isUrgent ? "#f97316" : "#374151",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: isUrgent ? "#f97316" : "#6b7280" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate leading-tight">
                      {device
                        ? `${device.brand} ${device.model}${device.storage_gb ? ` ${device.storage_gb}Go` : ""}`
                        : "—"}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "#9ca3af" }}>
                      {shop?.name ?? "—"}{shop?.commune ? ` · ${shop.commune}` : ""}
                    </p>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "#374151", color: "#9ca3af" }}
                  >
                    {timeLeft}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 7. NETWORK SHOPS ────────────────────────────────────────── */}
      {d.networkShops.length > 0 && (
        <div className="mx-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#9ca3af" }}
            >
              BOUTIQUES DU RÉSEAU
            </h2>
            <span className="text-xs" style={{ color: "#9ca3af" }}>
              {d.networkShops.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {d.networkShops.map((s) => {
              const isMe = s.id === d.currentShopId;
              return (
                <Link
                  key={s.id}
                  href={`/${locale}/boutiques/${s.id}`}
                  className="rounded-xl border px-3 py-3 flex items-center gap-3"
                  style={{ background: "#1f2937", borderColor: "#374151" }}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                    style={{ background: "#1e3a5f" }}
                  >
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white truncate leading-tight">
                        {s.name}
                      </p>
                      {isMe && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "#f97316", color: "black" }}
                        >
                          Vous
                        </span>
                      )}
                    </div>
                    {s.commune && (
                      <p className="text-xs truncate mt-0.5" style={{ color: "#9ca3af" }}>
                        {s.commune}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
