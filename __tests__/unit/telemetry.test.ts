import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const { mockCreateMany, mockDeleteMany, mockFindMany } = vi.hoisted(() => ({
  mockCreateMany: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    analyticsEvent: {
      createMany: mockCreateMany,
      deleteMany: mockDeleteMany,
      findMany: mockFindMany,
    },
  },
}));

import {
  TELEMETRY_ENDPOINT,
  TELEMETRY_EVENTS,
  validateAndNormalizeTelemetryPayload,
  sendTelemetryBeacon,
  trackTelemetryEvent,
} from "@/lib/telemetry";
import { analyticsRepository } from "@/lib/repositories/analytics.repository";
import { POST } from "@/app/api/telemetry/route";

describe("Zero-Block Telemetry Architecture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMany.mockResolvedValue({ count: 1 });
    mockDeleteMany.mockResolvedValue({ count: 5 });
    mockFindMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("validateAndNormalizeTelemetryPayload", () => {
    it("normalizes a single telemetry event payload", () => {
      const result = validateAndNormalizeTelemetryPayload(
        {
          tenantId: "tenant_123",
          event: TELEMETRY_EVENTS.ITEM_DWELL,
          sessionId: "sess_abc",
          data: {
            itemId: "item_1",
            itemName: "Bandeja Paisa",
            dwellTimeMs: 14500,
            plan: "STARTER",
          },
        },
        "Mozilla/5.0 (iPhone)"
      );

      expect(result.valid).toBe(true);
      expect(result.records).toHaveLength(1);
      expect(result.records[0].tenantId).toBe("tenant_123");
      expect(result.records[0].event).toBe("item_dwell");
      expect(result.records[0].sessionId).toBe("sess_abc");
      expect(result.records[0].userAgent).toBe("Mozilla/5.0 (iPhone)");
      expect(JSON.parse(result.records[0].data!)).toMatchObject({
        itemId: "item_1",
        itemName: "Bandeja Paisa",
        dwellTimeMs: 14500,
        plan: "STARTER",
      });
    });

    it("normalizes a batch of telemetry events", () => {
      const result = validateAndNormalizeTelemetryPayload({
        tenantId: "tenant_123",
        sessionId: "sess_batch",
        events: [
          {
            event: TELEMETRY_EVENTS.PRODUCT_IMPRESSION,
            data: { itemId: "p1", itemName: "Limonada" },
          },
          {
            event: TELEMETRY_EVENTS.SCROLL_DEPTH,
            data: { depthPct: 50, timeToReachMs: 3200 },
          },
        ],
      });

      expect(result.valid).toBe(true);
      expect(result.records).toHaveLength(2);
      expect(result.records[0].event).toBe("product_impression");
      expect(result.records[1].event).toBe("scroll_depth");
      expect(result.records[0].sessionId).toBe("sess_batch");
    });

    it("rejects payloads with missing tenantId or invalid event names", () => {
      expect(validateAndNormalizeTelemetryPayload({ event: "menu_view" }).valid).toBe(false);
      expect(
        validateAndNormalizeTelemetryPayload({
          tenantId: "tenant_123",
          event: "invalid event with spaces!",
        }).valid
      ).toBe(false);
    });
  });

  describe("Frontend Beacon API Dispatcher (sendTelemetryBeacon & trackTelemetryEvent)", () => {
    it("dispatches via navigator.sendBeacon('/api/telemetry', payload) regardless of plan", () => {
      const sendBeaconMock = vi.fn().mockReturnValue(true);
      vi.stubGlobal("window", {
        innerWidth: 390,
        innerHeight: 844,
        location: { search: "?table=mesa-4", pathname: "/restaurant/demo" },
        sessionStorage: {
          getItem: vi.fn().mockReturnValue("sess_fixed"),
          setItem: vi.fn(),
        },
        localStorage: {
          getItem: vi.fn().mockReturnValue("vis_fixed"),
          setItem: vi.fn(),
        },
      });
      vi.stubGlobal("navigator", {
        sendBeacon: sendBeaconMock,
      });

      const ok = trackTelemetryEvent("tenant_starter", TELEMETRY_EVENTS.ITEM_SHARE, {
        itemId: "dish_99",
        itemName: "Churrasco",
        method: "native_share",
        plan: "STARTER",
      });

      expect(ok).toBe(true);
      expect(sendBeaconMock).toHaveBeenCalledTimes(1);
      const [endpoint, serializedBody] = sendBeaconMock.mock.calls[0];
      expect(endpoint).toBe(TELEMETRY_ENDPOINT);

      const parsed = JSON.parse(serializedBody);
      expect(parsed.tenantId).toBe("tenant_starter");
      expect(parsed.event).toBe("item_share");
      expect(parsed.sessionId).toBe("sess_fixed");
      expect(parsed.data).toMatchObject({
        itemId: "dish_99",
        itemName: "Churrasco",
        method: "native_share",
        plan: "STARTER",
        entrySource: "qr_table",
        tableParam: "mesa-4",
        deviceType: "mobile",
      });
    });

    it("falls back to keepalive fetch when navigator.sendBeacon returns false", () => {
      const sendBeaconMock = vi.fn().mockReturnValue(false);
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });

      vi.stubGlobal("window", {
        innerWidth: 1280,
        innerHeight: 800,
        location: { search: "", pathname: "/restaurant/demo" },
      });
      vi.stubGlobal("navigator", { sendBeacon: sendBeaconMock });
      vi.stubGlobal("fetch", fetchMock);

      const ok = sendTelemetryBeacon({
        tenantId: "tenant_1",
        event: TELEMETRY_EVENTS.SCROLL_DEPTH,
        data: { depthPct: 75 },
      });

      expect(ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        TELEMETRY_ENDPOINT,
        expect.objectContaining({
          method: "POST",
          keepalive: true,
        })
      );
    });
  });

  describe("POST /api/telemetry Ingest Route", () => {
    it("validates payload, responds 200 OK immediately, and persists events via createMany", async () => {
      const req = new NextRequest("http://localhost:3000/api/telemetry", {
        method: "POST",
        headers: {
          "content-type": "text/plain;charset=UTF-8",
          "user-agent": "TestAgent/1.0",
        },
        body: JSON.stringify({
          tenantId: "tenant_abc",
          event: TELEMETRY_EVENTS.ITEM_VIEW,
          sessionId: "sess_1",
          data: { itemId: "item_1", itemName: "Hamburguesa Artesanal", price: 28000 },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ ok: true, accepted: 1 });

      // Wait a microtask tick for the background buffer flush
      await new Promise((r) => setTimeout(r, 15));

      expect(mockCreateMany).toHaveBeenCalledTimes(1);
      expect(mockCreateMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            tenantId: "tenant_abc",
            event: "item_view",
            sessionId: "sess_1",
            userAgent: "TestAgent/1.0",
          }),
        ],
      });
    });

    it("returns 400 on malformed or invalid payload", async () => {
      const req = new NextRequest("http://localhost:3000/api/telemetry", {
        method: "POST",
        body: JSON.stringify({ invalid: true }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe("analyticsRepository Behavioral Aggregation & Retention", () => {
    it("computes product dwell time, CTR, scroll funnel, and zero-result searches accurately", async () => {
      const now = new Date();
      mockFindMany.mockResolvedValue([
        {
          event: TELEMETRY_EVENTS.MENU_VIEW,
          sessionId: "s1",
          createdAt: now,
          data: JSON.stringify({ visitorId: "v1", entrySource: "qr_table", deviceType: "mobile" }),
        },
        {
          event: TELEMETRY_EVENTS.SCROLL_DEPTH,
          sessionId: "s1",
          createdAt: now,
          data: JSON.stringify({ depthPct: 75 }),
        },
        {
          event: TELEMETRY_EVENTS.PRODUCT_IMPRESSION,
          sessionId: "s1",
          createdAt: now,
          data: JSON.stringify({ itemId: "prod_1", itemName: "Ceviche Peruano", price: 35000 }),
        },
        {
          event: TELEMETRY_EVENTS.PRODUCT_IMPRESSION,
          sessionId: "s2",
          createdAt: now,
          data: JSON.stringify({ itemId: "prod_1", itemName: "Ceviche Peruano", price: 35000 }),
        },
        {
          event: TELEMETRY_EVENTS.ITEM_VIEW,
          sessionId: "s1",
          createdAt: now,
          data: JSON.stringify({ itemId: "prod_1", itemName: "Ceviche Peruano", price: 35000 }),
        },
        {
          event: TELEMETRY_EVENTS.ITEM_DWELL,
          sessionId: "s1",
          createdAt: now,
          data: JSON.stringify({
            itemId: "prod_1",
            itemName: "Ceviche Peruano",
            dwellTimeMs: 12000,
          }),
        },
        {
          event: TELEMETRY_EVENTS.ITEM_SHARE,
          sessionId: "s1",
          createdAt: now,
          data: JSON.stringify({ itemId: "prod_1", itemName: "Ceviche Peruano" }),
        },
        {
          event: TELEMETRY_EVENTS.SEARCH_QUERY,
          sessionId: "s1",
          createdAt: now,
          data: JSON.stringify({ query: "ramen", resultsCount: 0 }),
        },
      ]);

      const report = await analyticsRepository.getBehavioralReportForTenant("tenant_abc", 30);

      expect(report.totalMenuViews).toBe(1);
      expect(report.uniqueSessions).toBe(2);
      expect(report.uniqueVisitors).toBe(1);
      expect(report.scrollFunnel).toEqual({
        depth25: 1,
        depth50: 1,
        depth75: 1,
        depth100: 0,
      });

      expect(report.topProducts).toHaveLength(1);
      const ceviche = report.topProducts[0];
      expect(ceviche.itemId).toBe("prod_1");
      expect(ceviche.impressions).toBe(2);
      expect(ceviche.views).toBe(1);
      expect(ceviche.ctrPct).toBe(50);
      expect(ceviche.avgDwellTimeSeconds).toBe(12);
      expect(ceviche.shares).toBe(1);
      // Avg dwell >= 8s (12s) and 0 cart additions -> highInterestLowConversion = true
      expect(ceviche.highInterestLowConversion).toBe(true);

      expect(report.searchTerms).toHaveLength(1);
      expect(report.searchTerms[0]).toMatchObject({
        query: "ramen",
        count: 1,
        zeroResultsCount: 1,
      });

      // Dynamic AI insights generated from behavioral data
      expect(report.insights.some((i) => i.category === "conversion")).toBe(true);
      expect(report.insights.some((i) => i.category === "viral")).toBe(true);
      expect(report.insights.some((i) => i.category === "search")).toBe(true);
    });

    it("prunes expired detailed events older than retention window", async () => {
      const res = await analyticsRepository.pruneExpiredEvents(60);
      expect(res.deletedCount).toBe(5);
      expect(mockDeleteMany).toHaveBeenCalledTimes(1);
    });

    it("consolidates rollup snapshot and prunes expired events in runRollupAndMaintenance", async () => {
      const now = new Date();
      mockFindMany.mockResolvedValue([
        {
          event: TELEMETRY_EVENTS.ITEM_VIEW,
          sessionId: "s1",
          createdAt: now,
          data: JSON.stringify({ itemId: "prod_1", itemName: "Ceviche Peruano", price: 35000 }),
        },
      ]);

      const summary = await analyticsRepository.runRollupAndMaintenance({
        tenantId: "tenant_abc",
        days: 30,
        retentionDays: 90,
      });

      expect(summary.processedTenants).toBe(1);
      expect(summary.deletedExpiredEvents).toBe(5);
      expect(mockCreateMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            tenantId: "tenant_abc",
            event: "telemetry_rollup_snapshot",
            sessionId: "rollup:30d",
          }),
        ],
      });
    });
  });
});
