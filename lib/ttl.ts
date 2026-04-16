/**
 * Client-side TTL check for requests.
 * Defense-in-depth against pg_cron failure or clock skew.
 *
 * A request is considered expired client-side if its expires_at is
 * more than CLOCK_SKEW_BUFFER_MS in the past. The buffer absorbs
 * ±2 min clock skew between client and server.
 */

const CLOCK_SKEW_BUFFER_MS = 2 * 60 * 1000; // 2 minutes

export function isExpiredClientSide(expiresAt: string): boolean {
  const expiry = new Date(expiresAt).getTime();
  return Date.now() > expiry + CLOCK_SKEW_BUFFER_MS;
}

export function isOpenClientSide(status: string, expiresAt: string): boolean {
  if (status !== "open") return false;
  return !isExpiredClientSide(expiresAt);
}

/**
 * Returns a human-readable time-remaining string.
 * Returns null if expired.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function timeRemaining(
  expiresAt: string,
  t: (key: string, params?: any) => string
): string | null {
  const msLeft = new Date(expiresAt).getTime() - Date.now();
  if (msLeft <= 0) return null;

  const minutesLeft = Math.ceil(msLeft / 60_000);
  if (minutesLeft < 60) return t("common.minutes", { n: minutesLeft });

  const hoursLeft = Math.floor(minutesLeft / 60);
  return t("common.hours", { n: hoursLeft });
}
