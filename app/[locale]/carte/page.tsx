"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Shop = {
  id: string;
  name: string;
  commune: string | null;
  phone: string | null;
  lat: number;
  lng: number;
};

// ---------------------------------------------------------------------------
// Dynamic import — Leaflet requires the browser, so SSR must be disabled.
// ---------------------------------------------------------------------------

const NetworkMap = dynamic(
  () => import("./NetworkMapClient").then((m) => m.NetworkMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Chargement de la carte…</p>
      </div>
    ),
  }
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CartePage() {
  const t = useTranslations("map");

  const [shops, setShops] = useState<Shop[]>([]);
  // IDs of shops that have at least one available unit right now
  const [availableShopIds, setAvailableShopIds] = useState<Set<string>>(new Set());
  // IDs of shops with any inventory row (available or not)
  const [anyInventoryShopIds, setAnyInventoryShopIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();

      // Fetch shops with coordinates and all inventory rows in parallel
      const [shopsResult, availableResult, allInventoryResult] = await Promise.all([
        supabase
          .from("shops")
          .select("id, name, commune, phone, lat, lng")
          .not("lat", "is", null)
          .not("lng", "is", null),
        // Shops with currently available stock → green
        supabase
          .from("inventory")
          .select("shop_id")
          .eq("available", true),
        // Shops with any inventory entry (available or not) → orange if not in available set
        supabase
          .from("inventory")
          .select("shop_id"),
      ]);

      const shopData = (shopsResult.data ?? []) as Shop[];

      const availableIds = new Set<string>(
        (availableResult.data ?? []).map((r: { shop_id: string }) => r.shop_id)
      );
      const anyIds = new Set<string>(
        (allInventoryResult.data ?? []).map((r: { shop_id: string }) => r.shop_id)
      );

      setShops(shopData);
      setAvailableShopIds(availableIds);
      setAnyInventoryShopIds(anyIds);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-lg font-semibold text-brand-500">{t("title")}</h1>
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p className="text-sm text-gray-500">Chargement…</p>
          </div>
        ) : (
          <NetworkMap
            shops={shops}
            availableShopIds={availableShopIds}
            anyInventoryShopIds={anyInventoryShopIds}
          />
        )}
      </div>
    </div>
  );
}
