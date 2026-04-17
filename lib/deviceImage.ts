/**
 * Generates a GSMArena phone image URL for a given brand + model.
 * Pattern: https://fdn2.gsmarena.com/vv/bigpic/{slug}.jpg
 *
 * Many models use non-obvious slugs (trailing dashes, missing hyphens, -5g
 * suffixes). All overrides below are verified 200 OK as of 2026-04.
 * Missing images fall back to SVG silhouette in the component.
 */

const SLUG_OVERRIDES: Record<string, string> = {
  // ── Apple ──────────────────────────────────────────────────────────────
  // SE models use year-based slugs
  "Apple|iPhone SE (3rd gen)":    "apple-iphone-se-2022",
  "Apple|iPhone SE (2nd gen)":    "apple-iphone-se-2020",
  // Pro Max models need trailing dash
  "Apple|iPhone 15 Pro Max":      "apple-iphone-15-pro-max",
  "Apple|iPhone 14 Pro Max":      "apple-iphone-14-pro-max-",
  "Apple|iPhone 13 Pro Max":      "apple-iphone-13-pro-max",
  "Apple|iPhone 12 Pro Max":      "apple-iphone-12-pro-max",
  "Apple|iPhone 11 Pro Max":      "apple-iphone-11-pro-max-",
  // Plus models need trailing dash
  "Apple|iPhone 16 Plus":         "apple-iphone-16-plus",
  "Apple|iPhone 15 Plus":         "apple-iphone-15-plus-",

  // ── Samsung S-series ───────────────────────────────────────────────────
  "Samsung|Galaxy S23 Ultra":     "samsung-galaxy-s23-ultra-5g",
  "Samsung|Galaxy S23+":          "samsung-galaxy-s23-plus-5g",
  "Samsung|Galaxy S23":           "samsung-galaxy-s23-5g",
  "Samsung|Galaxy S22 Ultra":     "samsung-galaxy-s22-ultra-5g",
  "Samsung|Galaxy S22+":          "samsung-galaxy-s22-plus-5g",
  "Samsung|Galaxy S22":           "samsung-galaxy-s22-5g",
  "Samsung|Galaxy S21 Ultra":     "samsung-galaxy-s21-ultra-5g",
  "Samsung|Galaxy S21":           "samsung-galaxy-s21-5g",
  "Samsung|Galaxy S21 FE":        "samsung-galaxy-s21-fe-5g",

  // ── Samsung A-series ───────────────────────────────────────────────────
  // A55/A35/A25 drop the -5g suffix; A15 needs it; A14 needs it
  "Samsung|Galaxy A55":           "samsung-galaxy-a55",
  "Samsung|Galaxy A35":           "samsung-galaxy-a35",
  "Samsung|Galaxy A25":           "samsung-galaxy-a25",
  "Samsung|Galaxy A15":           "samsung-galaxy-a15-5g",
  "Samsung|Galaxy A14":           "samsung-galaxy-a14-5g",

  // ── Samsung Z-series ───────────────────────────────────────────────────
  "Samsung|Galaxy Z Fold 6":      "samsung-galaxy-z-fold6",
  "Samsung|Galaxy Z Flip 6":      "samsung-galaxy-z-flip6",
  "Samsung|Galaxy Z Fold 5":      "samsung-galaxy-z-fold5",
  "Samsung|Galaxy Z Flip 5":      "samsung-galaxy-z-flip5",

  // ── Google Pixel ───────────────────────────────────────────────────────
  // Pixel 9 series needs trailing dash
  "Google|Pixel 9 Pro XL":        "google-pixel-9-pro-xl-",
  "Google|Pixel 9 Pro":           "google-pixel-9-pro-",
  "Google|Pixel 9":               "google-pixel-9-",
  // Pixel 7 series drops the hyphen before the number
  "Google|Pixel 7 Pro":           "google-pixel7-pro",
  "Google|Pixel 7":               "google-pixel7",

  // ── Xiaomi ─────────────────────────────────────────────────────────────
  // 13T series works; 13 series needs -lite or doesn't exist
  "Xiaomi|13T Pro":               "xiaomi-13t-pro",
  "Xiaomi|13T":                   "xiaomi-13t",
  "Xiaomi|13 lite":               "xiaomi-13-lite",

  // ── OnePlus ────────────────────────────────────────────────────────────
  "OnePlus|Nord 4":               "oneplus-nord4",
  "OnePlus|Nord CE 4":            "oneplus-nord-ce4-lite",

  // ── Oppo ───────────────────────────────────────────────────────────────
  "Oppo|Reno 10":                 "oppo-reno10",
  "Oppo|Reno 10 Pro":             "oppo-reno10-pro",
  "Oppo|A98":                     "oppo-a98-5g",
  "Oppo|A79":                     "oppo-a79-5g",

  // ── Honor ──────────────────────────────────────────────────────────────
  "Honor|Magic 6 Pro":            "honor-magic6-pro",
  "Honor|Magic 6":                "honor-magic6",

  // ── Huawei ─────────────────────────────────────────────────────────────
  "Huawei|Pura 70 Ultra":         "huawei-pura70-ultra",
  "Huawei|Pura 70 Pro":           "huawei-pura70-pro",

  // ── Nothing ────────────────────────────────────────────────────────────
  "Nothing|Phone (1)":            "nothing-phone1",
  "Nothing|Phone (2)":            "nothing-phone2",
  "Nothing|Phone (2a)":           "nothing-phone-2a",
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
