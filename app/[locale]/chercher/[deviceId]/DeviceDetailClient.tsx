"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { createRequest } from "@/app/actions/requests";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DeviceInfo, ShopStock } from "./page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deviceLabel(device: DeviceInfo): string {
  return device.storage_gb
    ? `${device.brand} ${device.model} ${device.storage_gb}Go`
    : `${device.brand} ${device.model}`;
}

function brandInitials(brand: string): string {
  return brand.slice(0, 2).toUpperCase();
}

function brandColor(brand: string): string {
  const colors: Record<string, string> = {
    Apple: "bg-gray-900 text-white",
    Samsung: "bg-blue-900 text-white",
    Google: "bg-green-700 text-white",
    Xiaomi: "bg-orange-600 text-white",
    OnePlus: "bg-red-700 text-white",
    Sony: "bg-gray-800 text-white",
    Motorola: "bg-indigo-800 text-white",
    Nokia: "bg-blue-700 text-white",
  };
  return colors[brand] ?? "bg-brand-500 text-white";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}j`;
  if (hours > 0) return `${hours}h`;
  return "maintenant";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PriceTag({ price }: { price: number | null }) {
  if (price == null) {
    return <span className="text-sm text-gray-400">—</span>;
  }
  return (
    <span className="text-base font-bold text-gray-900">
      {price.toLocaleString("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
    </span>
  );
}

function ShopRow({ row, isLowest }: { row: ShopStock; isLowest: boolean }) {
  if (!row.shops) return null;
  return (
    <li className="flex items-center gap-3 py-3.5 border-b border-gray-50 last:border-0">
      {/* Availability dot */}
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          row.available ? "bg-success" : "bg-gray-300"
        }`}
      />

      {/* Shop info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{row.shops.name}</p>
        {row.shops.commune && (
          <p className="text-xs text-gray-500">{row.shops.commune}</p>
        )}
      </div>

      {/* Price + best tag */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <PriceTag price={row.price_eur} />
        {isLowest && row.price_eur != null && row.available && (
          <span className="text-[10px] font-semibold text-success-600 bg-success-50 px-1.5 py-0.5 rounded-full">
            Meilleur prix
          </span>
        )}
      </div>

      {/* Phone link */}
      {row.shops.phone && (
        <a
          href={`tel:${row.shops.phone}`}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 hover:bg-brand-100 transition-colors"
          aria-label={`Appeler ${row.shops.name}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
          </svg>
        </a>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function DeviceDetailClient({
  device,
  shopStock,
}: {
  device: DeviceInfo;
  shopStock: ShopStock[];
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const locale = useLocale();

  const [modalOpen, setModalOpen] = useState(false);
  const [specsNote, setSpecsNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const available = shopStock.filter((r) => r.available);
  const unavailable = shopStock.filter((r) => !r.available);

  // Find lowest available price
  const lowestPrice = available.reduce<number | null>((min, row) => {
    if (row.price_eur == null) return min;
    if (min == null) return row.price_eur;
    return row.price_eur < min ? row.price_eur : min;
  }, null);

  function handleRequest() {
    startTransition(async () => {
      // Resolve device UUID — we already have it from props
      const result = await createRequest({
        device_id: device.id,
        specs_note: specsNote.trim() || null,
      });

      if (result.error) {
        if (result.error === "rate_limit") {
          toast.error(t("rate_limit"));
        } else {
          toast.error(String(result.error));
        }
        return;
      }

      toast.success(t("request_sent"));
      setModalOpen(false);
      setSpecsNote("");
    });
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Hero header */}
        <div className="bg-white border-b border-gray-100">
          {/* Back button */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-brand-500 font-medium hover:text-brand-700 transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
              </svg>
              Retour
            </button>
          </div>

          {/* Device identity */}
          <div className="px-4 pb-6 pt-2 flex items-center gap-4">
            {/* Brand logo placeholder */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shadow-card flex-shrink-0 ${brandColor(device.brand)}`}
            >
              {brandInitials(device.brand)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                {device.brand}
              </p>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {device.model}
                {device.storage_gb && (
                  <span className="text-gray-500 font-medium"> {device.storage_gb}Go</span>
                )}
              </h1>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex border-t border-gray-100">
            <div className="flex-1 px-4 py-3 text-center border-r border-gray-100">
              <p className="text-2xl font-bold text-success">{available.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">En stock</p>
            </div>
            <div className="flex-1 px-4 py-3 text-center border-r border-gray-100">
              <p className="text-2xl font-bold text-gray-900">
                {lowestPrice != null
                  ? lowestPrice.toLocaleString("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
                  : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Meilleur prix</p>
            </div>
            <div className="flex-1 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{shopStock.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Boutiques</p>
            </div>
          </div>
        </div>

        {/* Stock list */}
        <div className="flex-1 px-4 py-4 space-y-4">
          {/* Available */}
          {available.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-50 bg-success-50">
                <p className="text-xs font-bold text-success uppercase tracking-wider">
                  Disponible ({available.length})
                </p>
              </div>
              <ul className="px-4">
                {available.map((row) => (
                  <ShopRow
                    key={row.shop_id}
                    row={row}
                    isLowest={row.price_eur === lowestPrice}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Unavailable */}
          {unavailable.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-50 bg-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Hors stock ({unavailable.length})
                </p>
              </div>
              <ul className="px-4">
                {unavailable.map((row) => (
                  <ShopRow key={row.shop_id} row={row} isLowest={false} />
                ))}
              </ul>
            </div>
          )}

          {/* Empty state */}
          {shopStock.length === 0 && (
            <div className="flex flex-col items-center text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Aucune boutique n&apos;a renseigné ce modèle</p>
            </div>
          )}
        </div>

        {/* CTA — sticky bottom */}
        <div className="sticky bottom-[60px] px-4 pb-4 pt-2 bg-gradient-to-t from-gray-50 from-80% to-transparent">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full py-3.5 rounded-xl bg-brand-500 text-white font-semibold text-base shadow-[0_4px_12px_rgba(30,58,95,0.3)] hover:bg-brand-700 active:scale-[0.98] transition-all duration-150"
          >
            {t("request_blast")}
          </button>
        </div>
      </div>

      {/* Request modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="bg-white rounded-t-[28px] w-full p-6 shadow-xl">
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">{t("confirm_request")}</h2>
            <p className="text-sm font-medium text-brand-500 mb-4">{deviceLabel(device)}</p>

            <textarea
              value={specsNote}
              onChange={(e) => setSpecsNote(e.target.value)}
              placeholder={t("request_note_placeholder")}
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand bg-gray-50 transition-shadow"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleRequest}
                disabled={isPending}
                className="flex-1 rounded-xl bg-brand-500 text-white py-3 text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "…" : t("request_blast")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
