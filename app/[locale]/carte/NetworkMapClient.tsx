"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useTranslations } from "next-intl";
import type { Shop } from "./page";
import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BRUSSELS_CENTER: [number, number] = [50.8503, 4.3517];
const DEFAULT_ZOOM = 12;

const COLOR_AVAILABLE = "#27ae60"; // green  — has available inventory
const COLOR_PARTIAL = "#e67e22";   // orange — has inventory, none available
const COLOR_NONE = "#9ca3af";      // gray   — no inventory at all

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveMarkerColor(
  shopId: string,
  availableShopIds: Set<string>,
  anyInventoryShopIds: Set<string>
): string {
  if (availableShopIds.has(shopId)) return COLOR_AVAILABLE;
  if (anyInventoryShopIds.has(shopId)) return COLOR_PARTIAL;
  return COLOR_NONE;
}

// Invalidate map size after mount to fix Leaflet tile rendering issues
function LeafletFix() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type NetworkMapClientProps = {
  shops: Shop[];
  availableShopIds: Set<string>;
  anyInventoryShopIds: Set<string>;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NetworkMapClient({
  shops,
  availableShopIds,
  anyInventoryShopIds,
}: NetworkMapClientProps) {
  const t = useTranslations("map");

  return (
    <div className="relative w-full h-full">
      <MapContainer
        key="brussels-network-map"
        center={BRUSSELS_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full z-0"
        scrollWheelZoom
      >
        <LeafletFix />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {shops.map((shop) => {
          const color = resolveMarkerColor(shop.id, availableShopIds, anyInventoryShopIds);
          return (
            <CircleMarker
              key={shop.id}
              center={[shop.lat, shop.lng]}
              radius={10}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm space-y-0.5 min-w-[140px]">
                  <p className="font-semibold text-gray-900">{shop.name}</p>
                  {shop.commune && (
                    <p className="text-gray-600">
                      <span className="text-gray-400">{t("shop_popup_commune")}: </span>
                      {shop.commune}
                    </p>
                  )}
                  {shop.phone && (
                    <p className="text-gray-600">
                      <span className="text-gray-400">{t("shop_popup_phone")}: </span>
                      <a href={`tel:${shop.phone}`} className="text-brand-500 underline">
                        {shop.phone}
                      </a>
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend — positioned bottom-left, above Leaflet attribution */}
      <div className="absolute bottom-6 left-3 z-[400] bg-white rounded-xl shadow-md border border-gray-200 px-3 py-2 space-y-1.5">
        <LegendItem color={COLOR_AVAILABLE} label={t("legend_available")} />
        <LegendItem color={COLOR_PARTIAL} label={t("legend_partial")} />
        <LegendItem color={COLOR_NONE} label={t("legend_unavailable")} />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-gray-700">{label}</span>
    </div>
  );
}
