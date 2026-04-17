import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReserveButton from "./ReserveButton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InventoryRow {
  device_id: string;
  quantity: number | null;
  price_eur: number | null;
  updated_at: string;
  devices: {
    id: string;
    brand: string;
    model: string;
    storage_gb: number | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string; shopId: string }>;
}) {
  const { locale, shopId } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = supabase as any;

  // Resolve current user's shop
  const { data: myShopId } = await s.rpc("auth_shop_id");

  // Fetch target shop
  const { data: shop, error: shopErr } = await supabase
    .from("shops")
    .select("id, name, commune, phone, owner_name")
    .eq("id", shopId)
    .single() as { data: { id: string; name: string; commune: string | null; phone: string | null; owner_name: string | null } | null; error: unknown };

  if (shopErr || !shop) notFound();

  const isMe = myShopId === shopId;

  // Fetch their available inventory
  const { data: inventory } = await supabase
    .from("inventory")
    .select("device_id, quantity, price_eur, updated_at, devices(id, brand, model, storage_gb)")
    .eq("shop_id", shopId)
    .eq("available", true)
    .order("price_eur", { ascending: true, nullsFirst: false }) as {
    data: InventoryRow[] | null;
  };

  const items = inventory ?? [];

  // Group by brand for display
  const grouped = items.reduce<Record<string, InventoryRow[]>>((acc, row) => {
    const brand = row.devices?.brand ?? "Autre";
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(row);
    return acc;
  }, {});

  const brands = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-[#f9f9f7]">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link
            href={`/${locale}`}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate leading-tight">{shop.name}</h1>
            {shop.commune && <p className="text-xs text-gray-400">{shop.commune}</p>}
          </div>
          {shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-semibold hover:bg-brand-500 hover:text-white transition-colors flex-shrink-0"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
              </svg>
              Appeler
            </a>
          )}
        </div>
      </div>

      {/* ── Shop meta ───────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-2">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card px-5 py-4 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${isMe ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600"}`}>
            {shop.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900">{shop.name}</p>
              {isMe && (
                <span className="text-[10px] font-bold bg-brand-500 text-white px-1.5 py-0.5 rounded-full">Vous</span>
              )}
            </div>
            {shop.owner_name && <p className="text-sm text-gray-500">{shop.owner_name}</p>}
            {shop.commune && <p className="text-xs text-gray-400">{shop.commune} · Bruxelles</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-brand-500">{items.length}</p>
            <p className="text-xs text-gray-400 leading-tight">en stock</p>
          </div>
        </div>
      </div>

      {/* ── Inventory ───────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card px-5 py-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600">Stock vide</p>
            <p className="text-xs text-gray-400 mt-1">Cette boutique n&apos;a rien en stock pour l&apos;instant.</p>
          </div>
        ) : (
          brands.map((brand) => (
            <div key={brand}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{brand}</h2>
              <div className="space-y-2.5">
                {grouped[brand].map((row) => {
                  const dev = row.devices;
                  if (!dev) return null;
                  const label = `${dev.brand} ${dev.model}${dev.storage_gb ? ` ${dev.storage_gb} Go` : ""}`;
                  return (
                    <div
                      key={row.device_id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-card px-5 py-4 flex items-center gap-4"
                    >
                      {/* Device icon */}
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 15.75h3" />
                        </svg>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 leading-tight truncate">{label}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {row.price_eur != null ? (
                            <span className="text-sm font-bold text-brand-500">{row.price_eur.toFixed(0)} €</span>
                          ) : (
                            <span className="text-xs text-gray-400">Prix non renseigné</span>
                          )}
                          {row.quantity != null && (
                            <span className="text-xs text-gray-400">· {row.quantity} unité{row.quantity > 1 ? "s" : ""}</span>
                          )}
                        </div>
                      </div>

                      {/* Reserve */}
                      <div className="flex-shrink-0 w-32">
                        {isMe ? (
                          <span className="text-xs text-gray-400 italic">Votre stock</span>
                        ) : (
                          <ReserveButton
                            deviceId={dev.id}
                            respondingShopId={shop.id}
                            priceEur={row.price_eur}
                            label="Réserver"
                            locale={locale}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
