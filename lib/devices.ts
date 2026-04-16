/**
 * Canonical device catalog, bundled statically at build time.
 * ~180 devices covering iPhone, Samsung, Xiaomi, Google, Oppo, Honor, OnePlus.
 * Keep sorted: brand then model then storage asc.
 *
 * To add a device post-launch: append here, then re-run `bun run seed:devices`.
 */

export type Device = { brand: string; model: string; storage_gb: number | null };

export const DEVICES: Device[] = [
  // Apple iPhone
  { brand: "Apple", model: "iPhone 16 Pro Max", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 16 Pro Max", storage_gb: 512 },
  { brand: "Apple", model: "iPhone 16 Pro Max", storage_gb: 1024 },
  { brand: "Apple", model: "iPhone 16 Pro", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 16 Pro", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 16 Pro", storage_gb: 512 },
  { brand: "Apple", model: "iPhone 16 Plus", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 16 Plus", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 16", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 16", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 16", storage_gb: 512 },
  { brand: "Apple", model: "iPhone 15 Pro Max", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 15 Pro Max", storage_gb: 512 },
  { brand: "Apple", model: "iPhone 15 Pro Max", storage_gb: 1024 },
  { brand: "Apple", model: "iPhone 15 Pro", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 15 Pro", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 15 Pro", storage_gb: 512 },
  { brand: "Apple", model: "iPhone 15 Plus", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 15 Plus", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 15", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 15", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 15", storage_gb: 512 },
  { brand: "Apple", model: "iPhone 14 Pro Max", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 14 Pro Max", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 14 Pro", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 14 Pro", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 14 Plus", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 14", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 14", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 13 Pro Max", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 13 Pro Max", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 13 Pro", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 13", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 13", storage_gb: 256 },
  { brand: "Apple", model: "iPhone 13 mini", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 12 Pro Max", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 12 Pro", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 12", storage_gb: 64 },
  { brand: "Apple", model: "iPhone 12", storage_gb: 128 },
  { brand: "Apple", model: "iPhone 12 mini", storage_gb: 64 },
  { brand: "Apple", model: "iPhone 11 Pro Max", storage_gb: 64 },
  { brand: "Apple", model: "iPhone 11 Pro", storage_gb: 64 },
  { brand: "Apple", model: "iPhone 11", storage_gb: 64 },
  { brand: "Apple", model: "iPhone 11", storage_gb: 128 },
  { brand: "Apple", model: "iPhone SE (3rd gen)", storage_gb: 64 },
  { brand: "Apple", model: "iPhone SE (2nd gen)", storage_gb: 64 },
  { brand: "Apple", model: "iPhone XR", storage_gb: 64 },
  { brand: "Apple", model: "iPhone XS", storage_gb: 64 },

  // Samsung Galaxy S
  { brand: "Samsung", model: "Galaxy S24 Ultra", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy S24 Ultra", storage_gb: 512 },
  { brand: "Samsung", model: "Galaxy S24 Ultra", storage_gb: 1024 },
  { brand: "Samsung", model: "Galaxy S24+", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy S24+", storage_gb: 512 },
  { brand: "Samsung", model: "Galaxy S24", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy S24", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy S24 FE", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy S23 Ultra", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy S23 Ultra", storage_gb: 512 },
  { brand: "Samsung", model: "Galaxy S23+", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy S23", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy S23", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy S23 FE", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy S22 Ultra", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy S22+", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy S22", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy S21 FE", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy S21 Ultra", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy S21", storage_gb: 128 },

  // Samsung Galaxy A
  { brand: "Samsung", model: "Galaxy A55", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy A55", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy A35", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy A35", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy A25", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy A15", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy A54", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy A54", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy A34", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy A24", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy A14", storage_gb: 64 },
  { brand: "Samsung", model: "Galaxy A14", storage_gb: 128 },
  { brand: "Samsung", model: "Galaxy A05s", storage_gb: 64 },
  { brand: "Samsung", model: "Galaxy A04s", storage_gb: 64 },

  // Samsung Galaxy Z
  { brand: "Samsung", model: "Galaxy Z Fold 6", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy Z Fold 6", storage_gb: 512 },
  { brand: "Samsung", model: "Galaxy Z Flip 6", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy Z Flip 6", storage_gb: 512 },
  { brand: "Samsung", model: "Galaxy Z Fold 5", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy Z Flip 5", storage_gb: 256 },
  { brand: "Samsung", model: "Galaxy Z Flip 5", storage_gb: 512 },

  // Xiaomi
  { brand: "Xiaomi", model: "14 Pro", storage_gb: 256 },
  { brand: "Xiaomi", model: "14 Pro", storage_gb: 512 },
  { brand: "Xiaomi", model: "14", storage_gb: 256 },
  { brand: "Xiaomi", model: "14", storage_gb: 512 },
  { brand: "Xiaomi", model: "13T Pro", storage_gb: 256 },
  { brand: "Xiaomi", model: "13T", storage_gb: 128 },
  { brand: "Xiaomi", model: "13T", storage_gb: 256 },
  { brand: "Xiaomi", model: "13 Pro", storage_gb: 256 },
  { brand: "Xiaomi", model: "13", storage_gb: 128 },
  { brand: "Xiaomi", model: "13", storage_gb: 256 },
  { brand: "Xiaomi", model: "12T Pro", storage_gb: 256 },
  { brand: "Xiaomi", model: "12T", storage_gb: 128 },
  { brand: "Xiaomi", model: "Redmi Note 13 Pro+", storage_gb: 256 },
  { brand: "Xiaomi", model: "Redmi Note 13 Pro", storage_gb: 256 },
  { brand: "Xiaomi", model: "Redmi Note 13", storage_gb: 128 },
  { brand: "Xiaomi", model: "Redmi Note 12 Pro", storage_gb: 128 },
  { brand: "Xiaomi", model: "Redmi Note 12", storage_gb: 128 },
  { brand: "Xiaomi", model: "Redmi 13C", storage_gb: 128 },
  { brand: "Xiaomi", model: "Redmi 12", storage_gb: 128 },
  { brand: "Xiaomi", model: "Poco X6 Pro", storage_gb: 256 },
  { brand: "Xiaomi", model: "Poco X6", storage_gb: 256 },
  { brand: "Xiaomi", model: "Poco F6 Pro", storage_gb: 256 },

  // Google Pixel
  { brand: "Google", model: "Pixel 9 Pro XL", storage_gb: 256 },
  { brand: "Google", model: "Pixel 9 Pro XL", storage_gb: 512 },
  { brand: "Google", model: "Pixel 9 Pro", storage_gb: 128 },
  { brand: "Google", model: "Pixel 9 Pro", storage_gb: 256 },
  { brand: "Google", model: "Pixel 9", storage_gb: 128 },
  { brand: "Google", model: "Pixel 9", storage_gb: 256 },
  { brand: "Google", model: "Pixel 8 Pro", storage_gb: 128 },
  { brand: "Google", model: "Pixel 8 Pro", storage_gb: 256 },
  { brand: "Google", model: "Pixel 8", storage_gb: 128 },
  { brand: "Google", model: "Pixel 8", storage_gb: 256 },
  { brand: "Google", model: "Pixel 8a", storage_gb: 128 },
  { brand: "Google", model: "Pixel 7 Pro", storage_gb: 128 },
  { brand: "Google", model: "Pixel 7", storage_gb: 128 },
  { brand: "Google", model: "Pixel 7a", storage_gb: 128 },
  { brand: "Google", model: "Pixel 6 Pro", storage_gb: 128 },
  { brand: "Google", model: "Pixel 6", storage_gb: 128 },
  { brand: "Google", model: "Pixel 6a", storage_gb: 128 },

  // OnePlus
  { brand: "OnePlus", model: "12", storage_gb: 256 },
  { brand: "OnePlus", model: "12", storage_gb: 512 },
  { brand: "OnePlus", model: "12R", storage_gb: 256 },
  { brand: "OnePlus", model: "11", storage_gb: 128 },
  { brand: "OnePlus", model: "11", storage_gb: 256 },
  { brand: "OnePlus", model: "Nord 4", storage_gb: 256 },
  { brand: "OnePlus", model: "Nord 3", storage_gb: 128 },
  { brand: "OnePlus", model: "Nord CE 4", storage_gb: 256 },

  // Oppo
  { brand: "Oppo", model: "Find X7 Ultra", storage_gb: 256 },
  { brand: "Oppo", model: "Find X6 Pro", storage_gb: 256 },
  { brand: "Oppo", model: "Reno 11 Pro", storage_gb: 256 },
  { brand: "Oppo", model: "Reno 11", storage_gb: 256 },
  { brand: "Oppo", model: "Reno 10", storage_gb: 256 },
  { brand: "Oppo", model: "A98", storage_gb: 256 },
  { brand: "Oppo", model: "A79", storage_gb: 128 },
  { brand: "Oppo", model: "A58", storage_gb: 128 },

  // Honor
  { brand: "Honor", model: "Magic 6 Pro", storage_gb: 512 },
  { brand: "Honor", model: "Magic 6", storage_gb: 256 },
  { brand: "Honor", model: "90", storage_gb: 256 },
  { brand: "Honor", model: "70", storage_gb: 128 },
  { brand: "Honor", model: "Magic V2", storage_gb: 512 },
  { brand: "Honor", model: "X8a", storage_gb: 128 },

  // Huawei
  { brand: "Huawei", model: "Pura 70 Ultra", storage_gb: 512 },
  { brand: "Huawei", model: "Pura 70 Pro", storage_gb: 256 },
  { brand: "Huawei", model: "P60 Pro", storage_gb: 256 },
  { brand: "Huawei", model: "Mate 60 Pro", storage_gb: 512 },
  { brand: "Huawei", model: "Nova 12", storage_gb: 256 },

  // Motorola
  { brand: "Motorola", model: "Edge 50 Pro", storage_gb: 256 },
  { brand: "Motorola", model: "Edge 40 Pro", storage_gb: 256 },
  { brand: "Motorola", model: "Edge 40", storage_gb: 256 },
  { brand: "Motorola", model: "Moto G84", storage_gb: 256 },
  { brand: "Motorola", model: "Moto G54", storage_gb: 256 },
  { brand: "Motorola", model: "Moto G14", storage_gb: 128 },

  // Nothing
  { brand: "Nothing", model: "Phone (2a)", storage_gb: 128 },
  { brand: "Nothing", model: "Phone (2a)", storage_gb: 256 },
  { brand: "Nothing", model: "Phone (2)", storage_gb: 256 },
  { brand: "Nothing", model: "Phone (1)", storage_gb: 128 },

  // Sony
  { brand: "Sony", model: "Xperia 1 VI", storage_gb: 256 },
  { brand: "Sony", model: "Xperia 10 VI", storage_gb: 128 },
  { brand: "Sony", model: "Xperia 5 V", storage_gb: 128 },
];

export function displayDevice(d: Pick<Device, "brand" | "model" | "storage_gb">): string {
  return d.storage_gb ? `${d.brand} ${d.model} ${d.storage_gb}Go` : `${d.brand} ${d.model}`;
}
