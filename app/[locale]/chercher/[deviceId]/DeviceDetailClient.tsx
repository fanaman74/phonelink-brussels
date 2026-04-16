"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createRequest } from "@/app/actions/requests";
import type { DeviceInfo, ShopStock } from "./page";

// ---------------------------------------------------------------------------
// Design tokens matching refurbed.be aesthetic
// ---------------------------------------------------------------------------

const BRAND_GRADIENT: Record<string, string> = {
  Apple: "from-slate-100 via-gray-100 to-slate-200",
  Samsung: "from-blue-50 via-blue-50 to-blue-100",
  Google: "from-green-50 via-emerald-50 to-green-100",
  Xiaomi: "from-orange-50 via-orange-50 to-orange-100",
  OnePlus: "from-red-50 via-red-50 to-red-100",
  Sony: "from-gray-100 via-slate-100 to-gray-200",
  Motorola: "from-indigo-50 via-indigo-50 to-indigo-100",
  Nokia: "from-sky-50 via-sky-50 to-sky-100",
  Honor: "from-violet-50 via-violet-50 to-violet-100",
  Oppo: "from-teal-50 via-teal-50 to-teal-100",
};

const BRAND_ICON_COLOR: Record<string, string> = {
  Apple: "text-slate-300",
  Samsung: "text-blue-200",
  Google: "text-green-200",
  Xiaomi: "text-orange-200",
  OnePlus: "text-red-200",
  Sony: "text-gray-300",
  Motorola: "text-indigo-200",
  Nokia: "text-sky-200",
  Honor: "text-violet-200",
  Oppo: "text-teal-200",
};

const BRAND_ACCENT: Record<string, string> = {
  Apple: "bg-slate-800 text-white",
  Samsung: "bg-blue-900 text-white",
  Google: "bg-green-700 text-white",
  Xiaomi: "bg-orange-600 text-white",
  OnePlus: "bg-red-700 text-white",
  Sony: "bg-gray-700 text-white",
  Motorola: "bg-indigo-800 text-white",
  Nokia: "bg-blue-700 text-white",
  Honor: "bg-violet-700 text-white",
  Oppo: "bg-teal-700 text-white",
};

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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PhoneHero({ brand }: { brand: string }) {
  const gradient = BRAND_GRADIENT[brand] ?? "from-gray-100 to-gray-200";
  const iconColor = BRAND_ICON_COLOR[brand] ?? "text-gray-300";

  return (
    <div
      className={`w-full flex items-center justify-center bg-gradient-to-b ${gradient}`}
      style={{ paddingTop: "40px", paddingBottom: "32px" }}
    >
      <svg
        viewBox="0 0 72 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-28 h-auto ${iconColor}`}
        aria-hidden="true"
      >
        {/* Phone body */}
        <rect x="3" y="3" width="66" height="122" rx="12" stroke="currentColor" strokeWidth="4" />
        {/* Dynamic island / notch */}
        <rect x="22" y="9" width="28" height="6" rx="3" fill="currentColor" opacity="0.4" />
        {/* Camera dot */}
        <circle cx="44" cy="12" r="2.5" fill="currentColor" opacity="0.5" />
        {/* Screen */}
        <rect x="9" y="20" width="54" height="86" rx="4" fill="currentColor" opacity="0.06" />
        {/* Screen glare */}
        <path d="M 15 25 Q 20 40 12 60" stroke="currentColor" strokeWidth="1.5" opacity="0.08" strokeLinecap="round" />
        {/* Home indicator */}
        <rect x="28" y="114" width="16" height="4" rx="2" fill="currentColor" opacity="0.4" />
        {/* Side buttons */}
        <rect x="0" y="38" width="3" height="14" rx="1.5" fill="currentColor" opacity="0.3" />
        <rect x="0" y="56" width="3" height="14" rx="1.5" fill="currentColor" opacity="0.3" />
        <rect x="69" y="44" width="3" height="22" rx="1.5" fill="currentColor" opacity="0.3" />
      </svg>
    </div>
  );
}

