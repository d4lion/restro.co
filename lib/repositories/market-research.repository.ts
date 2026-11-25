import { prisma } from "@/lib/prisma";
import type { PlanKey } from "@/lib/types";

export interface TenantMarketBenchmark {
  tenantId: string;
  name: string;
  slug: string;
  city: string | null;
  country: string;
  isActive: boolean;
  createdAt: Date;
  planKey: PlanKey;
  planLabel: string;
  totalSalesCop: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  completionRatePct: number;
  averageTicketCop: number;
  channelBreakdown: {
    dineIn: number;
    takeout: number;
    delivery: number;
    dineInPct: number;
    takeoutPct: number;
    deliveryPct: number;
  };
  totalTables: number;
  totalMenuItems: number;
  totalUsers: number;
  performanceTier: "HIGH" | "MEDIUM" | "GROWTH" | "INACTIVE";
}

export interface PlatformMarketReport {
  tenants: TenantMarketBenchmark[];
  summary: {
    totalTenants: number;
    totalOrders: number;
    totalSalesCop: number;
    globalAverageTicketCop: number;
    globalAverageOrdersPerTenant: number;
    globalAverageSalesPerTenant: number;
    totalTables: number;
    totalMenuItems: number;
  };
}

export const marketResearchRepository = {
  /**
   * Aggregate deep market metrics across all tenants for comparative benchmarking
   * and associative summation (QlikSense style).
   */
  async getMarketResearchReport(): Promise<PlatformMarketReport> {
    const rawTenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          include: { plan: true },
        },
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            type: true,
            createdAt: true,
          },
        },
        users: {
          select: { id: true },
        },
        _count: {
          select: {
            tables: true,
            orders: true,
          },
        },
        menus: {
          select: {
            categories: {
              select: {
                _count: {
                  select: { items: true },
                },
              },
            },
          },
        },
      },
    });

    let globalSales = 0;
    let globalOrders = 0;
    let globalTables = 0;
    let globalMenuItems = 0;

    const tenants: TenantMarketBenchmark[] = rawTenants.map((t) => {
      let sales = 0;
      let completed = 0;
      let cancelled = 0;
      let dineIn = 0;
      let takeout = 0;
      let delivery = 0;

      t.orders.forEach((o) => {
        if (o.status !== "CANCELLED") {
          sales += o.total;
        }
        if (o.status === "DELIVERED") completed++;
        if (o.status === "CANCELLED") cancelled++;

        if (o.type === "DINE_IN") dineIn++;
        else if (o.type === "TAKEOUT") takeout++;
        else if (o.type === "DELIVERY") delivery++;
      });

      const totalOrdersCount = t.orders.length;
      const completionRatePct =
        totalOrdersCount > 0 ? Math.round((completed / totalOrdersCount) * 100) : 0;
      const averageTicketCop =
        totalOrdersCount > 0 ? Math.round(sales / totalOrdersCount) : 0;

      const dineInPct = totalOrdersCount > 0 ? Math.round((dineIn / totalOrdersCount) * 100) : 0;
      const takeoutPct = totalOrdersCount > 0 ? Math.round((takeout / totalOrdersCount) * 100) : 0;
      const deliveryPct = totalOrdersCount > 0 ? Math.round((delivery / totalOrdersCount) * 100) : 0;

      // Calculate total menu items count
      let itemsCount = 0;
      t.menus.forEach((m) => {
        m.categories.forEach((c) => {
          itemsCount += c._count.items;
        });
      });

      // Performance classification
      let performanceTier: TenantMarketBenchmark["performanceTier"] = "INACTIVE";
      if (sales >= 200000 || totalOrdersCount >= 10) {
        performanceTier = "HIGH";
      } else if (sales >= 50000 || totalOrdersCount >= 3) {
        performanceTier = "MEDIUM";
      } else if (sales > 0 || totalOrdersCount > 0) {
        performanceTier = "GROWTH";
      }

      globalSales += sales;
      globalOrders += totalOrdersCount;
      globalTables += t._count.tables;
      globalMenuItems += itemsCount;

      return {
        tenantId: t.id,
        name: t.name,
        slug: t.slug,
        city: t.city,
        country: t.country,
        isActive: t.isActive,
        createdAt: t.createdAt,
        planKey: (t.subscription?.plan.key || "STARTER") as PlanKey,
        planLabel: t.subscription?.plan.label || "Starter",
        totalSalesCop: sales,
        totalOrders: totalOrdersCount,
        completedOrders: completed,
        cancelledOrders: cancelled,
        completionRatePct,
        averageTicketCop,
        channelBreakdown: {
          dineIn,
          takeout,
          delivery,
          dineInPct,
          takeoutPct,
          deliveryPct,
        },
        totalTables: t._count.tables,
        totalMenuItems: itemsCount,
        totalUsers: t.users.length,
        performanceTier,
      };
    });

    const totalTenants = tenants.length;
    const globalAverageTicketCop =
      globalOrders > 0 ? Math.round(globalSales / globalOrders) : 0;
    const globalAverageOrdersPerTenant =
      totalTenants > 0 ? Math.round((globalOrders / totalTenants) * 10) / 10 : 0;
    const globalAverageSalesPerTenant =
      totalTenants > 0 ? Math.round(globalSales / totalTenants) : 0;

    return {
      tenants,
      summary: {
        totalTenants,
        totalOrders: globalOrders,
        totalSalesCop: globalSales,
        globalAverageTicketCop,
        globalAverageOrdersPerTenant,
        globalAverageSalesPerTenant,
        totalTables: globalTables,
        totalMenuItems: globalMenuItems,
      },
    };
  },
};
