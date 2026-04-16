import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import DeviceDetailClient from "./DeviceDetailClient";

export type ShopStock = {
  shop_id: string;
  available: boolean;
  price_eur: number | null;
  quantity: number | null;
  updated_at: string;
  shops: {
    id: string;
    name: string;
    commune: string | null;
    phone: string | null;
  } | null;
};

export type DeviceInfo = {
  id: string;
  brand: string;
  model: string;
  storage_gb: number | null;
};

/**
 * Device Detail Page — shows network-wide stock for a specific device.
 * Accessible via /[locale]/chercher/[deviceId]
 */
export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; deviceId: string }>;
}) {
  const { deviceId } = await params;
  const supabase = await createClient();

  // Fetch device info
  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select("id, brand, model, storage_gb")
    .eq("id", deviceId)
    .single();

  if (deviceError || !device) {
    notFound();
  }

  // Fetch network-wide inventory for this device
  const { data: inventory } = await supabase
    .from("inventory")
    .select("shop_id, available, price_eur, quantity, updated_at, shops(id, name, commune, phone)")
    .eq("device_id", deviceId)
    .order("available", { ascending: false })
    .order("price_eur", { ascending: true });

  const shopStock = ((inventory as unknown as ShopStock[]) ?? []).filter(
    (row) => row.shops !== null
  );

  return (
    <DeviceDetailClient
      device={device as DeviceInfo}
      shopStock={shopStock}
    />
  );
}
