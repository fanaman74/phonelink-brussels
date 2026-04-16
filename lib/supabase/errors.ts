/**
 * Unified Supabase / Postgres error handler.
 * Maps PostgrestError codes and messages to localized toast keys.
 *
 * Usage (in a Server Action):
 *   const msg = mapSupabaseError(error, t);
 *   // Then pass msg back to the client for toast display.
 *
 * Usage (in a client component):
 *   const key = classifyError(error);
 *   toast.error(t(`errors.${key}`));
 */

export type ErrorKey =
  | "rate_limit"
  | "duplicate"
  | "forbidden"
  | "not_found"
  | "timeout"
  | "network"
  | "request_expired"
  | "unknown";

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
}

export function classifyError(error: SupabaseError | null): ErrorKey {
  if (!error) return "unknown";

  const { code, message } = error;

  // Postgres trigger rate limit
  if (message?.includes("rate_limit_exceeded")) return "rate_limit";

  // Postgres unique violation
  if (code === "23505") return "duplicate";

  // Row-level security / insufficient privilege
  if (code === "42501" || code === "PGRST301") return "forbidden";

  // Not found
  if (code === "PGRST116") return "not_found";

  // Statement timeout
  if (code === "57014") return "timeout";

  // Network / fetch errors (no code, but message hints)
  if (message?.toLowerCase().includes("fetch") || message?.toLowerCase().includes("network"))
    return "network";

  // Request already expired (custom trigger message)
  if (message?.includes("request_expired")) return "request_expired";

  return "unknown";
}

/**
 * Returns a boolean indicating whether the error is a "duplicate" that
 * should be silently swallowed (idempotent double-tap).
 */
export function isDuplicate(error: SupabaseError | null): boolean {
  return classifyError(error) === "duplicate";
}
