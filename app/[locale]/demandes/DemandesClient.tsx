"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import { respondToRequest } from "@/app/actions/responses";
import { confirmSale, } from "@/app/actions/sales";
import { cancelReservation } from "@/app/actions/requests";
import { subscribeToRequests, subscribeToResponses } from "@/lib/supabase/realtime";
import { isOpenClientSide, timeRemaining } from "@/lib/ttl";
import { displayDevice } from "@/lib/devices";
import type { RequestItem, MyResponse, MyReservation } from "./page";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  initialRequests: RequestItem[];
  initialMyResponses: MyResponse[];
  myShopId: string | null;
  networkId: string | null;
  myReservations: MyReservation[];
}

// ─── Time Badge ───────────────────────────────────────────────────────────────

function TimeBadge({ expiresAt, status }: { expiresAt: string; status: string }) {
  const t = useTranslations();
  const [label, setLabel] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    function tick() {
      const open = isOpenClientSide(status, expiresAt);
      if (!open) {
        setIsExpired(true);
        setLabel(null);
        return;
      }
      const remaining = timeRemaining(expiresAt, (key, params) => t(key, params));
      setLabel(remaining);
      const msLeft = new Date(expiresAt).getTime() - Date.now();
      setIsWarning(msLeft < 60 * 60 * 1000);
    }
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [expiresAt, status, t]);

  if (isExpired) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 line-through">
        {t("dashboard.expired")}
      </span>
    );
  }
  if (!label) return null;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isWarning
          ? "bg-orange-900/40 text-[#f97316]"
          : "bg-green-900/40 text-[#22c55e]"
      }`}
    >
      {label}
    </span>
  );
}

// ─── Response Form ─────────────────────────────────────────────────────────────

function ResponseForm({
  requestId,
  onResponded,
}: {
  requestId: string;
  onResponded: (res: MyResponse) => void;
}) {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleNo() {
    startTransition(async () => {
      const result = await respondToRequest({ request_id: requestId, has_device: false });
      if ("error" in result && result.error) {
        toast.error(t("already_responded"));
        return;
      }
      onResponded({ request_id: requestId, has_device: false, price_eur: null });
    });
  }

  function handleConfirm() {
    const priceVal = price.trim() !== "" ? parseFloat(price) : null;
    startTransition(async () => {
      const result = await respondToRequest({
        request_id: requestId,
        has_device: true,
        price_eur: priceVal,
      });
      if ("error" in result && result.error) {
        toast.error(t("already_responded"));
        return;
      }
      onResponded({ request_id: requestId, has_device: true, price_eur: priceVal });
      setOpen(false);
    });
  }

  if (open) {
    return (
      <div className="mt-3 flex flex-col gap-2 p-3 rounded-xl bg-[#111827] border border-[#374151]">
        <label className="text-xs text-[#9ca3af] font-medium">{t("price_optional")}</label>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-sm">€</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="ex. 299"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#374151] bg-[#1f2937] text-white placeholder-[#6b7280] text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316]"
              autoFocus
            />
          </div>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-success text-white text-sm font-semibold disabled:opacity-50 hover:bg-success/90 transition-colors"
          >
            {isPending ? "…" : t("confirm_response")}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="px-3 py-2 rounded-lg border border-[#374151] text-sm text-[#9ca3af] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex gap-2">
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="flex-1 py-2 rounded-xl bg-[#f97316] text-black text-sm font-bold hover:bg-orange-400 disabled:opacity-50 transition-colors"
      >
        {t("respond")}
      </button>
      <button
        onClick={handleNo}
        disabled={isPending}
        className="flex-1 py-2 rounded-xl bg-[#374151] text-[#9ca3af] text-sm font-semibold hover:bg-[#4b5563] disabled:opacity-50 transition-colors"
      >
        {isPending ? "…" : t("no_stock")}
      </button>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({
  request,
  myShopId,
  myResponse,
  onResponded,
  onConfirmSale,
}: {
  request: RequestItem;
  myShopId: string | null;
  myResponse: MyResponse | null;
  onResponded: (res: MyResponse) => void;
  onConfirmSale: (requestId: string, respondingShopId: string) => void;
}) {
  const t = useTranslations("dashboard");
  const tErr = useTranslations("errors");

  const isMyRequest = myShopId === request.requesting_shop_id;
  const isOpen = isOpenClientSide(request.status, request.expires_at);
  const deviceLabel = request.devices
    ? displayDevice(request.devices)
    : request.device_id;

  return (
    <div className="bg-[#1f2937] rounded-2xl shadow-card border border-[#374151] border-l-4 border-l-[#f97316] p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-base leading-snug truncate">
            {deviceLabel}
          </p>
          {request.shops && (
            <p className="mt-0.5 text-sm text-[#9ca3af]">
              {request.shops.name}
              {request.shops.commune ? ` · ${request.shops.commune}` : ""}
            </p>
          )}
          {request.specs_note && (
            <p className="mt-1 text-xs text-[#6b7280] italic">{request.specs_note}</p>
          )}
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <TimeBadge expiresAt={request.expires_at} status={request.status} />
          {request.status === "matched" && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-[#22c55e]">
              ✓ {t("matched", { shop: request.shops?.name ?? "" })}
            </span>
          )}
        </div>
      </div>

      {/* My own request: show responses */}
      {isMyRequest && (
        <div className="mt-3 space-y-1.5">
          {/* Responses shown in RequestItem come from getMyRequests, not getNetworkOpenRequests.
              For the dashboard we don't have per-request response detail here.
              Show a matched badge if status is matched. */}
          {request.status === "matched" && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-green-900/30 border border-green-800/50">
              <span className="text-[#22c55e] text-sm font-medium">
                {t("matched_banner")}
              </span>
            </div>
          )}
          {request.status === "open" && isOpen && (
            <p className="text-xs text-[#6b7280] italic">{t("loading")}</p>
          )}
        </div>
      )}

      {/* Someone else's request */}
      {!isMyRequest && isOpen && (
        <>
          {myResponse === null ? (
            <ResponseForm requestId={request.id} onResponded={onResponded} />
          ) : (
            <div className="mt-3">
              {myResponse.has_device ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-900/30 border border-green-800/50">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0" />
                  <span className="text-sm text-[#22c55e] font-medium">
                    {t("respond")}
                    {myResponse.price_eur != null
                      ? ` · €${myResponse.price_eur}`
                      : ""}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111827] border border-[#374151]">
                  <span className="w-2 h-2 rounded-full bg-[#374151] flex-shrink-0" />
                  <span className="text-sm text-[#9ca3af] font-medium">{t("no_stock")}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Expired and not my own */}
      {!isMyRequest && !isOpen && (
        <div className="mt-3 px-3 py-2 rounded-xl bg-[#111827]">
          <span className="text-xs text-[#6b7280]">{tErr("request_expired")}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function DemandesClient({
  initialRequests,
  initialMyResponses,
  myShopId,
  networkId,
  myReservations: initialMyReservations,
}: Props) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [myReservations, setMyReservations] = useState<MyReservation[]>(initialMyReservations);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelReservation = useCallback(async (id: string) => {
    setCancellingId(id);
    const result = await cancelReservation(id);
    setCancellingId(null);
    if (result.error) {
      toast.error("Impossible d'annuler la réservation.");
    } else {
      setMyReservations((prev) => prev.filter((r) => r.id !== id));
      toast.success("Réservation annulée.");
    }
  }, []);
  const [myResponseMap, setMyResponseMap] = useState<Record<string, MyResponse>>(() => {
    const map: Record<string, MyResponse> = {};
    for (const r of initialMyResponses) {
      map[r.request_id] = r;
    }
    return map;
  });

  // Handle a new response submitted from this session
  const handleResponded = useCallback((res: MyResponse) => {
    setMyResponseMap((prev) => ({ ...prev, [res.request_id]: res }));
  }, []);

  // Handle confirm sale (for matched requests in my own requests view)
  const handleConfirmSale = useCallback(
    async (requestId: string, respondingShopId: string) => {
      const result = await confirmSale({ request_id: requestId, responding_shop_id: respondingShopId });
      if ("error" in result && result.error) {
        toast.error(t("loading")); // fallback — no specific error key in dashboard ns
      } else {
        toast.success(t("matched_banner"));
      }
    },
    [t]
  );

  // Realtime subscriptions
  useEffect(() => {
    if (!networkId) return;

    const reqSub = subscribeToRequests(networkId, (payload) => {
      const { eventType, new: newRow, old: oldRow } = payload as {
        eventType: "INSERT" | "UPDATE" | "DELETE";
        new: Record<string, unknown>;
        old: Record<string, unknown>;
      };

      if (eventType === "INSERT") {
        // New request — prepend. We only have partial data from realtime,
        // so we build a RequestItem from the payload fields.
        const item: RequestItem = {
          id: newRow.id as string,
          device_id: newRow.device_id as string,
          specs_note: (newRow.specs_note as string | null) ?? null,
          status: (newRow.status as "open" | "matched" | "expired") ?? "open",
          created_at: newRow.created_at as string,
          expires_at: newRow.expires_at as string,
          requesting_shop_id: newRow.requesting_shop_id as string,
          shops: null, // not available from realtime payload
          devices: null, // not available from realtime payload
        };
        setRequests((prev) => [item, ...prev]);
      }

      if (eventType === "UPDATE") {
        const id = (newRow.id ?? oldRow.id) as string;
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: (newRow.status as "open" | "matched" | "expired") ?? r.status,
                  expires_at: (newRow.expires_at as string) ?? r.expires_at,
                }
              : r
          )
        );
      }
    });

    const resSub = subscribeToResponses(networkId, (payload) => {
      // A new response was inserted — if it belongs to a request we're viewing,
      // update the matched status if applicable (status change comes via request UPDATE).
      // Nothing needed here beyond what request UPDATE handles.
      void payload;
    });

    return () => {
      reqSub.unsubscribe();
      resSub.unsubscribe();
    };
  }, [networkId]);

  return (
    <div className="flex flex-col bg-[#111827] min-h-screen">
      {/* Sticky title bar */}
      <div className="sticky top-0 z-10 bg-[#111827]/95 backdrop-blur-sm border-b border-[#374151] px-4 py-3.5 shadow-sm flex items-center gap-2.5">
        <h1 className="text-lg font-bold text-[#f97316]" style={{ fontFamily: "'Chango', cursive" }}>{t("title")}</h1>
        {requests.length > 0 && (
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#f97316] text-black text-xs font-bold leading-none">
            {requests.length}
          </span>
        )}
      </div>

      {/* My reservations — requests I made at other shops */}
      {myReservations.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Mes réservations</p>
          <div className="space-y-2">
            {myReservations.map((res) => {
              const shopName = res.shop_name ?? "—";
              const price = res.price_eur != null ? `${res.price_eur} €` : null;
              const statusColor =
                res.status === "matched" ? "bg-green-900/50 text-green-400" :
                res.status === "expired" ? "bg-red-900/30 text-red-400" :
                "bg-[#374151] text-[#9ca3af]";
              const statusLabel =
                res.status === "matched" ? "Confirmé" :
                res.status === "expired" ? "Expiré" : "En attente";
              const isCancelling = cancellingId === res.id;
              return (
                <div key={res.id} className="flex items-start justify-between bg-[#1f2937] border border-[#374151] rounded-2xl px-4 py-3 shadow-sm gap-3">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${statusColor}`}>{statusLabel}</span>
                    <p className="text-sm font-semibold text-white truncate">
                      {res.devices ? `${res.devices.brand} ${res.devices.model}` : "—"}
                      {res.devices?.storage_gb ? <span className="text-[#6b7280] font-normal ml-1">{res.devices.storage_gb}Go</span> : null}
                    </p>
                    <p className="text-xs text-[#6b7280] mt-0.5">Chez {shopName}{price ? ` · ${price}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    <button
                      onClick={() => handleCancelReservation(res.id)}
                      disabled={isCancelling}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
                      title="Annuler"
                    >
                      {isCancelling ? (
                        <span className="w-3 h-3 border-2 border-red-700 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      {myReservations.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Demandes du réseau</p>
        </div>
      )}

      {/* Request list */}
      <div className="px-4 py-4 space-y-3">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1f2937] flex items-center justify-center mb-4 shadow-card border border-[#374151]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-8 h-8 text-[#f97316]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                />
              </svg>
            </div>
            <p className="text-white font-semibold mb-1">{t("empty_title")}</p>
            <p className="text-[#9ca3af] text-sm mb-6 max-w-[240px]">{t("empty")}</p>
            <Link
              href={`/${locale}/chercher`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f97316] text-black text-sm font-bold hover:bg-orange-400 transition-colors shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              {t("empty_cta")}
            </Link>
          </div>
        ) : (
          requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              myShopId={myShopId}
              myResponse={myResponseMap[request.id] ?? null}
              onResponded={handleResponded}
              onConfirmSale={handleConfirmSale}
            />
          ))
        )}
      </div>
    </div>
  );
}
