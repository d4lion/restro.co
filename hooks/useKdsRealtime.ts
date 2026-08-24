import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type RealtimePayload = {
  event?: string;
  schema?: string;
  table?: string;
  record?: any;
  old_record?: any;
  [key: string]: any;
};

/**
 * Subscribes to the realtime order channel for a specific tenant.
 * Listens for broadcast events emitted by the PostgreSQL triggers.
 */
export function subscribeToKdsOrders(
  tenantId: string,
  onChange: (payload: RealtimePayload) => void,
  onStatusChange?: (status: string) => void
) {
  if (!tenantId) return () => {};

  const supabase = createClient();
  const channel = supabase
    .channel(`orders:${tenantId}`, { config: { private: true } })
    .on("broadcast", { event: "INSERT" }, (msg) => onChange(msg.payload))
    .on("broadcast", { event: "UPDATE" }, (msg) => onChange(msg.payload))
    .on("broadcast", { event: "DELETE" }, (msg) => onChange(msg.payload))
    .subscribe((status) => {
      if (onStatusChange) {
        onStatusChange(status);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * React hook wrapper for KDS Realtime orders subscription
 */
export function useKdsRealtime(
  tenantId: string | undefined,
  onChange: (payload: RealtimePayload) => void,
  onStatusChange?: (status: string) => void
) {
  useEffect(() => {
    if (!tenantId) return;

    const unsubscribe = subscribeToKdsOrders(tenantId, onChange, onStatusChange);
    return () => {
      unsubscribe();
    };
  }, [tenantId, onChange, onStatusChange]);
}
