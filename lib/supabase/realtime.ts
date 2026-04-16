"use client";

/**
 * Realtime subscription helpers.
 *
 * Supabase Realtime Postgres Changes respects RLS automatically —
 * users only receive rows their RLS policies allow SELECT on.
 *
 * All subscriptions filter by network_id for cheap server-side filtering
 * (avoids broadcasting every row to every client).
 */

import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client";

type Table = "requests" | "responses" | "inventory" | "recovered_sales";
type EventType = "INSERT" | "UPDATE" | "DELETE" | "*";

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

/**
 * Subscribe to Postgres Changes on a table, filtered by network_id.
 *
 * @param table   - The table to watch
 * @param networkId - The network_id to filter on (server-side)
 * @param event   - INSERT | UPDATE | DELETE | * (default *)
 * @param callback - Called with the full payload on each change
 * @returns A subscription handle with an `unsubscribe()` method
 */
export function subscribeToTable<T extends Record<string, unknown>>(
  table: Table,
  networkId: string,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  event: EventType = "*"
): RealtimeSubscription {
  const supabase = getSupabaseBrowserClient();
  const channelName = `${table}:${networkId}:${Math.random().toString(36).slice(2)}`;

  const channel = supabase
    .channel(channelName)
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      {
        event,
        schema: "public",
        table,
        filter: `network_id=eq.${networkId}`,
      },
      (payload: RealtimePostgresChangesPayload<T>) => callback(payload)
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Subscribe to open requests in the network.
 * Fires on INSERT (new request) and UPDATE (status change).
 */
export function subscribeToRequests(
  networkId: string,
  callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
): RealtimeSubscription {
  return subscribeToTable("requests", networkId, callback, "*");
}

/**
 * Subscribe to responses on the network (to update "matched" banners).
 */
export function subscribeToResponses(
  networkId: string,
  callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
): RealtimeSubscription {
  return subscribeToTable("responses", networkId, callback, "INSERT");
}

/**
 * Subscribe to inventory changes (for search results freshness).
 */
export function subscribeToInventory(
  networkId: string,
  callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
): RealtimeSubscription {
  return subscribeToTable("inventory", networkId, callback, "UPDATE");
}
