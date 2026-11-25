import { describe, it, expect, vi, beforeEach } from "vitest";
import { marketResearchRepository } from "@/lib/repositories/market-research.repository";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tenant: {
      findMany: vi.fn(),
    },
  },
}));

describe("Market Research Repository & Benchmarking Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate tenant metrics and platform aggregations correctly", async () => {
    const mockTenants = [
      {
        id: "tenant-1",
        name: "Restaurante Gourmet",
        slug: "restaurante-gourmet",
        city: "Bogotá",
        country: "Colombia",
        isActive: true,
        createdAt: new Date("2026-01-01"),
        subscription: {
          plan: {
            key: "BUSINESS",
            label: "Business",
          },
        },
        orders: [
          { id: "o1", total: 100000, status: "DELIVERED", type: "DINE_IN", createdAt: new Date() },
          { id: "o2", total: 150000, status: "DELIVERED", type: "TAKEOUT", createdAt: new Date() },
          { id: "o3", total: 50000, status: "CANCELLED", type: "DELIVERY", createdAt: new Date() },
        ],
        users: [{ id: "u1" }, { id: "u2" }],
        _count: { tables: 12, orders: 3 },
        menus: [
          {
            categories: [
              { _count: { items: 8 } },
              { _count: { items: 12 } },
            ],
          },
        ],
      },
      {
        id: "tenant-2",
        name: "Café Express",
        slug: "cafe-express",
        city: "Medellín",
        country: "Colombia",
        isActive: true,
        createdAt: new Date("2026-02-01"),
        subscription: {
          plan: {
            key: "STARTER",
            label: "Starter",
          },
        },
        orders: [
          { id: "o4", total: 20000, status: "DELIVERED", type: "DINE_IN", createdAt: new Date() },
        ],
        users: [{ id: "u3" }],
        _count: { tables: 4, orders: 1 },
        menus: [
          {
            categories: [{ _count: { items: 5 } }],
          },
        ],
      },
    ];

    vi.mocked(prisma.tenant.findMany).mockResolvedValue(mockTenants as any);

    const report = await marketResearchRepository.getMarketResearchReport();

    // Verify Tenant 1
    const t1 = report.tenants.find((t) => t.tenantId === "tenant-1");
    expect(t1).toBeDefined();
    // GMV: Cancelled orders excluded from GMV
    expect(t1?.totalSalesCop).toBe(250000);
    expect(t1?.totalOrders).toBe(3);
    expect(t1?.completedOrders).toBe(2);
    expect(t1?.cancelledOrders).toBe(1);
    expect(t1?.completionRatePct).toBe(67); // 2/3 * 100 = 66.6 -> 67
    expect(t1?.averageTicketCop).toBe(83333); // 250000 / 3
    expect(t1?.performanceTier).toBe("HIGH"); // sales >= 200000
    expect(t1?.totalMenuItems).toBe(20); // 8 + 12
    expect(t1?.totalTables).toBe(12);
    expect(t1?.channelBreakdown.dineIn).toBe(1);
    expect(t1?.channelBreakdown.takeout).toBe(1);
    expect(t1?.channelBreakdown.delivery).toBe(1);

    // Verify Tenant 2
    const t2 = report.tenants.find((t) => t.tenantId === "tenant-2");
    expect(t2).toBeDefined();
    expect(t2?.totalSalesCop).toBe(20000);
    expect(t2?.totalOrders).toBe(1);
    expect(t2?.performanceTier).toBe("GROWTH"); // sales > 0 but < 50000

    // Verify Platform Summary
    expect(report.summary.totalTenants).toBe(2);
    expect(report.summary.totalOrders).toBe(4);
    expect(report.summary.totalSalesCop).toBe(270000); // 250000 + 20000
    expect(report.summary.globalAverageTicketCop).toBe(67500); // 270000 / 4
    expect(report.summary.totalTables).toBe(16); // 12 + 4
    expect(report.summary.totalMenuItems).toBe(25); // 20 + 5
  });
});
