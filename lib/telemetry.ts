/**
 * Restro Zero-Block Telemetry SDK & Validation Primitives
 *
 * Implements the client-side Beacon API transport (`navigator.sendBeacon('/api/telemetry', payload)`)
 * and payload normalization/validation shared with the `/api/telemetry` ingest route.
 *
 * Telemetry is collected across ALL restaurant plans (STARTER, CARTA_DIGITAL, RESTRO_IA, BUSINESS)
 * so historical behavioral data is already available when a tenant upgrades or views reports.
 */

export const TELEMETRY_ENDPOINT = "/api/telemetry";

export const TELEMETRY_EVENTS = {
  MENU_VIEW: "menu_view",
  SCROLL_DEPTH: "scroll_depth",
  PRODUCT_IMPRESSION: "product_impression",
  ITEM_VIEW: "item_view",
  ITEM_DWELL: "item_dwell",
  ITEM_SHARE: "item_share",
  MODIFIER_INTERACTION: "modifier_interaction",
  CATEGORY_CLICK: "category_click",
  CATEGORY_DWELL: "category_dwell",
  SEARCH_QUERY: "search_query",
  CONTACT_INTERACTION: "contact_interaction",
  CART_OPEN: "cart_open",
  CART_ADD: "cart_add",
  CART_ITEM_UPDATE: "cart_item_update",
  CART_ITEM_REMOVE: "cart_item_remove",
  ORDER_TYPE_SELECT: "order_type_select",
  ORDER_STARTED: "order_started",
  ORDER_COMPLETED: "order_completed",
  ORDER_FAILED: "order_failed",
  WAITER_QR_GENERATED: "waiter_qr_generated",
  SESSION_SUMMARY: "session_summary",
} as const;

export type TelemetryEventName =
  | (typeof TELEMETRY_EVENTS)[keyof typeof TELEMETRY_EVENTS]
  | (string & {});

export interface TelemetryEventInput {
  tenantId: string;
  event: TelemetryEventName;
  sessionId?: string | null;
  data?: Record<string, unknown> | null;
  timestamp?: string;
}

export interface TelemetryBatchInput {
  tenantId: string;
  sessionId?: string | null;
  events: Array<{
    event: TelemetryEventName;
    sessionId?: string | null;
    data?: Record<string, unknown> | null;
    timestamp?: string;
  }>;
}

export type TelemetryRequestPayload = TelemetryEventInput | TelemetryBatchInput;

export interface NormalizedTelemetryRecord {
  tenantId: string;
  event: string;
  sessionId: string | null;
  data: string | null;
  userAgent: string | null;
  createdAt?: Date;
}

const SESSION_STORAGE_KEY = "restro_telemetry_sid";
const VISITOR_STORAGE_KEY = "restro_telemetry_vid";
const MAX_BATCH_SIZE = 50;
const MAX_DATA_JSON_CHARS = 8192;
const EVENT_NAME_REGEX = /^[a-zA-Z0-9_.:-]{1,64}$/;

let fallbackSessionId: string | null = null;
let fallbackVisitorId: string | null = null;

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Returns or creates an anonymous session identifier stored in `sessionStorage`.
 */
export function getTelemetrySessionId(): string {
  if (typeof window === "undefined") {
    return fallbackSessionId ?? (fallbackSessionId = generateId("sess"));
  }
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const created = generateId("sess");
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return fallbackSessionId ?? (fallbackSessionId = generateId("sess"));
  }
}

/**
 * Returns or creates an anonymous returning visitor identifier stored in `localStorage`.
 */
export function getTelemetryVisitorId(): string {
  if (typeof window === "undefined") {
    return fallbackVisitorId ?? (fallbackVisitorId = generateId("vis"));
  }
  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing) return existing;
    const created = generateId("vis");
    window.localStorage.setItem(VISITOR_STORAGE_KEY, created);
    return created;
  } catch {
    return fallbackVisitorId ?? (fallbackVisitorId = generateId("vis"));
  }
}

/**
 * Extracts lightweight browser context (device type, viewport, entry source, table param)
 * without touching layout-thrashing DOM properties.
 */
export function getBrowserTelemetryContext(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const width = window.innerWidth || 0;
    const height = window.innerHeight || 0;
    const deviceType = width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";

    const params = new URLSearchParams(window.location.search);
    const tableParam =
      params.get("table") ||
      params.get("tableId") ||
      params.get("mesa") ||
      params.get("qr") ||
      params.get("t") ||
      null;
    const activeProductView = params.get("activeProductView") || null;

    let entrySource = "direct";
    if (tableParam) {
      entrySource = "qr_table";
    } else if (activeProductView) {
      entrySource = "shared_product_link";
    } else if (typeof document !== "undefined" && document.referrer) {
      entrySource = "referral";
    }

    return {
      visitorId: getTelemetryVisitorId(),
      deviceType,
      viewportWidth: width,
      viewportHeight: height,
      entrySource,
      tableParam,
      path: window.location.pathname,
    };
  } catch {
    return {};
  }
}

/**
 * Dispatches a telemetry payload in the background using the native Beacon API
 * (`navigator.sendBeacon('/api/telemetry', payload)`).
 *
 * Zero-block guarantee:
 * - Never blocks main thread rendering or navigation.
 * - Falls back to `fetch(..., { keepalive: true })` if `sendBeacon` is unavailable or rejects.
 * - Never throws an error to the caller.
 */
