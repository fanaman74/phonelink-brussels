import { describe, it, expect } from "vitest";
import { classifyError, isDuplicate } from "@/lib/supabase/errors";

describe("classifyError", () => {
  it("returns unknown for null", () => {
    expect(classifyError(null)).toBe("unknown");
  });

  it("classifies unique violation as duplicate", () => {
    expect(classifyError({ code: "23505", message: "unique violation" })).toBe("duplicate");
  });

  it("classifies RLS error as forbidden", () => {
    expect(classifyError({ code: "42501" })).toBe("forbidden");
    expect(classifyError({ code: "PGRST301" })).toBe("forbidden");
  });

  it("classifies not found as not_found", () => {
    expect(classifyError({ code: "PGRST116" })).toBe("not_found");
  });

  it("classifies statement timeout as timeout", () => {
    expect(classifyError({ code: "57014" })).toBe("timeout");
  });

  it("classifies rate limit trigger message", () => {
    expect(classifyError({ message: "rate_limit_exceeded" })).toBe("rate_limit");
  });

  it("classifies network error by message", () => {
    expect(classifyError({ message: "fetch failed" })).toBe("network");
  });

  it("returns unknown for unrecognized error", () => {
    expect(classifyError({ code: "99999", message: "something" })).toBe("unknown");
  });
});

describe("isDuplicate", () => {
  it("returns true for 23505", () => {
    expect(isDuplicate({ code: "23505" })).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isDuplicate({ code: "42501" })).toBe(false);
    expect(isDuplicate(null)).toBe(false);
  });
});
