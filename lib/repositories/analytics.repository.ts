import { prisma } from "@/lib/prisma";
import type { NormalizedTelemetryRecord } from "@/lib/telemetry";
import { TELEMETRY_EVENTS } from "@/lib/telemetry";
import { revalidateAnalyticsCache } from "@/lib/cache";

export const ROLLUP_SNAPSHOT_EVENT = "telemetry_rollup_snapshot";

export interface ProductBehaviorMetric {
  itemId: string;
  itemName: string;
  categoryName: string | null;
  price: number | null;
  impressions: number;
  views: number;
  ctrPct: number;
  avgDwellTimeSeconds: number;
  maxDwellTimeSeconds: number;
  shares: number;
  cartAdditions: number;
  viewToCartRatePct: number;
  modifierInteractions: number;
  /** True when users spend significant time/clicks on the dish but rarely add it to cart */
  highInterestLowConversion: boolean;
}

export interface CategoryBehaviorMetric {
  categoryId: string;
  categoryName: string;
  clicks: number;
  avgDwellTimeSeconds: number;
}

export interface SearchTermMetric {
  query: string;
  count: number;
  zeroResultsCount: number;
  lastSearchedAt: Date;
}

export interface BehavioralInsight {
  id: string;
  category: "conversion" | "engagement" | "search" | "scroll" | "viral";
  title: string;
  description: string;
  highlightItem?: string;
}

export interface TenantBehavioralReport {
  periodDays: number;
  totalEvents: number;
  totalMenuViews: number;
  uniqueSessions: number;
  uniqueVisitors: number;
  avgSessionDurationSeconds: number;
  scrollFunnel: {
    depth25: number;
    depth50: number;
    depth75: number;
    depth100: number;
  };
  conversionFunnel: {
    menuViews: number;
    itemViews: number;
    cartAdditions: number;
    ordersStarted: number;
    ordersCompleted: number;
  };
  entrySources: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  contactClicks: Record<string, number>;
  topProducts: ProductBehaviorMetric[];
  topCategories: CategoryBehaviorMetric[];
  searchTerms: SearchTermMetric[];
  insights: BehavioralInsight[];
}