function PriceTag({ price }: { price: number | null }) {
  if (price == null) {
    return <span className="text-sm text-gray-300">—</span>;
  }
  return (
    <span className="text-base font-bold text-success">
      {price.toLocaleString("fr-BE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      })}
    </span>
  );
}

function ShopRow({ row, isLowest }: { row: ShopStock; isLowest: boolean }) {
  if (!row.shops) return null;

  return (
    <li className="flex items-center gap-3 py-3.5 border-b border-gray-50 last:border-0">
      {/* Availability dot */}
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
          row.available ? "bg-success" : "bg-gray-200"
        }`}
      />

      {/* Shop info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
          {row.shops.name}
        </p>
        {row.shops.commune && (
          <p className="text-xs text-gray-400 mt-0.5">{row.shops.commune}</p>
        )}
      </div>

      {/* Price + badges */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 mr-1">
        <PriceTag price={row.price_eur} />
        {isLowest && row.price_eur != null && row.available && (
          <span className="text-[10px] font-bold text-success bg-success-50 px-1.5 py-0.5 rounded-full leading-tight">
            Meilleur prix
          </span>
        )}
        {row.quantity != null && row.quantity <= 2 && row.available && (
          <span className="text-[10px] font-medium text-accent leading-tight">
            {row.quantity === 1 ? "Dernier" : `${row.quantity} restants`}
          </span>
        )}
      </div>

      {/* Phone call button */}
      {row.shops.phone && (
        <a
          href={`tel:${row.shops.phone}`}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-brand-50 hover:text-brand-500 hover:border-brand-100 transition-colors"
          aria-label={`Appeler ${row.shops.name}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path
              fillRule="evenodd"
              d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z"
              clipRule="evenodd"
            />
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

  const [modalOpen, setModalOpen] = useState(false);
  const [specsNote, setSpecsNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const available = shopStock.filter((r) => r.available);
  const unavailable = shopStock.filter((r) => !r.available);

  const lowestPrice = available.reduce<number | null>((min, row) => {
    if (row.price_eur == null) return min;
    if (min == null) return row.price_eur;
    return row.price_eur < min ? row.price_eur : min;
  }, null);

  const brandAccent = BRAND_ACCENT[device.brand] ?? "bg-brand-500 text-white";

  function handleRequest() {
    startTransition(async () => {
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
      <div className="flex flex-col min-h-screen bg-[#f9f9f7]">

        {/* ── Hero section ──────────────────────────────────────────── */}
        <div className="relative bg-white">
          {/* Back button — floating over hero */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/70 flex items-center justify-center text-gray-600 hover:bg-white hover:text-brand-500 transition-colors shadow-sm"
            aria-label="Retour"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Phone image */}
          <PhoneHero brand={device.brand} />

          {/* Brand + model overlay at bottom of hero */}
          <div className="px-5 pt-4 pb-5 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {device.brand}
                </p>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {device.model}
                </h1>
                {device.storage_gb && (
                  <p className="text-base text-gray-500 font-medium mt-0.5">
                    {device.storage_gb} Go
                  </p>
                )}
              </div>

              {/* Brand badge */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0 ${brandAccent}`}
              >
                {brandInitials(device.brand)}
              </div>
            </div>

            {/* Key stats row */}
            <div className="flex items-center gap-4 mt-4">
              {/* In stock count */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    available.length > 0 ? "bg-success" : "bg-gray-300"
                  }`}
                />
                <span className="text-sm font-semibold text-gray-700">
                  {available.length > 0
                    ? `${available.length} boutique${available.length > 1 ? "s" : ""} en stock`
                    : "Hors stock"}
                </span>
              </div>

              {/* Best price */}
              {lowestPrice != null && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="text-sm font-bold text-success">
                    À partir de{" "}
                    {lowestPrice.toLocaleString("fr-BE", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Shop list ─────────────────────────────────────────────── */}
        <div className="flex-1 px-4 py-4 space-y-3">

          {/* Available */}
          {available.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="px-4 py-2.5 bg-success-50 border-b border-success-100/50">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <p className="text-xs font-bold text-success uppercase tracking-wider">
                    En stock ({available.length})
                  </p>
                </div>
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
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
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
                <svg
                  className="w-7 h-7 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-400 max-w-xs leading-snug">
                Aucune boutique n&apos;a renseigné ce modèle
              </p>
            </div>
          )}
        </div>

        {/* ── Sticky CTA ────────────────────────────────────────────── */}
        <div className="sticky bottom-[60px] px-4 pb-4 pt-3 bg-gradient-to-t from-[#f9f9f7] from-80% to-transparent">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full py-4 rounded-2xl bg-brand-500 text-white font-bold text-[15px] shadow-[0_6px_16px_rgba(30,58,95,0.28)] hover:bg-brand-700 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 opacity-80">
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
            </svg>
            {t("request_blast")}
          </button>
        </div>
      </div>

      {/* ── Request modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="bg-white rounded-t-[28px] w-full p-6 shadow-xl">
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

            {/* Device mini-preview */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${brandAccent} shadow-sm flex-shrink-0`}
              >
                {brandInitials(device.brand)}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{t("confirm_request")}</h2>
                <p className="text-sm text-brand-500 font-medium">{deviceLabel(device)}</p>
              </div>
            </div>

            <textarea
              value={specsNote}
              onChange={(e) => setSpecsNote(e.target.value)}
              placeholder={t("request_note_placeholder")}
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-gray-50 transition-shadow"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleRequest}
                disabled={isPending}
                className="flex-1 rounded-xl bg-brand-500 text-white py-3.5 text-sm font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors"
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
