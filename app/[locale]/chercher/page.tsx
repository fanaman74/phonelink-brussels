"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { DEVICES, type Device } from "@/lib/devices";
import { getDeviceImageUrl } from "@/lib/deviceImage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModelGroup = {
  brand: string;
  model: string;
  variants: Device[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BRANDS = [...new Set(DEVICES.map((d) => d.brand))];

const BRAND_BG: Record<string, string> = {
  Apple: "from-slate-100 to-slate-200",
  Samsung: "from-blue-50 to-blue-100",
  Google: "from-green-50 to-emerald-100",
  Xiaomi: "from-orange-50 to-orange-100",
  OnePlus: "from-red-50 to-red-100",
  Sony: "from-gray-100 to-gray-200",
  Motorola: "from-indigo-50 to-indigo-100",
  Nokia: "from-sky-50 to-sky-100",
  Honor: "from-violet-50 to-violet-100",
  Oppo: "from-teal-50 to-teal-100",
};

const BRAND_ICON_COLOR: Record<string, string> = {
  Apple: "text-slate-400",
  Samsung: "text-blue-300",
  Google: "text-green-300",
  Xiaomi: "text-orange-300",
  OnePlus: "text-red-300",
  Sony: "text-gray-400",
  Motorola: "text-indigo-300",
  Nokia: "text-sky-300",
  Honor: "text-violet-300",
  Oppo: "text-teal-300",
};

const BRAND_LABEL_COLOR: Record<string, string> = {
  Apple: "text-slate-500",
  Samsung: "text-blue-600",
  Google: "text-green-600",
  Xiaomi: "text-orange-600",
  OnePlus: "text-red-600",
  Sony: "text-gray-500",
  Motorola: "text-indigo-600",
  Nokia: "text-sky-600",
  Honor: "text-violet-600",
  Oppo: "text-teal-600",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getModelGroups(query: string, brandFilter: string): ModelGroup[] {
  const q = query.trim().toLowerCase();
  const map = new Map<string, ModelGroup>();

  for (const device of DEVICES) {
    if (brandFilter && device.brand !== brandFilter) continue;
    if (
      q &&
      !`${device.brand} ${device.model} ${device.storage_gb ?? ""}Go`
        .toLowerCase()
        .includes(q)
    )
      continue;

    const key = `${device.brand}__${device.model}`;
    if (!map.has(key)) {
      map.set(key, { brand: device.brand, model: device.model, variants: [] });
    }
    map.get(key)!.variants.push(device);
  }

  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PhoneSilhouette({ brand }: { brand: string }) {
  const color = BRAND_ICON_COLOR[brand] ?? "text-gray-300";
  return (
    <svg viewBox="0 0 48 84" fill="none" className={`w-8 h-auto ${color}`} aria-hidden="true">
      <rect x="2" y="2" width="44" height="80" rx="8" stroke="currentColor" strokeWidth="3" />
      <rect x="14" y="6.5" width="20" height="4" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="7" y="15" width="34" height="52" rx="3" fill="currentColor" opacity="0.08" />
      <rect x="18" y="73" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function DeviceImage({ brand, model }: { brand: string; model: string }) {
  const [failed, setFailed] = useState(false);
  const src = getDeviceImageUrl(brand, model);

  if (failed) {
    return <PhoneSilhouette brand={brand} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${brand} ${model}`}
      onError={() => setFailed(true)}
      className="w-full h-full object-contain"
      loading="lazy"
    />
  );
}

function DeviceCard({
  group,
  onSelect,
}: {
  group: ModelGroup;
  onSelect: (group: ModelGroup) => void;
}) {
  const bg = BRAND_BG[group.brand] ?? "from-gray-50 to-gray-100";
  const labelColor = BRAND_LABEL_COLOR[group.brand] ?? "text-gray-500";

  return (
    <button
      onClick={() => onSelect(group)}
      className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-card hover:shadow-card-md hover:border-gray-200 active:scale-[0.96] transition-all duration-150 text-left w-full"
    >
      {/* Image area */}
      <div
        className={`relative flex items-center justify-center bg-gradient-to-b ${bg} overflow-hidden`}
        style={{ height: "90px" }}
      >
        <DeviceImage brand={group.brand} model={group.model} />
      </div>

      {/* Info area */}
      <div className="flex flex-col px-2 py-2 gap-0.5">
        <p className={`text-[9px] font-bold uppercase tracking-wider leading-tight truncate ${labelColor}`}>
          {group.brand}
        </p>
        <p className="text-[11px] font-bold text-gray-900 leading-tight line-clamp-2">
          {group.model}
        </p>
        {group.variants.length === 1 && group.variants[0].storage_gb && (
          <p className="text-[10px] text-gray-400 leading-tight">
            {group.variants[0].storage_gb}Go
          </p>
        )}
        {group.variants.length > 1 && (
          <p className="text-[10px] text-gray-400 leading-tight">
            {group.variants.length} options
          </p>
        )}
      </div>
    </button>
  );
}

function StorageSheet({
  group,
  onClose,
  onPick,
  loading,
}: {
  group: ModelGroup;
  onClose: () => void;
  onPick: (device: Device) => void;
  loading: boolean;
}) {
  const bg = BRAND_BG[group.brand] ?? "from-gray-50 to-gray-100";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-[28px] w-full p-6 shadow-xl">
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-5">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-b ${bg} overflow-hidden`}>
            <DeviceImage brand={group.brand} model={group.model} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{group.brand}</p>
            <p className="text-base font-bold text-gray-900">{group.model}</p>
          </div>
        </div>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Choisir la capacité
        </p>

        <div className="grid grid-cols-3 gap-2">
          {group.variants.map((v) => (
            <button
              key={v.storage_gb ?? "na"}
              onClick={() => onPick(v)}
              disabled={loading}
              className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-gray-200 hover:border-brand-500 hover:bg-brand-50 active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
            >
              <span className="text-sm font-bold text-gray-900">
                {v.storage_gb != null ? `${v.storage_gb}` : "—"}
              </span>
              <span className="text-[11px] text-gray-400">Go</span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-400">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Chargement…
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CherchePage() {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [sheetGroup, setSheetGroup] = useState<ModelGroup | null>(null);
  const [isPending, startTransition] = useTransition();

  const groups = useMemo(() => getModelGroups(query, brandFilter), [query, brandFilter]);

  const showSections = !query.trim() && !brandFilter;
  const brandSections = useMemo(() => {
    if (!showSections) return null;
    const map = new Map<string, ModelGroup[]>();
    for (const g of groups) {
      if (!map.has(g.brand)) map.set(g.brand, []);
      map.get(g.brand)!.push(g);
    }
    return map;
  }, [groups, showSections]);

  const resolveDeviceId = useCallback(async (device: Device): Promise<string | null> => {
    const supabase = getSupabaseBrowserClient();
    const q = supabase.from("devices").select("id").eq("brand", device.brand).eq("model", device.model);
    const finalQ = device.storage_gb != null ? q.eq("storage_gb", device.storage_gb) : q.is("storage_gb", null);
    const { data } = await finalQ.single() as { data: { id: string } | null; error: unknown };
    return data?.id ?? null;
  }, []);

  const handleCardSelect = useCallback((group: ModelGroup) => {
    if (group.variants.length === 1) {
      setSheetGroup(group);
      startTransition(async () => {
        const id = await resolveDeviceId(group.variants[0]);
        if (id) router.push(`/${locale}/chercher/${id}`);
        else setSheetGroup(null);
      });
    } else {
      setSheetGroup(group);
    }
  }, [resolveDeviceId, locale, router]);

  const handleVariantPick = useCallback((device: Device) => {
    startTransition(async () => {
      const id = await resolveDeviceId(device);
      if (id) router.push(`/${locale}/chercher/${id}`);
      else setSheetGroup(null);
    });
  }, [resolveDeviceId, locale, router]);

  return (
    <>
      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="px-4 pt-4 pb-2.5">
          <h1 className="text-lg font-bold text-brand-500 mb-2.5">{t("title")}</h1>
          <div className="relative">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (e.target.value) setBrandFilter(""); }}
              placeholder={t("placeholder")}
              className="w-full rounded-xl border border-gray-200 pl-10 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-gray-50 focus:bg-white transition-colors"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Brand filter chips */}
        {!query && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
            <button onClick={() => setBrandFilter("")} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!brandFilter ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              Tous
            </button>
            {BRANDS.map((brand) => (
              <button key={brand} onClick={() => setBrandFilter(b => b === brand ? "" : brand)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${brandFilter === brand ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {brand}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="px-3 py-4">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">{t("no_results")}</p>
          </div>
        ) : showSections && brandSections ? (
          <div className="space-y-6">
            {Array.from(brandSections.entries()).map(([brand, brandGroups]) => (
              <div key={brand}>
                <div className="flex items-center gap-2 mb-2.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{brand}</p>
                  <span className="text-xs text-gray-300 font-medium">({brandGroups.length})</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {brandGroups.map((group) => (
                    <DeviceCard key={`${group.brand}__${group.model}`} group={group} onSelect={handleCardSelect} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {groups.map((group) => (
              <DeviceCard key={`${group.brand}__${group.model}`} group={group} onSelect={handleCardSelect} />
            ))}
          </div>
        )}

        {(query || brandFilter) && groups.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            {groups.length} modèle{groups.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ── Storage picker sheet ───────────────────────────────────────── */}
      {sheetGroup && sheetGroup.variants.length > 1 && (
        <StorageSheet group={sheetGroup} onClose={() => setSheetGroup(null)} onPick={handleVariantPick} loading={isPending} />
      )}

      {/* ── Loading overlay ────────────────────────────────────────────── */}
      {isPending && sheetGroup && sheetGroup.variants.length === 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <svg className="w-6 h-6 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
    </>
  );
}
