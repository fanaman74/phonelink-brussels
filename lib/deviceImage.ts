/**
 * Generates a GSMArena phone image URL for a given brand + model.
 * Pattern: https://fdn2.gsmarena.com/vv/bigpic/{brand-lower}-{model-slug}.jpg
 *
 * Falls back to SVG silhouette when image fails to load (handled in component).
 */
export function getDeviceImageUrl(brand: string, model: string): string {
  const slug = `${brand} ${model}`
    .toLowerCase()
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `https://fdn2.gsmarena.com/vv/bigpic/${slug}.jpg`;
}
