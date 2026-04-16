import { describe, it, expect } from "vitest";
import { DEVICES, displayDevice } from "@/lib/devices";

describe("DEVICES catalog", () => {
  it("has at least 150 entries", () => {
    expect(DEVICES.length).toBeGreaterThanOrEqual(150);
  });

  it("every device has brand and model", () => {
    for (const d of DEVICES) {
      expect(d.brand).toBeTruthy();
      expect(d.model).toBeTruthy();
    }
  });

  it("includes key brands", () => {
    const brands = new Set(DEVICES.map((d) => d.brand));
    expect(brands.has("Apple")).toBe(true);
    expect(brands.has("Samsung")).toBe(true);
    expect(brands.has("Google")).toBe(true);
  });
});

describe("displayDevice", () => {
  it("formats device with storage", () => {
    expect(displayDevice({ brand: "Apple", model: "iPhone 15 Pro", storage_gb: 256 })).toBe(
      "Apple iPhone 15 Pro 256Go"
    );
  });

  it("formats device without storage", () => {
    expect(displayDevice({ brand: "Google", model: "Pixel 8", storage_gb: null })).toBe(
      "Google Pixel 8"
    );
  });
});
