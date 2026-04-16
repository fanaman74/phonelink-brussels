"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { upsertInventory } from "@/app/actions/inventory";
import { DEVICES, displayDevice, type Device } from "@/lib/devices";
import { getDeviceImageUrl } from "@/lib/deviceImage";
import type { InventoryRow } from "./page";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DeviceState = {
  device: Device;
  device_id: string | null;
  available: boolean;
  price_eur: number | null;
  priceInput: string;
  priceDirty: boolean;
  saving: boolean;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function deviceKey(d: Device): string {
  return `${d.brand}||${d.model}||${d.storage_gb ?? "null"}`;
}

function buildInitialState(dbInventory: InventoryRow[]): Map<string, DeviceState> {
  const byLabel = new Map<string, InventoryRow>();
  for (const row of dbInventory) {
    if (row.devices) {
      const k = `${row.devices.brand}||${row.devices.model}||${row.devices.storage_gb ?? "null"}`;
      byLabel.set(k, row);
    }
  }
  const map = new Map<string, DeviceState>();
  for (const device of DEVICES) {
    const key = deviceKey(device);
    const dbRow = byLabel.get(key);
    map.set(key, {
      device,
      device_id: dbRow?.devices?.id ?? null,
      available: dbRow?.available ?? false,
      price_eur: dbRow?.price_eur ?? null,
      priceInput: dbRow?.price_eur != null ? String(dbRow.price_eur) : "",
      priceDirty: false,
      saving: false,
    });
  }
  return map;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PhoneSilhouette({ brand }: { brand: string }) {
  const color = BRAND_ICON_COLOR[brand] ?? "text-gray-300";
  return (
    <svg viewBox="0 0 48 84" fill="none" className={`w-7 h-auto ${color}`} aria-hidden="true">
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
  if (failed) return <PhoneSilhouette brand={brand} />;
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

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${checked ? "bg-success" : "bg-gray-200"}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function StockCard({
  state,
  onToggle,
  onTap,
}: {
  state: DeviceState;
  onToggle: () => void;
  onTap: () => void;
}) {
  const bg = BRAND_BG[state.device.brand] ?? "from-gray-50 to-gray-100";

  return (
    <button
      onClick={onTap}
      className={`flex flex-col rounded-2xl overflow-hidden bg-white text-left w-full transition-all duration-150 active:scale-[0.96] ${
        state.available
          ? "border border-success/30 shadow-[0_0_0_1.5px_rgba(39,174,96,0.15)]"
          : "border border-gray-100 shadow-card"
      }`}
    >
      {/* Image area */}
      <div
        className={`relative flex items-center justify-center bg-gradient-to-b ${bg} overflow-hidden`}
        style={{ height: "84px" }}
      >
        <DeviceImage brand={state.device.brand} model={state.device.model} />

        {/* Saving spinner */}
        {state.saving && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <svg className="w-4 h-4 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col px-2 pt-1.5 pb-2 flex-1">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate leading-tight">
          {state.device.brand}
        </p>
        <p className={`text-[11px] font-bold leading-tight line-clamp-2 ${state.available ? "text-gray-900" : "text-gray-400"}`}>
          {state.device.model}
        </p>
        {state.device.storage_gb && (
          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
            {state.device.storage_gb}Go
          </p>
        )}

        {/* Price badge */}
        {state.available && state.price_eur != null && (
          <p className="text-[10px] font-bold text-success mt-1 leading-tight">
            {state.price_eur.toLocaleString("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
          </p>
        )}
        {state.available && state.price_eur == null && (
          <p className="text-[10px] text-gray-300 mt-1 leading-tight">Ajouter prix</p>
        )}
      </div>

      {/* Toggle footer */}
      <div className={`flex items-center justify-between px-2 py-2 border-t ${state.available ? "border-success/10 bg-success-50/40" : "border-gray-50"}`}>
        <span className={`text-[9px] font-semibold uppercase tracking-wider ${state.available ? "text-success" : "text-gray-300"}`}>
          {state.available ? "En stock" : "Hors stock"}
        </span>
        <ToggleSwitch checked={state.available} onChange={onToggle} disabled={state.saving} />
      </div>
    </button>
  );
}

function PriceSheet({
  state,
  onClose,
  onSave,
}: {
  state: DeviceState;
  onClose: () => void;
  onSave: (price: string) => void;
}) {
  const [input, setInput] = useState(state.priceInput);
  const bg = BRAND_BG[state.device.brand] ?? "from-gray-50 to-gray-100";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-[28px] w-full p-6 shadow-xl">
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-5">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-b ${bg} overflow-hidden`}>
            <DeviceImage brand={state.device.brand} model={state.device.model} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">{state.device.brand}</p>
            <p className="text-base font-bold text-gray-900 leading-tight">
              {state.device.model}
              {state.device.storage_gb && <span className="text-gray-500 font-medium"> {state.device.storage_gb}Go</span>}
            </p>
          </div>
          <span className="text-xs font-bold text-success bg-success-50 px-2 py-1 rounded-full">En stock</span>
        </div>

        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Prix de vente (€)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="299"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            className="w-full pl-8 pr-4 py-3.5 rounded-xl border border-gray-200 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-gray-50 transition-colors"
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(input)}
            className="flex-1 rounded-xl bg-brand-500 text-white py-3.5 text-sm font-bold hover:bg-brand-700 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  dbInventory: InventoryRow[];
}

export default function StockClient({ dbInventory }: Props) {
  const t = useTranslations("inventory");

  const [deviceStates, setDeviceStates] = useState<Map<string, DeviceState>>(() =>
    buildInitialState(dbInventory)
  );
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [priceSheetKey, setPriceSheetKey] = useState<string | null>(null);

  const stateRef = useRef(deviceStates);
  useEffect(() => { stateRef.current = deviceStates; }, [deviceStates]);

  const debounceRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const d of DEVICES) set.add(d.brand);
    return Array.from(set);
  }, []);

  const saveDevice = useCallback(async (key: string, overridePrice?: string) => {
    const s = stateRef.current.get(key);
    if (!s) return;
    if (!s.device_id) { toast.error(t("empty")); return; }

    setDeviceStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(key);
      if (cur) next.set(key, { ...cur, saving: true });
      return next;
    });

    const priceStr = overridePrice ?? s.priceInput;
    const priceVal = s.available && priceStr.trim() !== "" ? parseFloat(priceStr) : null;

    const result = await upsertInventory({ device_id: s.device_id, available: s.available, price_eur: priceVal });

    setDeviceStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(key);
      if (!cur) return prev;
      if ("error" in result && result.error) {
        toast.error(t("empty"));
        next.set(key, { ...cur, saving: false });
      } else {
        next.set(key, {
          ...cur,
          saving: false,
          price_eur: priceVal,
          priceInput: priceVal != null ? String(priceVal) : "",
          priceDirty: false,
        });
      }
      return next;
    });
  }, [t]);

  const handleToggle = useCallback((key: string) => {
    setDeviceStates((prev) => {
      const next = new Map(prev);
      const s = next.get(key);
      if (!s) return prev;
      next.set(key, { ...s, available: !s.available, priceDirty: false });
      return next;
    });
    const existing = debounceRefs.current.get(key);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => saveDevice(key), 500);
    debounceRefs.current.set(key, timer);
  }, [saveDevice]);

  const handleCardTap = useCallback((key: string) => {
    const s = stateRef.current.get(key);
    if (s?.available) setPriceSheetKey(key);
  }, []);

  const handlePriceSave = useCallback((key: string, priceStr: string) => {
    setDeviceStates((prev) => {
      const next = new Map(prev);
      const s = next.get(key);
      if (!s) return prev;
      next.set(key, { ...s, priceInput: priceStr, priceDirty: true });
      return next;
    });
    setPriceSheetKey(null);
    saveDevice(key, priceStr);
  }, [saveDevice]);

  useEffect(() => {
    const timers = debounceRefs.current;
    return () => { timers.forEach((t) => clearTimeout(t)); };
  }, []);

  const allStates = useMemo(() => Array.from(deviceStates.values()), [deviceStates]);

  const filtered = useMemo(() =>
    allStates.filter((s) => {
      const brandMatch = selectedBrand === "all" || s.device.brand === selectedBrand;
      const searchMatch = search.trim() === "" || `${s.device.brand} ${s.device.model}`.toLowerCase().includes(search.trim().toLowerCase());
      return brandMatch && searchMatch;
    }),
    [allStates, selectedBrand, search]
  );

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      return displayDevice(a.device).localeCompare(displayDevice(b.device));
    }),
    [filtered]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, DeviceState[]>();
    for (const s of sorted) {
      const b = s.device.brand;
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(s);
    }
    return map;
  }, [sorted]);

  const brandGroups = Array.from(grouped.entries());
  const priceSheetState = priceSheetKey ? deviceStates.get(priceSheetKey) : null;

  return (
    <>
      <div className="flex flex-col">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
          <div className="px-4 pt-3.5 pb-2">
            <h1 className="text-lg font-bold text-brand-500">{t("title")}</h1>
          </div>

          <div className="px-4 pb-2">
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="search"
                placeholder={t("search_device")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
            {(["all", ...brands] as const).map((brand) => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedBrand === brand ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {brand === "all" ? t("all_brands") : brand}
              </button>
            ))}
          </div>
        </div>

        {/* Card grid */}
        <div className="px-3 py-4">
          {brandGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">{t("empty")}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {brandGroups.map(([brand, rows]) => (
                <div key={brand}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{brand}</p>
                    <span className="text-xs text-gray-300">({rows.length})</span>
                    {rows.some((r) => r.available) && (
                      <span className="text-[10px] font-bold text-success bg-success-50 px-1.5 py-0.5 rounded-full ml-auto">
                        {rows.filter((r) => r.available).length} en stock
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {rows.map((state) => {
                      const key = deviceKey(state.device);
                      return (
                        <StockCard
                          key={key}
                          state={state}
                          onToggle={() => handleToggle(key)}
                          onTap={() => handleCardTap(key)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price sheet */}
      {priceSheetState && priceSheetKey && (
        <PriceSheet
          state={priceSheetState}
          onClose={() => setPriceSheetKey(null)}
          onSave={(price) => handlePriceSave(priceSheetKey, price)}
        />
      )}
    </>
  );
}
