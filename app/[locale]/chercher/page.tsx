"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DEVICES, displayDevice, type Device } from "@/lib/devices";
import { getNetworkInventory } from "@/app/actions/inventory";
import { createRequest } from "@/app/actions/requests";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InventoryRow = {
  shop_id: string;
  available: boolean;
  quantity: number | null;
  price_eur: number | null;
  updated_at: string;
  shops: { id: string; name: string; commune: string | null; phone: string | null } | null;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_SUGGESTIONS = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filterDevices(query: string): Device[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return DEVICES.filter((d) => displayDevice(d).toLowerCase().includes(q)).slice(
    0,
    MAX_SUGGESTIONS
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CherchePage() {
  const t = useTranslations("search");
  const tErr = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();

  // Search / autocomplete
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Device[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Inventory
  const [inventory, setInventory] = useState<InventoryRow[] | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [specsNote, setSpecsNote] = useState("");
  const [sending, setSending] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── autocomplete ─────────────────────────────────────────────────────────

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    const filtered = filterDevices(val);
    setSuggestions(filtered);
    setShowDropdown(filtered.length > 0);
    setSelectedDevice(null);
    setDeviceId(null);
    setInventory(null);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowDropdown(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── resolve device UUID via Supabase devices table ───────────────────────
  // The static DEVICES catalog does not carry UUIDs; we look them up once
  // from the database using the (brand, model, storage_gb) composite key.

  const resolveDeviceId = useCallback(async (device: Device): Promise<string | null> => {
    const supabase = getSupabaseBrowserClient();
    const query = supabase
      .from("devices")
      .select("id")
      .eq("brand", device.brand)
      .eq("model", device.model);

    const q =
      device.storage_gb != null
        ? query.eq("storage_gb", device.storage_gb)
        : query.is("storage_gb", null);

    const { data } = await q.single() as { data: { id: string } | null; error: unknown };
    return data?.id ?? null;
  }, []);

  // ── device selected from dropdown ────────────────────────────────────────

  const handleSelect = async (device: Device) => {
    setSelectedDevice(device);
    setQuery(displayDevice(device));
    setShowDropdown(false);
    setInventory(null);
    setDeviceId(null);
    setLoadingInventory(true);

    try {
      const id = await resolveDeviceId(device);
      setDeviceId(id);

      if (id) {
        // Navigate to the device detail page
        router.push(`/${locale}/chercher/${id}`);
        return;
      } else {
        setInventory([]);
      }
    } catch {
      setInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  // ── send request blast ───────────────────────────────────────────────────

  const handleConfirmRequest = async () => {
    if (!deviceId) return;
    setSending(true);
    try {
      const result = await createRequest({
        device_id: deviceId,
        specs_note: specsNote.trim() || null,
      });

      if (result.error) {
        if (result.error === "rate_limit") {
          toast.error(t("rate_limit"));
        } else {
          toast.error(tErr(result.error as Parameters<typeof tErr>[0]));
        }
      } else {
        toast.success(t("request_sent"));
        setModalOpen(false);
        setSpecsNote("");
      }
    } finally {
      setSending(false);
    }
  };

  const hasInventory = inventory !== null && inventory.length > 0;
  const inventoryEmpty = inventory !== null && inventory.length === 0;

  return (
    <>
      {/* ── sticky search bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 pt-4 pb-3 shadow-sm">
        <h1 className="text-lg font-bold text-brand-500 mb-2.5">{t("title")}</h1>
        <div className="relative">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            placeholder={t("placeholder")}
            className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand bg-gray-50 focus:bg-white transition-colors"
          />

          {/* ── dropdown ─────────────────────────────────────────────── */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden"
            >
              {suggestions.map((device, i) => (
                <button
                  key={i}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur before click fires
                    handleSelect(device);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium text-gray-900">{device.brand}</span>{" "}
                  <span className="text-gray-700">{device.model}</span>
                  {device.storage_gb && (
                    <span className="text-gray-500 ml-1">{device.storage_gb}Go</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── body ──────────────────────────────────────────────────────── */}
      <div className="px-4 py-4 space-y-4">
        {/* Loading skeleton */}
        {loadingInventory && (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Inventory results */}
        {!loadingInventory && hasInventory && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              {t("available_at")}
            </p>
            <ul className="bg-white rounded-2xl shadow-card overflow-hidden">
              {(inventory as InventoryRow[]).map((row, i) => (
                <li
                  key={row.shop_id}
                  className={`flex items-center justify-between px-4 py-3.5 ${
                    i < (inventory as InventoryRow[]).length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {row.shops?.name ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">{row.shops?.commune ?? "—"}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {row.price_eur != null ? `${row.price_eur} €` : "—"}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 w-full rounded-xl border border-brand-500/30 bg-brand-50 text-brand-500 py-2.5 text-sm font-semibold hover:bg-brand-100 transition-colors"
            >
              {t("request_blast")}
            </button>
          </div>
        )}

        {/* No inventory found — prominent CTA */}
        {!loadingInventory && inventoryEmpty && selectedDevice && (
          <div className="flex flex-col items-center text-center py-10 space-y-4">
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-brand-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600 max-w-xs">{t("no_results")}</p>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-brand-500 text-white px-6 py-3 text-sm font-semibold hover:bg-brand-700 transition-colors shadow"
            >
              {t("request_blast")}
            </button>
          </div>
        )}

        {/* Initial empty state */}
        {!loadingInventory && inventory === null && (
          <p className="text-center text-sm text-gray-400 mt-10">{t("check_stock")}</p>
        )}
      </div>

      {/* ── confirmation modal ────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm mx-0 sm:mx-4 p-5 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              {t("confirm_request")}
            </h2>
            {selectedDevice && (
              <p className="text-sm text-brand-500 font-medium mb-4">
                {displayDevice(selectedDevice)}
              </p>
            )}
            <textarea
              value={specsNote}
              onChange={(e) => setSpecsNote(e.target.value)}
              placeholder={t("request_note_placeholder")}
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleConfirmRequest}
                disabled={sending || !deviceId}
                className="flex-1 rounded-xl bg-brand-500 text-white py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {sending ? "…" : t("request_blast")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
