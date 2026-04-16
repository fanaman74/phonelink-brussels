import { describe, it, expect, vi, beforeEach } from "vitest";
import { isExpiredClientSide, isOpenClientSide, timeRemaining } from "@/lib/ttl";

const t = (key: string, params?: Record<string, unknown>) => {
  if (params) return `${key}:${JSON.stringify(params)}`;
  return key;
};

describe("isExpiredClientSide", () => {
  it("returns false when expiresAt is in the future", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isExpiredClientSide(future)).toBe(false);
  });

  it("returns true when expiresAt is past the skew buffer", () => {
    const past = new Date(Date.now() - 3 * 60_000).toISOString(); // 3 min ago
    expect(isExpiredClientSide(past)).toBe(true);
  });

  it("returns false when expiresAt is within the 2-min skew buffer", () => {
    const justExpired = new Date(Date.now() - 60_000).toISOString(); // 1 min ago, within buffer
    expect(isExpiredClientSide(justExpired)).toBe(false);
  });
});

describe("isOpenClientSide", () => {
  it("returns false when status is not open", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isOpenClientSide("matched", future)).toBe(false);
    expect(isOpenClientSide("expired", future)).toBe(false);
  });

  it("returns true when status is open and not expired", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isOpenClientSide("open", future)).toBe(true);
  });

  it("returns false when status is open but expired", () => {
    const past = new Date(Date.now() - 10 * 60_000).toISOString();
    expect(isOpenClientSide("open", past)).toBe(false);
  });
});

describe("timeRemaining", () => {
  it("returns null for expired requests", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(timeRemaining(past, t)).toBeNull();
  });

  it("returns minutes string for < 60 min remaining", () => {
    const soon = new Date(Date.now() + 30 * 60_000).toISOString();
    const result = timeRemaining(soon, t);
    expect(result).toContain("common.minutes");
  });

  it("returns hours string for >= 60 min remaining", () => {
    const later = new Date(Date.now() + 2 * 60 * 60_000).toISOString();
    const result = timeRemaining(later, t);
    expect(result).toContain("common.hours");
  });
});