export function sendTelemetryBeacon(payload: TelemetryRequestPayload): boolean {
  if (typeof window === "undefined") return false;

  try {
    const sessionId = payload.sessionId || getTelemetrySessionId();
    const enrichedPayload: TelemetryRequestPayload =
      "events" in payload
        ? {
            ...payload,
            sessionId,
          }
        : {
            ...payload,
            sessionId,
            timestamp: payload.timestamp || new Date().toISOString(),
          };

    const serialized = JSON.stringify(enrichedPayload);

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const queued = navigator.sendBeacon(TELEMETRY_ENDPOINT, serialized);
      if (queued) return true;
    }

    if (typeof fetch === "function") {
      void fetch(TELEMETRY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: serialized,
        keepalive: true,
      }).catch(() => {
        // Ignore network errors in fire-and-forget telemetry
      });
      return true;
    }
  } catch {
    // Never disrupt application UI
  }

  return false;
}

/**
 * Convenience helper to track a single telemetry event with automatic browser metadata enrichment.
 */
export function trackTelemetryEvent(
  tenantId: string,
  event: TelemetryEventName,
  data?: Record<string, unknown>,
  baseContext?: Record<string, unknown>
): boolean {
  if (!tenantId || !event) return false;

  const browserContext = getBrowserTelemetryContext();
  const mergedData: Record<string, unknown> = {
    ...browserContext,
    ...(baseContext || {}),
    ...(data || {}),
    clientTimestamp: new Date().toISOString(),
  };

  return sendTelemetryBeacon({
    tenantId,
    event,
    sessionId: getTelemetrySessionId(),
    data: mergedData,
  });
}

function sanitizeJsonString(data: unknown, timestamp?: string): string | null {
  if (data === undefined || data === null) {
    return timestamp ? JSON.stringify({ clientTimestamp: timestamp }) : null;
  }

  try {
    const obj =
      typeof data === "object" && !Array.isArray(data)
        ? { ...(data as Record<string, unknown>), ...(timestamp ? { clientTimestamp: timestamp } : {}) }
        : { value: data, ...(timestamp ? { clientTimestamp: timestamp } : {}) };

    const json = JSON.stringify(obj);
    if (json.length <= MAX_DATA_JSON_CHARS) {
      return json;
    }

    // Truncate oversized payload safely while preserving valid JSON
    return JSON.stringify({
      truncated: true,
      preview: json.slice(0, MAX_DATA_JSON_CHARS - 100),
    });
  } catch {
    return null;
  }
}

/**
 * Validates and normalizes raw incoming telemetry payloads (single event or batch)
 * for the lightweight `/api/telemetry` ingest route.
 */
export function validateAndNormalizeTelemetryPayload(
  rawBody: unknown,
  userAgent: string | null = null
): {
  valid: boolean;
  records: NormalizedTelemetryRecord[];
  error?: string;
} {
  if (!rawBody || typeof rawBody !== "object") {
    return { valid: false, records: [], error: "Invalid payload format" };
  }

  const body = rawBody as Record<string, unknown>;
  const tenantId = typeof body.tenantId === "string" ? body.tenantId.trim() : "";

  if (!tenantId || tenantId.length > 64) {
    return { valid: false, records: [], error: "Missing or invalid tenantId" };
  }

  const rootSessionId =
    typeof body.sessionId === "string" && body.sessionId.trim().length > 0
      ? body.sessionId.trim().slice(0, 128)
      : null;

  const cleanUserAgent =
    typeof userAgent === "string" && userAgent.trim().length > 0
      ? userAgent.trim().slice(0, 512)
      : null;

  // Case 1: Batch of events (`{ tenantId, sessionId?, events: [...] }`)
  if (Array.isArray(body.events)) {
    if (body.events.length === 0) {
      return { valid: false, records: [], error: "Empty events array" };
    }

    const slice = body.events.slice(0, MAX_BATCH_SIZE);
    const records: NormalizedTelemetryRecord[] = [];

    for (const item of slice) {
      if (!item || typeof item !== "object") continue;
      const evtObj = item as Record<string, unknown>;
      const eventName = typeof evtObj.event === "string" ? evtObj.event.trim() : "";
      if (!eventName || !EVENT_NAME_REGEX.test(eventName)) continue;

      const itemSessionId =
        typeof evtObj.sessionId === "string" && evtObj.sessionId.trim().length > 0
          ? evtObj.sessionId.trim().slice(0, 128)
          : rootSessionId;

      const timestamp = typeof evtObj.timestamp === "string" ? evtObj.timestamp : undefined;

      records.push({
        tenantId,
        event: eventName,
        sessionId: itemSessionId,
        data: sanitizeJsonString(evtObj.data, timestamp),
        userAgent: cleanUserAgent,
      });
    }

    if (records.length === 0) {
      return { valid: false, records: [], error: "No valid events in batch" };
    }

    return { valid: true, records };
  }

  // Case 2: Single event (`{ tenantId, event, sessionId?, data?, timestamp? }`)
  const eventName = typeof body.event === "string" ? body.event.trim() : "";
  if (!eventName || !EVENT_NAME_REGEX.test(eventName)) {
    return { valid: false, records: [], error: "Missing or invalid event name" };
  }

  const timestamp = typeof body.timestamp === "string" ? body.timestamp : undefined;

  return {
    valid: true,
    records: [
      {
        tenantId,
        event: eventName,
        sessionId: rootSessionId,
        data: sanitizeJsonString(body.data, timestamp),
        userAgent: cleanUserAgent,
      },
    ],
  };
}
