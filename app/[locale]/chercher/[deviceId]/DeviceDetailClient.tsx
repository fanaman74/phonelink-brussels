"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createRequest } from "@/app/actions/requests";
import { getDeviceSpecs } from "@/lib/deviceSpecs";
import { getDeviceImageUrl } from "@/lib/deviceImage";
import type { DeviceInfo, ShopStock, StorageVariant } from "./page";

// ---------------------------------------------------------------------------
// Brand colors
// ---------------------------------------------------------------------------

const BRAND_GRADIENT: Record<string, string> = {
  Apple: "from-[#f5f5f7] to-[#e8e8ed]",
  Samsung: "from-blue-50 to-blue-100",
  Google: "from-green-50 to-green-100",
  Xiaomi: "from-orange-50 to-orange-100",
  OnePlus: "from-red-50 to-red-100",
  Sony: "from-gray-100 to-gray-200",
  Motorola: "from-indigo-50 to-indigo-100",
  Nokia: "from-sky-50 to-sky-100",
  Honor: "from-violet-50 to-violet-100",
  Oppo: "from-teal-50 to-teal-100",
  Nothing: "from-zinc-900 to-zinc-800",
  Huawei: "from-red-50 to-red-100",
};

const BRAND_ACCENT: Record<string, string> = {
  Apple: "bg-zinc-900 text-white",
  Samsung: "bg-blue-900 text-white",
  Google: "bg-green-700 text-white",
  Xiaomi: "bg-orange-600 text-white",
  OnePlus: "bg-red-700 text-white",
  Sony: "bg-gray-700 text-white",
  Motorola: "bg-indigo-800 text-white",
  Nokia: "bg-blue-700 text-white",
  Honor: "bg-violet-700 text-white",
  Oppo: "bg-teal-700 text-white",
  Nothing: "bg-white text-zinc-900",
  Huawei: "bg-red-700 text-white",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deviceLabel(device: DeviceInfo): string {
  return device.storage_gb
    ? `${device.brand} ${device.model} ${device.storage_gb} Go`
    : `${device.brand} ${device.model}`;
}

function brandInitials(brand: string): string {
  return brand.slice(0, 2).toUpperCase();
}

function formatStorage(gb: number | null): string {
  if (!gb) return "—";
  if (gb >= 1024) return `${gb / 1024} To`;
  return `${gb} Go`;
}

// ---------------------------------------------------------------------------
// DeviceImage with real photo + SVG fallback
// ---------------------------------------------------------------------------

function DeviceImage({ brand, model }: { brand: string; model: string }) {
  const [failed, setFailed] = useState(false);
  const gradient = BRAND_GRADIENT[brand] ?? "from-gray-100 to-gray-200";
  const isNothing = brand === "Nothing";
  const iconColor = isNothing ? "text-white/30" : "text-gray-300";

  return (
    <div
      className={`w-full flex items-center justify-center bg-gradient-to-b ${gradient} py-10`}
      style={{ minHeight: 280 }}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getDeviceImageUrl(brand, model)}
          alt={`${brand} ${model}`}
          className="h-56 w-auto object-contain drop-shadow-xl"
          onError={() => setFailed(true)}
        />
      ) : (
        <svg
          viewBox="0 0 72 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-28 h-auto ${iconColor}`}
          aria-hidden="true"
        >
          <rect x="3" y="3" width="66" height="122" rx="12" stroke="currentColor" strokeWidth="4" />
          <rect x="22" y="9" width="28" height="6" rx="3" fill="currentColor" opacity="0.4" />
          <circle cx="44" cy="12" r="2.5" fill="currentColor" opacity="0.5" />
          <rect x="9" y="20" width="54" height="86" rx="4" fill="currentColor" opacity="0.06" />
          <path d="M 15 25 Q 20 40 12 60" stroke="currentColor" strokeWidth="1.5" opacity="0.08" strokeLinecap="round" />
          <rect x="28" y="114" width="16" height="4" rx="2" fill="currentColor" opacity="0.4" />
          <rect x="0" y="38" width="3" height="14" rx="1.5" fill="currentColor" opacity="0.3" />
          <rect x="0" y="56" width="3" height="14" rx="1.5" fill="currentColor" opacity="0.3" />
          <rect x="69" y="44" width="3" height="22" rx="1.5" fill="currentColor" opacity="0.3" />
        </svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spec pill
// ---------------------------------------------------------------------------

function SpecPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
        {icon}
      </div>
      <p className="text-[11px] font-medium text-gray-400 leading-tight text-center">{label}</p>
      <p className="text-xs font-bold text-gray-900 leading-tight text-center">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Storage picker chip
// ---------------------------------------------------------------------------

function StorageChip({
  variant,
  active,
  locale,
}: {
  variant: StorageVariant;
  active: boolean;
  locale: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/${locale}/chercher/${variant.id}`)}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 border ${
        active
          ? "bg-brand-500 text-white border-brand-500 shadow-sm"
          : "bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-500"
      }`}
    >
      {formatStorage(variant.storage_gb)}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ShopRow
// ---------------------------------------------------------------------------

function PriceTag({ price }: { price: number | null }) {
  if (price == null) return <span className="text-sm text-gray-300">—</span>;
  return (
    <span className="text-base font-bold text-success">
      {price.toLocaleString("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
    </span>
  );
}

function ShopRow({ row, isLowest }: { row: ShopStock; isLowest: boolean }) {
  if (!row.shops) return null;
  return (
    <li className="flex items-center gap-3 py-3.5 border-b border-gray-50 last:border-0">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.available ? "bg-success" : "bg-gray-200"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{row.shops.name}</p>
        {row.shops.commune && (
          <p className="text-xs text-gray-400 mt-0.5">{row.shops.commune}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 mr-1">
        <PriceTag price={row.price_eur} />
        {isLowest && row.price_eur != null && row.available && (
          <span className="text-[10px] font-bold text-success bg-success-50 px-1.5 py-0.5 rounded-full">
            Meilleur prix
          </span>
        )}
        {row.quantity != null && row.quantity <= 2 && row.available && (
          <span className="text-[10px] font-medium text-accent">
            {row.quantity === 1 ? "Dernier" : `${row.quantity} restants`}
          </span>
        )}
      </div>
      {row.shops.phone && (
        <a
          href={`tel:${row.shops.phone}`}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-brand-50 hover:text-brand-500 hover:border-brand-100 transition-colors"
          aria-label={`Appeler ${row.shops.name}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
          </svg>
        </a>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Spec icons
// ---------------------------------------------------------------------------

const IconDisplay = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
    <rect x="2" y="3" width="16" height="12" rx="2" />
    <path strokeLinecap="round" d="M6.5 17.5h7M10 15v2.5" />
  </svg>
);

const IconCamera = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 4.5H4A1.5 1.5 0 0 0 2.5 6v9A1.5 1.5 0 0 0 4 16.5h12A1.5 1.5 0 0 0 17.5 15V6A1.5 1.5 0 0 0 16 4.5h-2.5l-1.25-2H7.75L6.5 4.5Z" />
    <circle cx="10" cy="10.5" r="2.5" />
  </svg>
);

const IconChip = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
    <rect x="5" y="5" width="10" height="10" rx="1.5" />
    <path strokeLinecap="round" d="M7 2v3M10 2v3M13 2v3M7 15v3M10 15v3M13 15v3M2 7h3M2 10h3M2 13h3M15 7h3M15 10h3M15 13h3" />
  </svg>
);

const IconBattery = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
    <rect x="2" y="6" width="14" height="8" rx="1.5" />
    <path strokeLinecap="round" strokeWidth={2.5} d="M16 8.5v3" />
    <path strokeLinecap="round" d="M6 10h5" />
  </svg>
);

const IconRam = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
    <rect x="2" y="6" width="16" height="8" rx="1.5" />
    <path strokeLinecap="round" d="M6 6V4M10 6V4M14 6V4M6 14v2M10 14v2M14 14v2" />
    <rect x="5" y="8.5" width="2" height="3" rx="0.5" fill="currentColor" stroke="none" />
    <rect x="9" y="8.5" width="2" height="3" rx="0.5" fill="currentColor" stroke="none" />
    <rect x="13" y="8.5" width="2" height="3" rx="0.5" fill="currentColor" stroke="none" />
  </svg>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DeviceDetailClient({
  device,
  shopStock,
  storageVariants,
  locale,
}: {
  device: DeviceInfo;
  shopStock: ShopStock[];
  storageVariants: StorageVariant[];
  locale: string;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const specs = getDeviceSpecs(device.brand, device.model);

  const [modalOpen, setModalOpen] = useState(false);
  const [specsNote, setSpecsNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [specsExpanded, setSpecsExpanded] = useState(false);

  const available = shopStock.filter((r) => r.available);
  const unavailable = shopStock.filter((r) => !r.available);

  const lowestPrice = available.reduce<number | null>((min, row) => {
    if (row.price_eur == null) return min;
    return min == null || row.price_eur < min ? row.price_eur : min;
  }, null);

  const brandAccent = BRAND_ACCENT[device.brand] ?? "bg-brand-500 text-white";
  const hasMultipleVariants = storageVariants.length > 1;

  function handleRequest() {
    startTransition(async () => {
      const result = await createRequest({
        device_id: device.id,
        specs_note: specsNote.trim() || null,
      });

      if (result.error) {
        if (result.error === "rate_limit") toast.error(t("rate_limit"));
        else toast.error(String(result.error));
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

        {/* ── Hero image ────────────────────────────────────────────── */}
        <div className="relative bg-white">
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/70 flex items-center justify-center text-gray-600 hover:bg-white hover:text-brand-500 transition-colors shadow-sm"
            aria-label="Retour"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
          </button>

          <DeviceImage brand={device.brand} model={device.model} />

          {/* Identity block */}
          <div className="px-5 pt-4 pb-5 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{device.brand}</p>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{device.model}</h1>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0 ${brandAccent}`}>
                {brandInitials(device.brand)}
              </div>
            </div>

            {/* Storage picker */}
            {hasMultipleVariants && (
              <div className="flex flex-wrap gap-2 mt-4">
                {storageVariants.map((v) => (
                  <StorageChip key={v.id} variant={v} active={v.id === device.id} locale={locale} />
                ))}
              </div>
            )}

            {/* Availability + price strip */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${available.length > 0 ? "bg-success" : "bg-gray-300"}`} />
                <span className="text-sm font-semibold text-gray-700">
                  {available.length > 0
                    ? `${available.length} boutique${available.length > 1 ? "s" : ""} en stock`
                    : "Hors stock"}
                </span>
              </div>
              {lowestPrice != null && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="text-sm font-bold text-success">
                    À partir de {lowestPrice.toLocaleString("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Key specs strip ───────────────────────────────────────── */}
        {specs && (
          <div className="bg-white border-b border-gray-100 px-4 py-5">
            <div className="flex gap-2 justify-between">
              <SpecPill
                icon={<IconDisplay />}
                label="Écran"
                value={specs.display + (specs.display_hz ? ` · ${specs.display_hz}` : "")}
              />
              <SpecPill icon={<IconCamera />} label="Caméra" value={specs.camera_main} />
              <SpecPill
                icon={<IconChip />}
                label="Puce"
                value={specs.processor
                  .replace("Apple ", "")
                  .replace("Google ", "")
                  .replace("Snapdragon ", "SD ")
                  .replace("Dimensity ", "MT ")}
              />
              <SpecPill icon={<IconRam />} label="RAM" value={`${specs.ram_gb} Go`} />
              <SpecPill icon={<IconBattery />} label="Batterie" value={`${specs.battery_mah} mAh`} />
            </div>

            <button
              onClick={() => setSpecsExpanded((v) => !v)}
              className="w-full mt-4 flex items-center justify-between text-sm font-semibold text-brand-500 hover:text-brand-700 transition-colors"
            >
              <span>{specsExpanded ? "Masquer les specs" : "Toutes les spécifications"}</span>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 transition-transform duration-200 ${specsExpanded ? "rotate-180" : ""}`}
              >
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>

            {specsExpanded && (
              <div className="mt-3 divide-y divide-gray-50 text-sm">
                {[
                  { label: "Écran", value: `${specs.display}${specs.display_hz ? `, ${specs.display_hz}` : ""}` },
                  { label: "Processeur", value: specs.processor },
                  { label: "Mémoire vive", value: `${specs.ram_gb} Go RAM` },
                  { label: "Caméra principale", value: specs.camera_main },
                  { label: "Caméra frontale", value: specs.camera_front },
                  { label: "Batterie", value: `${specs.battery_mah} mAh` },
                  { label: "SIM", value: specs.sim },
                  { label: "Connectivité", value: specs.connectivity.join(", ") },
                  ...(device.storage_gb ? [{ label: "Stockage", value: formatStorage(device.storage_gb) }] : []),
                  { label: "Année", value: String(specs.year) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4 py-2.5">
                    <span className="text-gray-400 font-medium flex-shrink-0">{label}</span>
                    <span className="text-gray-900 font-semibold text-right">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Shop list ─────────────────────────────────────────────── */}
        <div className="flex-1 px-4 py-4 space-y-3">

          {available.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="px-4 py-2.5 bg-success-50 border-b border-success-100/50">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <p className="text-xs font-bold text-success uppercase tracking-wider">En stock ({available.length})</p>
                </div>
              </div>
              <ul className="px-4">
                {available.map((row) => (
                  <ShopRow key={row.shop_id} row={row} isLowest={row.price_eur === lowestPrice} />
                ))}
              </ul>
            </div>
          )}

          {unavailable.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hors stock ({unavailable.length})</p>
              </div>
              <ul className="px-4">
                {unavailable.map((row) => (
                  <ShopRow key={row.shop_id} row={row} isLowest={false} />
                ))}
              </ul>
            </div>
          )}

          {shopStock.length === 0 && (
            <div className="flex flex-col items-center text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 max-w-xs leading-snug">
                Aucune boutique n&apos;a renseigné ce modèle dans le réseau
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

      {/* ── Request modal ─────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="bg-white rounded-t-[28px] w-full p-6 shadow-xl">
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${brandAccent} shadow-sm flex-shrink-0`}>
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
