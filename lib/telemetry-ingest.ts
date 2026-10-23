import type { NormalizedTelemetryRecord } from "@/lib/telemetry";
import { analyticsRepository } from "@/lib/repositories/analytics.repository";

/**
 * Scalable Telemetry Ingestion Buffer & Queue Dispatcher
 *
 * Implements the two-tier ingestion strategy:
 * 1. High-scale queue mode: If `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` or
 *    `TELEMETRY_QUEUE_URL` is configured, deposits events into the external queue/buffer
 *    so individual clicks never hit PostgreSQL directly.
 * 2. Current & medium phase (PostgreSQL `AnalyticsEvent`): Coalesces concurrent incoming
 *    events in an in-memory micro-batch buffer and writes them with a single bulk
 *    `prisma.analyticsEvent.createMany` statement, plus periodic 90-day retention pruning.
 */

const FLUSH_BATCH_LIMIT = 100;
const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000; // Once per 24h per server instance
const DEFAULT_RETENTION_DAYS = 90;

const globalBuffer = globalThis as unknown as {
  __restroTelemetryBuffer?: NormalizedTelemetryRecord[];
  __restroTelemetryFlushPromise?: Promise<void> | null;
  __restroTelemetryLastPruneAt?: number;
};

function getBuffer(): NormalizedTelemetryRecord[] {
  if (!globalBuffer.__restroTelemetryBuffer) {
    globalBuffer.__restroTelemetryBuffer = [];
  }
  return globalBuffer.__restroTelemetryBuffer;
}

/**
 * Optional external queue adapter (Upstash Redis list or generic Queue HTTP endpoint).
 * Returns `true` if the batch was handed off to an external queue, or `false` to fall back to Postgres.
 */
async function tryPushToExternalQueue(batch: NormalizedTelemetryRecord[]): Promise<boolean> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const response = await fetch(`${upstashUrl.replace(/\/$/, "")}/rpush/restro:telemetry:events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch.map((item) => JSON.stringify(item))),
      });
      if (response.ok) return true;
    } catch (err) {
      console.warn("[telemetry-ingest] External Upstash queue unavailable, falling back to DB:", err);
    }
  }

  const queueWebhookUrl = process.env.TELEMETRY_QUEUE_URL;
  if (queueWebhookUrl) {
    try {
      const response = await fetch(queueWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.TELEMETRY_QUEUE_SECRET
            ? { Authorization: `Bearer ${process.env.TELEMETRY_QUEUE_SECRET}` }
            : {}),
        },
        body: JSON.stringify({ events: batch }),
      });
      if (response.ok) return true;
    } catch (err) {
      console.warn("[telemetry-ingest] External queue webhook unavailable, falling back to DB:", err);
    }
  }

  return false;
}

/**
 * Runs opportunistic retention cleanup at most once every 24 hours.
 */
async function maybeRunPeriodicPruning(): Promise<void> {
  const now = Date.now();
  const lastPrune = globalBuffer.__restroTelemetryLastPruneAt ?? 0;
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;

  globalBuffer.__restroTelemetryLastPruneAt = now;
  const retentionDays = Number(process.env.TELEMETRY_RETENTION_DAYS) || DEFAULT_RETENTION_DAYS;

  try {
    await analyticsRepository.pruneExpiredEvents(retentionDays);
  } catch {
    // Non-fatal: ignore pruning errors during normal ingestion
  }
}

/**
 * Drains the in-memory telemetry buffer and persists batches to the external queue or Postgres.
 */
export async function flushTelemetryBuffer(): Promise<void> {
  if (globalBuffer.__restroTelemetryFlushPromise) {
    return globalBuffer.__restroTelemetryFlushPromise;
  }

  const buffer = getBuffer();
  if (buffer.length === 0) return;

  const runFlush = async () => {
    while (buffer.length > 0) {
      const batch = buffer.splice(0, FLUSH_BATCH_LIMIT);
      try {
        const queuedExternally = await tryPushToExternalQueue(batch);
        if (!queuedExternally) {
          await analyticsRepository.ingestBatch(batch);
        }
      } catch (err) {
        // Log gently and drop malformed/orphan tenant records rather than crashing the worker
        console.warn("[telemetry-ingest] Failed to persist telemetry batch:", err);
      }
    }

    await maybeRunPeriodicPruning();
  };

  globalBuffer.__restroTelemetryFlushPromise = runFlush().finally(() => {
    globalBuffer.__restroTelemetryFlushPromise = null;
  });

  return globalBuffer.__restroTelemetryFlushPromise;
}

/**
 * Enqueues validated telemetry records into the write-behind buffer and triggers an async flush.
 */
export async function enqueueTelemetryRecords(
  records: NormalizedTelemetryRecord[]
): Promise<void> {
  if (!records || records.length === 0) return;

  const buffer = getBuffer();
  buffer.push(...records);

  await flushTelemetryBuffer();
}
