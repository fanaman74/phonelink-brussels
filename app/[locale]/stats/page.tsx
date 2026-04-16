"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getMyStats, getRecoveredSalesDetail, confirmSale } from "@/app/actions/sales";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Stats = {
  requests_sent: number;
  requests_received: number;
  responses_given: number;
  sales_all_time: number;
  sales_this_week: number;
  match_rate: number;
};

type SaleDetail = {
  id: string;
  confirmed_at: string;
  request_id: string;
  requests: {
    device_id: string;
    devices: { brand: string; model: string; storage_gb: number | null } | null;
    shops: { name: string } | null;
  } | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deviceName(sale: SaleDetail): string {
  const d = sale.requests?.devices;
  if (!d) return "—";
  return d.storage_gb
    ? `${d.brand} ${d.model} ${d.storage_gb}Go`
    : `${d.brand} ${d.model}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type StatCardProps = {
  label: string;
  value: number | string;
  highlight?: boolean;
  suffix?: string;
};

function StatCard({ label, value, highlight, suffix }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">
        {label}
      </p>
      <p
        className={`text-3xl font-bold leading-none mt-1 ${
          highlight ? "text-[#27ae60]" : "text-gray-900"
        }`}
      >
        {value}
        {suffix && (
          <span className="text-lg font-semibold ml-0.5 text-inherit">{suffix}</span>
        )}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StatsPage() {
  const t = useTranslations("stats");
  const tErr = useTranslations("errors");

  const [stats, setStats] = useState<Stats | null>(null);
  const [sales, setSales] = useState<SaleDetail[] | null>(null);
  const [myShopId, setMyShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Track which sale IDs have been confirmed in this session to flip the button
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  // ── fetch data on mount ──────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();

      const [statsResult, salesResult, shopIdResult] = await Promise.all([
        getMyStats(),
        getRecoveredSalesDetail(),
        supabase.rpc("auth_shop_id").single(),
      ]);

      setStats(statsResult.data);
      setSales((salesResult.data as SaleDetail[] | null) ?? []);
      setMyShopId((shopIdResult.data as string | null) ?? null);
      setLoading(false);
    }
    load();
  }, []);

  // ── confirm sale ─────────────────────────────────────────────────────────

  const handleConfirmSale = useCallback(
    async (sale: SaleDetail) => {
      // Optimistically ignore duplicate clicks within the same session
      if (confirmedIds.has(sale.id)) return;
      if (!myShopId) return;

      const result = await confirmSale({
        request_id: sale.request_id,
        responding_shop_id: myShopId,
      });

      if (result.error) {
        // The action already swallows isDuplicate and returns { success: true }
        // so any error here is a real failure
        toast.error(tErr(result.error as Parameters<typeof tErr>[0]));
        return;
      }

      // Mark as confirmed (success includes the duplicate-swallowed case)
      setConfirmedIds((prev) => {
        const next = new Set(prev);
        next.add(sale.id);
        return next;
      });
      toast.success(t("sale_confirmed"));
    },
    [confirmedIds, myShopId, t, tErr]
  );

  // ── loading skeleton ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="h-7 w-32 rounded-lg bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="space-y-2 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <h1 className="text-lg font-semibold text-brand-500">{t("title")}</h1>

      {/* ── 2×3 stat card grid ────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          {/* Recovered sales all-time spans full width for visual prominence */}
          <div className="col-span-2">
            <StatCard
              label={`${t("recovered_sales")} — ${t("all_time")}`}
              value={stats.sales_all_time}
              highlight
            />
          </div>
          <StatCard
            label={`${t("recovered_sales")} — ${t("this_week")}`}
            value={stats.sales_this_week}
            highlight
          />
          <StatCard label={t("requests_sent")} value={stats.requests_sent} />
          <StatCard label={t("requests_received")} value={stats.requests_received} />
          <StatCard label={t("responses_given")} value={stats.responses_given} />
          <StatCard
            label={t("match_rate")}
            value={stats.match_rate}
            suffix="%"
          />
        </div>
      )}

      {/* ── recovered sales detail list ───────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Ventes récupérées
        </h2>

        {sales && sales.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            Aucune vente récupérée pour l'instant
          </p>
        )}

        <ul className="space-y-2">
          {(sales ?? []).map((sale) => {
            const confirmed = confirmedIds.has(sale.id);
            return (
              <li
                key={sale.id}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {deviceName(sale)}
                  </p>
                  {sale.requests?.shops?.name && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {sale.requests.shops.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleConfirmSale(sale)}
                  disabled={confirmed}
                  className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    confirmed
                      ? "bg-[#27ae60]/10 text-[#27ae60] cursor-default"
                      : "bg-brand-500 text-white hover:bg-brand-700"
                  }`}
                >
                  {confirmed ? t("sale_confirmed") : t("confirm_sale")}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
