import { NextResponse, type NextRequest } from "next/server";
import { analyticsRepository } from "@/lib/repositories/analytics.repository";
import { getSession } from "@/lib/session";

/**
 * Telemetry Rollup & Maintenance Endpoint (`/api/telemetry/rollup`)
 *
 * Native background processor (replaces the need for an external AWS Lambda):
 * - Can be triggered on a schedule via Vercel Cron / Supabase pg_cron (`GET` or `POST` with `Bearer CRON_SECRET`)
 * - Or triggered on-demand for a specific authenticated tenant from the dashboard.
 * - Pre-aggregates behavioral metrics, caches rollup snapshots, revalidates Next.js Data Cache,
 *   and prunes expired detailed events older than the retention window (default 90 days).
 */
async function handleRollup(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isAuthorizedCron = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

  let targetTenantId: string | undefined =
    request.nextUrl.searchParams.get("tenantId") || undefined;

  if (!isAuthorizedCron) {
    const session = await getSession();
    if (session?.tenantId) {
      targetTenantId = session.tenantId;
    } else if (cronSecret) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized rollup trigger" },
        { status: 401 }
      );
    }
  }

  const days = Math.min(365, Math.max(1, Number(request.nextUrl.searchParams.get("days")) || 30));
  const retentionDays = Math.max(
    7,
    Number(request.nextUrl.searchParams.get("retentionDays")) ||
      Number(process.env.TELEMETRY_RETENTION_DAYS) ||
      90
  );

  try {
    const summary = await analyticsRepository.runRollupAndMaintenance({
      tenantId: targetTenantId,
      days,
      retentionDays,
    });

    return NextResponse.json(
      {
        ok: true,
        ...summary,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/telemetry/rollup] Rollup error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to run telemetry rollup" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleRollup(request);
}

export async function POST(request: NextRequest) {
  return handleRollup(request);
}
