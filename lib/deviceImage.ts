/**
 * Generates a GSMArena phone image URL for a given brand + model.
 * Pattern: https://fdn2.gsmarena.com/vv/bigpic/{slug}.jpg
 *
 * GSMArena slugs are inconsistent across generations. Some models use -5g
 * suffixes, some drop hyphens, some don't have bigpic images yet (newer
 * flagships). Missing images fall back to SVG silhouette in the component.
 *
 * Tested 2025-04 — 404s fall back to SVG silhouette gracefully.
 */

// Explicit slug overrides keyed by "brand|model"
const SLUG_OVERRIDES: Record<string, string> = {
  // Apple — SE models use year-based slugs, not generation names
  "Apple|iPhone SE (3rd gen)": "apple-iphone-se-2022",
  "Apple|iPhone SE (2nd gen)": "apple-iphone-se-2020",

  // Samsung S-series — S22/S23 require -5g suffix; S24+ don't have bigpic yet
  "Samsung|Galaxy S23 Ultra": "samsung-galaxy-s23-ultra-5g",
  "Samsung|Galaxy S23+": "samsung-galaxy-s23-plus-5g",
  "Samsung|Galaxy S23": "samsung-galaxy-s23-5g",
  "Samsung|Galaxy S22 Ultra": "samsung-galaxy-s22-ultra-5g",
  "Samsung|Galaxy S22+": "samsung-galaxy-s22-plus-5g",
  "Samsung|Galaxy S22": "samsung-galaxy-s22-5g",
  "Samsung|Galaxy S21 Ultra": "samsung-galaxy-s21-ultra-5g",
  "Samsung|Galaxy S21": "samsung-galaxy-s21-5g",
  "Samsung|Galaxy S21 FE": "samsung-galaxy-s21-fe-5g",

  // Samsung Z-series — no space/hyphen before the number
  "Samsung|Galaxy Z Fold 6": "samsung-galaxy-z-fold6",
  "Samsung|Galaxy Z Flip 6": "samsung-galaxy-z-flip6",
  "Samsung|Galaxy Z Fold 5": "samsung-galaxy-z-fold5",
  "Samsung|Galaxy Z Flip 5": "samsung-galaxy-z-flip5",

  // Nothing Phone — parentheses stripped, no hyphen before digit
  "Nothing|Phone (1)": "nothing-phone1",
  "Nothing|Phone (2)": "nothing-phone2",
  "Nothing|Phone (2a)": "nothing-phone-2a",

  // Honor — no hyphen in "magic6"
  "Honor|Magic 6 Pro": "honor-magic6-pro",
  "Honor|Magic 6": "honor-magic6",
};

function defaultSlug(brand: string, model: string): string {
  return `${brand} ${model}`
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/-$/, "");
}

export function getDeviceImageUrl(brand: string, model: string): string {
  const key = `${brand}|${model}`;
  const slug = SLUG_OVERRIDES[key] ?? defaultSlug(brand, model);
  return `https://fdn2.gsmarena.com/vv/bigpic/${slug}.jpg`;
}