function safeParseJson(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export const analyticsRepository = {
  /**
   * Bulk-inserts validated telemetry events into PostgreSQL `AnalyticsEvent`.
   * Uses `createMany` to minimize database round-trips under burst traffic.
   */
  async ingestBatch(records: NormalizedTelemetryRecord[]): Promise<{ count: number }> {
    if (!records || records.length === 0) {
      return { count: 0 };
    }

    const result = await prisma.analyticsEvent.createMany({
      data: records.map((r) => ({
        tenantId: r.tenantId,
        event: r.event,
        sessionId: r.sessionId,
        data: r.data,
        userAgent: r.userAgent,
      })),
    });

    return { count: result.count };
  },

  /**
   * Periodic retention cleanup for detailed telemetry events (default: 90 days).
   * Keeps the PostgreSQL `AnalyticsEvent` table lean in medium-scale phases.
   */
  async pruneExpiredEvents(retentionDays = 90): Promise<{ deletedCount: number }> {
    const safeDays = Math.max(7, Math.floor(retentionDays));
    const cutoff = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

    const res = await prisma.analyticsEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });

    return { deletedCount: res.count };
  },

  /**
   * Aggregates behavioral telemetry events (clicks, scroll depth, product dwell time,
   * impressions, shares, searches, and funnel steps) for a tenant over the given window.
   */
  async getBehavioralReportForTenant(
    tenantId: string,
    days = 30,
    maxEventsScan = 5000
  ): Promise<TenantBehavioralReport> {
    const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        tenantId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: maxEventsScan,
      select: {
        event: true,
        sessionId: true,
        data: true,
        createdAt: true,
      },
    });

    const sessionIds = new Set<string>();
    const visitorIds = new Set<string>();
    const entrySources: Record<string, number> = {};
    const deviceBreakdown: Record<string, number> = {};
    const contactClicks: Record<string, number> = {};

    // Track highest scroll milestone per session so we don't double-count
    const sessionScrollDepth = new Map<string, Set<number>>();
    const sessionDurationsSec: number[] = [];

    let totalMenuViews = 0;
    let totalItemViews = 0;
    let totalCartAdditions = 0;
    let totalOrdersStarted = 0;
    let totalOrdersCompleted = 0;

    const productMap = new Map<
      string,
      {
        itemId: string;
        itemName: string;
        categoryName: string | null;
        price: number | null;
        impressions: number;
        views: number;
        dwellTimesMs: number[];
        shares: number;
        cartAdditions: number;
        modifierInteractions: number;
      }
    >();

    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        clicks: number;
        dwellTimesMs: number[];
      }
    >();

    const searchMap = new Map<
      string,
      {
        query: string;
        count: number;
        zeroResultsCount: number;
        lastSearchedAt: Date;
      }
    >();

    const getOrCreateProduct = (
      itemId: string,
      itemName?: unknown,
      categoryName?: unknown,
      price?: unknown
    ) => {
      let entry = productMap.get(itemId);
      if (!entry) {
        entry = {
          itemId,
          itemName: typeof itemName === "string" && itemName ? itemName : "Plato",
          categoryName: typeof categoryName === "string" ? categoryName : null,
          price: typeof price === "number" ? price : null,
          impressions: 0,
          views: 0,
          dwellTimesMs: [],
          shares: 0,
          cartAdditions: 0,
          modifierInteractions: 0,
        };
        productMap.set(itemId, entry);
      } else {
        if (typeof itemName === "string" && itemName && entry.itemName === "Plato") {
          entry.itemName = itemName;
        }
        if (typeof categoryName === "string" && categoryName && !entry.categoryName) {
          entry.categoryName = categoryName;
        }
        if (typeof price === "number" && entry.price === null) {
          entry.price = price;
        }
      }
      return entry;
    };

    for (const row of events) {
      const payload = safeParseJson(row.data);
      const sid = row.sessionId || (typeof payload.visitorId === "string" ? payload.visitorId : "anon");
      if (row.sessionId) sessionIds.add(row.sessionId);
      if (typeof payload.visitorId === "string" && payload.visitorId) {
        visitorIds.add(payload.visitorId);
      }

      switch (row.event) {
        case TELEMETRY_EVENTS.MENU_VIEW: {
          totalMenuViews++;
          const source = typeof payload.entrySource === "string" ? payload.entrySource : "direct";
          entrySources[source] = (entrySources[source] || 0) + 1;

          const device = typeof payload.deviceType === "string" ? payload.deviceType : "mobile";
          deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
          break;
        }

        case TELEMETRY_EVENTS.SCROLL_DEPTH: {
          const depth = Number(payload.depthPct);
          if ([25, 50, 75, 100].includes(depth)) {
            if (!sessionScrollDepth.has(sid)) {
              sessionScrollDepth.set(sid, new Set());
            }
            const set = sessionScrollDepth.get(sid)!;
            if (depth >= 25) set.add(25);
            if (depth >= 50) set.add(50);
            if (depth >= 75) set.add(75);
            if (depth >= 100) set.add(100);
          }
          break;
        }

        case TELEMETRY_EVENTS.PRODUCT_IMPRESSION: {
          const itemId = typeof payload.itemId === "string" ? payload.itemId : "";
          if (itemId) {
            const p = getOrCreateProduct(itemId, payload.itemName, payload.categoryName, payload.price);
            p.impressions++;
          }
          break;
        }

        case TELEMETRY_EVENTS.ITEM_VIEW: {
          totalItemViews++;
          const itemId = typeof payload.itemId === "string" ? payload.itemId : "";
          if (itemId) {
            const p = getOrCreateProduct(itemId, payload.itemName, payload.categoryName, payload.price);
            p.views++;
          }
          break;
        }

        case TELEMETRY_EVENTS.ITEM_DWELL: {
          const itemId = typeof payload.itemId === "string" ? payload.itemId : "";
          const dwellMs = Number(payload.dwellTimeMs);
          if (itemId && Number.isFinite(dwellMs) && dwellMs > 0) {
            const p = getOrCreateProduct(itemId, payload.itemName, payload.categoryName, payload.price);
            // Cap single dwell outliers at 10 minutes
            p.dwellTimesMs.push(Math.min(dwellMs, 600_000));
          }
          break;
        }

        case TELEMETRY_EVENTS.ITEM_SHARE: {
          const itemId = typeof payload.itemId === "string" ? payload.itemId : "";
          if (itemId) {
            const p = getOrCreateProduct(itemId, payload.itemName, payload.categoryName, payload.price);
            p.shares++;
          }
          break;
        }

        case TELEMETRY_EVENTS.MODIFIER_INTERACTION: {
          const itemId = typeof payload.itemId === "string" ? payload.itemId : "";
          if (itemId) {
            const p = getOrCreateProduct(itemId, payload.itemName, payload.categoryName, payload.price);
            p.modifierInteractions++;
          }
          break;
        }

        case TELEMETRY_EVENTS.CART_ADD: {
          totalCartAdditions++;
          const itemId = typeof payload.itemId === "string" ? payload.itemId : "";
          const qty = Math.max(1, Number(payload.quantity) || 1);
          if (itemId) {
            const p = getOrCreateProduct(itemId, payload.itemName, payload.categoryName, payload.price);
            p.cartAdditions += qty;
          }
          break;
        }

        case TELEMETRY_EVENTS.CATEGORY_CLICK:
        case TELEMETRY_EVENTS.CATEGORY_DWELL: {
          const categoryId = typeof payload.categoryId === "string" ? payload.categoryId : "";
          const categoryName =
            typeof payload.categoryName === "string" && payload.categoryName
              ? payload.categoryName
              : categoryId;
          if (categoryId && categoryId !== "ALL") {
            let cat = categoryMap.get(categoryId);
            if (!cat) {
              cat = { categoryId, categoryName, clicks: 0, dwellTimesMs: [] };
              categoryMap.set(categoryId, cat);
            }
            if (row.event === TELEMETRY_EVENTS.CATEGORY_CLICK) {
              cat.clicks++;
            } else {
              const dwellMs = Number(payload.dwellTimeMs);
              if (Number.isFinite(dwellMs) && dwellMs > 0) {
                cat.dwellTimesMs.push(Math.min(dwellMs, 600_000));
              }
            }
          }
          break;
        }

        case TELEMETRY_EVENTS.SEARCH_QUERY: {
          const rawQuery = typeof payload.query === "string" ? payload.query.trim().toLowerCase() : "";
          if (rawQuery.length >= 2) {
            const resultsCount = Number(payload.resultsCount ?? 0);
            const existing = searchMap.get(rawQuery);
            if (!existing) {
              searchMap.set(rawQuery, {
                query: rawQuery,
                count: 1,
                zeroResultsCount: resultsCount === 0 ? 1 : 0,
                lastSearchedAt: row.createdAt,
              });
            } else {
              existing.count++;
              if (resultsCount === 0) existing.zeroResultsCount++;
              if (row.createdAt > existing.lastSearchedAt) {
                existing.lastSearchedAt = row.createdAt;
              }
            }
          }
          break;
        }

        case TELEMETRY_EVENTS.CONTACT_INTERACTION: {
          const target = typeof payload.target === "string" ? payload.target : "other";
          contactClicks[target] = (contactClicks[target] || 0) + 1;
          break;
        }

        case TELEMETRY_EVENTS.ORDER_STARTED: {
          totalOrdersStarted++;
          break;
        }

        case TELEMETRY_EVENTS.ORDER_COMPLETED: {
          totalOrdersCompleted++;
          break;
        }

        case TELEMETRY_EVENTS.SESSION_SUMMARY: {
          const dwellMs = Number(payload.totalDwellTimeMs);
          if (Number.isFinite(dwellMs) && dwellMs > 0) {
            sessionDurationsSec.push(Math.min(dwellMs / 1000, 1800));
          }
          const maxDepth = Number(payload.maxScrollDepthPct);
          if (Number.isFinite(maxDepth) && maxDepth >= 25) {
            if (!sessionScrollDepth.has(sid)) {
              sessionScrollDepth.set(sid, new Set());
            }
            const set = sessionScrollDepth.get(sid)!;
            if (maxDepth >= 25) set.add(25);
            if (maxDepth >= 50) set.add(50);
            if (maxDepth >= 75) set.add(75);
            if (maxDepth >= 100) set.add(100);
          }
          break;
        }
      }
    }

    let depth25 = 0;
    let depth50 = 0;
    let depth75 = 0;
    let depth100 = 0;
    for (const set of sessionScrollDepth.values()) {
      if (set.has(25)) depth25++;
      if (set.has(50)) depth50++;
      if (set.has(75)) depth75++;
      if (set.has(100)) depth100++;
    }

    const avgSessionDurationSeconds =
      sessionDurationsSec.length > 0
        ? Math.round(
            (sessionDurationsSec.reduce((a, b) => a + b, 0) / sessionDurationsSec.length) * 10
          ) / 10
        : 0;

    const topProducts: ProductBehaviorMetric[] = Array.from(productMap.values())
      .map((p) => {
        const effectiveImpressions = Math.max(p.impressions, p.views);
        const ctrPct =
          effectiveImpressions > 0
            ? Math.round((p.views / effectiveImpressions) * 1000) / 10
            : 0;
        const avgDwellTimeSeconds =
          p.dwellTimesMs.length > 0
            ? Math.round(
                (p.dwellTimesMs.reduce((a, b) => a + b, 0) / p.dwellTimesMs.length / 1000) * 10
              ) / 10
            : 0;
        const maxDwellTimeSeconds =
          p.dwellTimesMs.length > 0
            ? Math.round((Math.max(...p.dwellTimesMs) / 1000) * 10) / 10
            : 0;
        const viewToCartRatePct =
          p.views > 0 ? Math.round((p.cartAdditions / p.views) * 1000) / 10 : 0;

        // High interest (views >= 3 or avg dwell >= 8s) but low cart conversion (< 15%)
        const highInterestLowConversion =
          (p.views >= 3 || avgDwellTimeSeconds >= 8) && viewToCartRatePct < 15;

        return {
          itemId: p.itemId,
          itemName: p.itemName,
          categoryName: p.categoryName,
          price: p.price,
          impressions: effectiveImpressions,
          views: p.views,
          ctrPct,
          avgDwellTimeSeconds,
          maxDwellTimeSeconds,
          shares: p.shares,
          cartAdditions: p.cartAdditions,
          viewToCartRatePct,
          modifierInteractions: p.modifierInteractions,
          highInterestLowConversion,
        };
      })
      .sort((a, b) => b.views - a.views || b.impressions - a.impressions || b.avgDwellTimeSeconds - a.avgDwellTimeSeconds);

    const topCategories: CategoryBehaviorMetric[] = Array.from(categoryMap.values())
      .map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        clicks: c.clicks,
        avgDwellTimeSeconds:
          c.dwellTimesMs.length > 0
            ? Math.round(
                (c.dwellTimesMs.reduce((a, b) => a + b, 0) / c.dwellTimesMs.length / 1000) * 10
              ) / 10
            : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks || b.avgDwellTimeSeconds - a.avgDwellTimeSeconds);

    const searchTerms: SearchTermMetric[] = Array.from(searchMap.values()).sort(
      (a, b) => b.count - a.count
    );

    const insights: BehavioralInsight[] = [];

    // 1. High dwell time / views with low conversion friction insight
    const frictionDish = topProducts.find((p) => p.highInterestLowConversion);
    if (frictionDish) {
      insights.push({
        id: `friction-${frictionDish.itemId}`,
        category: "conversion",
        title: "Alerta de Fricción en Plato (Alto Tiempo, Baja Conversión)",
        description: `Los clientes pasan un promedio de ${frictionDish.avgDwellTimeSeconds}s viendo "${frictionDish.itemName}" (${frictionDish.views} aperturas), pero su conversión al carrito es del ${frictionDish.viewToCartRatePct}%. Ajustar el precio o simplificar sus acompañantes obligatorios puede destrabar ventas.`,
        highlightItem: frictionDish.itemName,
      });
    }

    // 2. Top viral / high-CTR dish insight
    const viralDish = [...topProducts]
      .filter((p) => p.views > 0 || p.shares > 0)
      .sort((a, b) => b.shares - a.shares || b.ctrPct - a.ctrPct)[0];
    if (viralDish) {
      insights.push({
        id: `viral-${viralDish.itemId}`,
        category: "viral",
        title: "Plato Estrella en Atención y Compartidos",
        description: `"${viralDish.itemName}" concentra un CTR de ${viralDish.ctrPct}% (${viralDish.views} aperturas de ${viralDish.impressions} impresiones${viralDish.shares > 0 ? ` y ${viralDish.shares} enlaces compartidos` : ""}). Destacarlo en la primera categoría incrementará el ticket promedio.`,
        highlightItem: viralDish.itemName,
      });
    }

    // 3. Zero-result search demand insight
    const missedSearch = searchTerms.find((s) => s.zeroResultsCount > 0);
    if (missedSearch) {
      insights.push({
        id: `search-${missedSearch.query}`,
        category: "search",
        title: "Demanda Detectada en Búsquedas sin Resultados",
        description: `Tus clientes buscaron "${missedSearch.query}" (${missedSearch.zeroResultsCount} veces sin encontrar platos). Incluir este término en el nombre o descripción de un plato existente capturará esa intención de compra.`,
        highlightItem: missedSearch.query,
      });
    }

    // 4. Scroll depth optimization insight
    if (sessionIds.size >= 2 && depth75 / sessionIds.size < 0.45) {
      const reachPct = Math.round((depth75 / sessionIds.size) * 100);
      insights.push({
        id: "scroll-depth-drop",
        category: "scroll",
        title: "Optimización de Orden de Categorías (Scroll)",
        description: `Solo el ${reachPct}% de las sesiones llega al 75% inferior de la carta digital. Mueve tus platos de mayor margen a las primeras 2 categorías para aumentar su visibilidad.`,
      });
    }

    // Fallback baseline insights when telemetry is still warming up
    if (insights.length === 0) {
      insights.push(
        {
          id: "default-combo",
          category: "conversion",
          title: "Recomendación de Combo Inteligente",
          description:
            "Agrupar tu plato fuerte con mayor tiempo de lectura junto a una bebida de alto margen incrementa la conversión de vista a carrito hasta en un 14%.",
        },
        {
          id: "default-scroll",
          category: "scroll",
          title: "Optimización por Impresiones y Scroll",
          description:
            "A medida que tus clientes naveguen la carta, Restro IA identificará qué platos tienen mayor tiempo de permanencia (dwell time) pero baja adición al pedido.",
        }
      );
    }

    const rawEventsCount = events.filter((e) => e.event !== ROLLUP_SNAPSHOT_EVENT).length;

    return {
      periodDays: days,
      totalEvents: rawEventsCount,
      totalMenuViews,
      uniqueSessions: sessionIds.size,
      uniqueVisitors: visitorIds.size,
      avgSessionDurationSeconds,
      scrollFunnel: {
        depth25,
        depth50,
        depth75,
        depth100,
      },
      conversionFunnel: {
        menuViews: totalMenuViews,
        itemViews: totalItemViews,
        cartAdditions: totalCartAdditions,
        ordersStarted: totalOrdersStarted,
        ordersCompleted: totalOrdersCompleted,
      },
      entrySources,
      deviceBreakdown,
      contactClicks,
      topProducts,
      topCategories,
      searchTerms,
      insights,
    };
  },

  /**
   * Background Rollup & Retention Job (Native replacement for external Lambda):
   * 1. Pre-aggregates behavioral telemetry for active tenants (across ALL plans).
   * 2. Stores a compact rollup snapshot in `AnalyticsEvent` (`telemetry_rollup_snapshot`).
   * 3. Revalidates the Next.js Data Cache (`analytics:[tenantId]`) so `/analytics` loads in < 10ms.
   * 4. Prunes expired raw events older than `retentionDays` (default: 90 days).
   */
  async runRollupAndMaintenance(options?: {
    tenantId?: string;
    days?: number;
    retentionDays?: number;
  }): Promise<{
    processedTenants: number;
    deletedExpiredEvents: number;
  }> {
    const days = options?.days ?? 30;
    const retentionDays = options?.retentionDays ?? 90;

    let tenantIds: string[] = [];
    if (options?.tenantId) {
      tenantIds = [options.tenantId];
    } else {
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true },
        select: { id: true },
        take: 200,
      });
      tenantIds = tenants.map((t) => t.id);
    }

    for (const tId of tenantIds) {
      const report = await this.getBehavioralReportForTenant(tId, days);

      // Remove previous rollup snapshots for this tenant window and store fresh snapshot
      await prisma.analyticsEvent.deleteMany({
        where: {
          tenantId: tId,
          event: ROLLUP_SNAPSHOT_EVENT,
        },
      });

      if (report.totalEvents > 0) {
        await prisma.analyticsEvent.createMany({
          data: [
            {
              tenantId: tId,
              event: ROLLUP_SNAPSHOT_EVENT,
              sessionId: `rollup:${days}d`,
              data: JSON.stringify({
                generatedAt: new Date().toISOString(),
                periodDays: days,
                totalEvents: report.totalEvents,
                totalMenuViews: report.totalMenuViews,
                uniqueSessions: report.uniqueSessions,
                avgSessionDurationSeconds: report.avgSessionDurationSeconds,
                scrollFunnel: report.scrollFunnel,
                conversionFunnel: report.conversionFunnel,
                topProducts: report.topProducts.slice(0, 15),
                topCategories: report.topCategories.slice(0, 10),
                searchTerms: report.searchTerms.slice(0, 15),
                insights: report.insights,
              }),
              userAgent: "restro-rollup-worker/1.0",
            },
          ],
        });
      }

      revalidateAnalyticsCache(tId);
    }

    const { deletedCount } = await this.pruneExpiredEvents(retentionDays);

    return {
      processedTenants: tenantIds.length,
      deletedExpiredEvents: deletedCount,
    };
  },
};
