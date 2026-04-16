"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { upsertInventory } from "@/app/actions/inventory";
import { DEVICES, displayDevice, type Device } from "@/lib/devices";
import type { InventoryRow } from "./page";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DeviceState = {
  device: Device;
  /** device_id from the DB devices table (null if this device hasn't been seeded) */
  device_id: string | null;
  available: boolean;
  price_eur: number | null;
  /** Current value in the price <input> */
  priceInput: string;
  /** True when priceInput differs from the last-saved price_eur */
  priceDirty: boolean;
  saving: boolean;
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

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50 ${
        checked ? "bg-success" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Device Row ────────────────────────────────────────────────────────────────

function DeviceRow({
  state,
  onToggle,
  onPriceChange,
  onSave,
}: {
  state: DeviceState;
  onToggle: () => void;
  onPriceChange: (val: string) => void;
  onSave: () => void;
}) {
  const t = useTranslations("inventory");
  const label = displayDevice(state.device);

  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-gray-50 last:border-0">
      {/* Device name */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            state.available ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {label}
        </p>
      </div>

      {/* Price input (only when available) */}
      {state.available && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="relative w-24">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
              €
            </span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder={t("price_placeholder")}
              value={state.priceInput}
              onChange={(e) => onPriceChange(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>
          {state.priceDirty && (
            <button
              onClick={onSave}
              disabled={state.saving}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors min-w-[60px]"
            >
              {state.saving ? (
                <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t("save")
              )}
            </button>
          )}
        </div>
      )}

      {/* Toggle */}
      <ToggleSwitch checked={state.available} onChange={onToggle} disabled={state.saving} />
    </div>
  );
}

// ─── Brand Section ─────────────────────────────────────────────────────────────

function BrandSection({
  brand,
  rows,
  onToggle,
  onPriceChange,
  onSave,
}: {
  brand: string;
  rows: DeviceState[];
  onToggle: (key: string) => void;
  onPriceChange: (key: string, val: string) => void;
  onSave: (key: string) => void;
}) {
  return (
    <div>
      {/* Sticky brand header — offset below the main title bar (~52px sticky) */}
      <div className="sticky top-[52px] z-[5] bg-brand-50 border-y border-brand-100 px-4 py-1.5">
        <p className="text-xs font-semibold text-brand uppercase tracking-wider">{brand}</p>
      </div>
      <div className="bg-white">
        {rows.map((state) => {
          const key = deviceKey(state.device);
          return (
            <DeviceRow
              key={key}
              state={state}
              onToggle={() => onToggle(key)}
              onPriceChange={(val) => onPriceChange(key, val)}
              onSave={() => onSave(key)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

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

  // Keep a ref that always reflects the latest state, so async callbacks
  // can read fresh values without stale closures.
  const stateRef = useRef(deviceStates);
  useEffect(() => {
    stateRef.current = deviceStates;
  }, [deviceStates]);

  // Per-device debounce timer refs
  const debounceRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Unique brands from DEVICES catalog
  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const d of DEVICES) set.add(d.brand);
    return Array.from(set);
  }, []);

  // ─── Save a device state to Supabase ────────────────────────────────────────

  const saveDevice = useCallback(async (key: string) => {
    const s = stateRef.current.get(key);
    if (!s) return;

    if (!s.device_id) {
      // Device hasn't been seeded into the DB yet — skip silently
      toast.error(t("empty"));
      return;
    }

    // Mark as saving (optimistic)
    setDeviceStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(key);
      if (cur) next.set(key, { ...cur, saving: true });
      return next;
    });

    const priceVal =
      s.available && s.priceInput.trim() !== "" ? parseFloat(s.priceInput) : null;

    const result = await upsertInventory({
      device_id: s.device_id,
      available: s.available,
      price_eur: priceVal,
    });

    setDeviceStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(key);
      if (!cur) return prev;

      if ("error" in result && result.error) {
        toast.error(t("empty")); // generic fallback; real i18n key would be errors.unknown
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

  // ─── Toggle (debounced 500ms) ────────────────────────────────────────────────

  const handleToggle = useCallback(
    (key: string) => {
      setDeviceStates((prev) => {
        const next = new Map(prev);
        const s = next.get(key);
        if (!s) return prev;
        next.set(key, { ...s, available: !s.available, priceDirty: false });
        return next;
      });

      const existing = debounceRefs.current.get(key);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        saveDevice(key);
      }, 500);
      debounceRefs.current.set(key, timer);
    },
    [saveDevice]
  );

  // ─── Price field change ──────────────────────────────────────────────────────

  const handlePriceChange = useCallback((key: string, val: string) => {
    setDeviceStates((prev) => {
      const next = new Map(prev);
      const s = next.get(key);
      if (!s) return prev;
      const savedStr = s.price_eur != null ? String(s.price_eur) : "";
      next.set(key, { ...s, priceInput: val, priceDirty: val !== savedStr });
      return next;
    });
  }, []);

  // ─── Explicit save button ────────────────────────────────────────────────────

  const handleSave = useCallback(
    (key: string) => {
      // Cancel any pending debounce
      const existing = debounceRefs.current.get(key);
      if (existing) clearTimeout(existing);
      saveDevice(key);
    },
    [saveDevice]
  );

  // Cleanup debounce timers on unmount
  useEffect(() => {
    const timers = debounceRefs.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  // ─── Filter → Sort → Group ───────────────────────────────────────────────────

  const allStates = useMemo(() => Array.from(deviceStates.values()), [deviceStates]);

  const filtered = useMemo(
    () =>
      allStates.filter((s) => {
        const brandMatch = selectedBrand === "all" || s.device.brand === selectedBrand;
        const searchMatch =
          search.trim() === "" ||
          `${s.device.brand} ${s.device.model}`
            .toLowerCase()
            .includes(search.trim().toLowerCase());
        return brandMatch && searchMatch;
      }),
    [allStates, selectedBrand, search]
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        // Available first
        if (a.available !== b.available) return a.available ? -1 : 1;
        // Then alphabetical by display label
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

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">
      {/* Sticky title + controls bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-lg font-bold text-brand">{t("title")}</h1>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="search"
              placeholder={t("search_device")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
            />
          </div>
        </div>

        {/* Brand filter tabs (horizontal scroll) */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          {(["all", ...brands] as const).map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedBrand === brand
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {brand === "all" ? t("all_brands") : brand}
            </button>
          ))}
        </div>
      </div>

      {/* Device list */}
      <div className="pb-4">
        {brandGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-8 h-8 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">{t("empty")}</p>
          </div>
        ) : (
          brandGroups.map(([brand, rows]) => (
            <BrandSection
              key={brand}
              brand={brand}
              rows={rows}
              onToggle={handleToggle}
              onPriceChange={handlePriceChange}
              onSave={handleSave}
            />
          ))
        )}
      </div>
    </div>
  );
}
