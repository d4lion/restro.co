import { NextResponse, after, type NextRequest } from "next/server";
import { validateAndNormalizeTelemetryPayload } from "@/lib/telemetry";
import { enqueueTelemetryRecords } from "@/lib/telemetry-ingest";

/**
 * Lightweight Telemetry Ingestion Endpoint (`POST /api/telemetry`)
 *
 * Designed for `navigator.sendBeacon('/api/telemetry', payload)`:
 * 1. Validates and normalizes the incoming single event or batch payload immediately.
 * 2. Responds `200 OK` without blocking on database I/O.
 * 3. Offloads persistence to `after()` + `enqueueTelemetryRecords` (which flushes to
 *    Upstash/Queue if configured, or bulk-inserts into Postgres `AnalyticsEvent`).
 */
export async function POST(request: NextRequest) {
  let rawText = "";
  try {
    rawText = await request.text();
  } catch {
    return NextResponse.json({ ok: false, error: "Unreadable request body" }, { status: 400 });
  }

  if (!rawText || rawText.length > 65_536) {
    return NextResponse.json(
      { ok: false, error: "Empty or oversized telemetry payload" },
      { status: 400 }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed JSON payload" }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent");
  const validation = validateAndNormalizeTelemetryPayload(parsed, userAgent);

  if (!validation.valid || validation.records.length === 0) {
    return NextResponse.json(
      { ok: false, error: validation.error || "Invalid telemetry payload" },
      { status: 400 }
    );
  }

  const records = validation.records;

  // Schedule non-blocking persistence after the 200 OK response is sent
  try {
    after(async () => {
      await enqueueTelemetryRecords(records);
    });
  } catch {
    // Fallback when invoked outside Next.js RequestContext (e.g. unit tests)
    void enqueueTelemetryRecords(records);
  }

  return NextResponse.json(
    { ok: true, accepted: records.length },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
