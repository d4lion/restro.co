import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { orderRepository } from "@/lib/repositories/order.repository";
import { planRepository } from "@/lib/repositories/plan.repository";
import { getCachedBehavioralReport } from "@/lib/repositories/cached-data";
import { PLAN_LIMITS, getPlanLimits, isDashboardModuleLocked } from "@/lib/types";
import type { PlanKey, PlanRecord } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { PlanUpsellView } from "@/components/dashboard/PlanUpsellView";
import { BarChart3 } from "lucide-react";
import styles from "./page.module.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Analítica e Inteligencia Artificial" };

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [tenant, planInfo] = await Promise.all([
    tenantRepository.findById(session.tenantId),
    planRepository.getPlanForTenant(session.tenantId),
  ]);
  if (!tenant) redirect("/login");

  const planRecord = (planInfo?.plan ?? tenant.subscription?.plan) as PlanRecord | undefined;
  const plan = (planRecord?.key ?? "STARTER") as PlanKey;
  const limits = planInfo?.limits ?? (planRecord ? getPlanLimits(planRecord) : PLAN_LIMITS[plan]);
  const hasAI = limits.hasAI;

  if (isDashboardModuleLocked(plan, "/analytics", limits)) {
    return (
      <PlanUpsellView
        moduleName="Analítica de Negocio & Restro IA"
        currentPlanLabel={limits.label}
        recommendedPlanLabel="Restro IA"
        recommendedPlanPrice="$49.900 COP / mes"
        description="Tu carta digital ya está recopilando telemetría de clics, profundidad de scroll y tiempo de lectura en cada plato. Actualiza a Restro IA para desbloquear tus reportes de comportamiento e inteligencia artificial."
        features={[
          "Tiempo exacto de lectura por plato (Dwell Time), impresiones, CTR y enlaces compartidos",
          "Embudo completo de conversión (Vistas de carta → Aperturas de plato → Carrito → Pedido)",
          "Mapa de profundidad de scroll (25%, 50%, 75%, 100%) y búsquedas sin resultados",
          "Recomendaciones de Restro IA para detectar platos con fricción de precio o acompañantes",
        ]}
        icon={<BarChart3 size={28} strokeWidth={1.8} />}
      />
    );
  }

  const [orders, telemetry] = await Promise.all([
    orderRepository.findByTenant(session.tenantId, 100),
    getCachedBehavioralReport(session.tenantId, 30),
  ]);

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  const totalSessionsBase = Math.max(1, telemetry.uniqueSessions || telemetry.totalMenuViews || 1);
  const scrollPct = (count: number) => Math.min(100, Math.round((count / totalSessionsBase) * 100));

  const funnelBase = Math.max(
    1,
    telemetry.conversionFunnel.menuViews,
    telemetry.conversionFunnel.itemViews
  );
  const funnelStepPct = (count: number) => Math.min(100, Math.round((count / funnelBase) * 100));

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Analítica de Negocio & IA</h1>
            {hasAI ? (
              <span className="badge badge--blue">Restro IA Activado</span>
            ) : (
              <span className="badge badge--muted">Plan Starter</span>
            )}
          </div>
          <p className={styles.subtitle}>
            Telemetría en tiempo real de tu carta digital (clics, scroll, tiempo en cada plato y conversión) consolidada sin afectar la velocidad de tus clientes.
          </p>
        </div>
      </div>

      {/* AI Upgrade Banner if on Starter plan */}
      {!hasAI && (
        <div className={styles.aiBanner}>
          <div className={styles.aiBannerContent}>
            <h2>Desbloquea el módulo Restro IA</h2>
            <p>
              El plan <strong>Restro IA ($49.900/mes)</strong> analiza automáticamente tus ventas y telemetría para decirte qué productos recomendar, en qué combos agruparlos y cómo optimizar tus precios.
            </p>

            <Link href="/settings" style={{ marginTop: "12px", display: "inline-block" }}>
              <Button type="button" variant="primary" size="md">
                Actualizar a Plan Restro IA
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Top Grid: Operational Performance + AI Insights */}
      <div className={styles.grid}>
        {/* Sales & Traffic Overview Card */}
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>Rendimiento Operativo y Tráfico (30d)</h2>
          </div>
          <div className={styles.statsList}>
            <div className={styles.statRow}>
              <span>Total Pedidos Procesados</span>
              <strong>{orders.length} pedidos</strong>
            </div>
            <div className={styles.statRow}>
              <span>Ingresos Totales</span>
              <strong>{formatCOP(orders.reduce((sum, o) => sum + o.total, 0))}</strong>
            </div>
            <div className={styles.statRow}>
              <span>Ticket Promedio por Pedido</span>
              <strong>
                {orders.length > 0
                  ? formatCOP(orders.reduce((sum, o) => sum + o.total, 0) / orders.length)
                  : "$0"}
              </strong>
            </div>
            <div className={styles.statRow}>
              <span>Aperturas de Carta Digital</span>
              <strong>
                {telemetry.totalMenuViews} vistas ({telemetry.uniqueSessions} sesiones)
              </strong>
            </div>
            <div className={styles.statRow}>
              <span>Tiempo Promedio de Exploración</span>
              <strong>
                {telemetry.avgSessionDurationSeconds > 0
                  ? `${telemetry.avgSessionDurationSeconds}s por sesión`
                  : "Recopilando..."}
              </strong>
            </div>
          </div>
        </div>

        {/* AI Recommendations Card (Driven by Real Telemetry) */}
        <div className={`${styles.card} ${!hasAI ? styles["card--locked"] : ""}`}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>Recomendaciones de Restro IA</h2>
            {!hasAI && <span className="badge badge--warning">Exclusivo Restro IA</span>}
          </div>

          <div className={styles.aiInsights}>
            {telemetry.insights.map((insight) => (
              <div key={insight.id} className={styles.insightItem}>
                <div>
                  <strong>{insight.title}</strong>
                  <p>{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel Card */}
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>Embudo de Conversión en Carta</h2>
          </div>
          <p className={styles.cardSubtext}>
            Recorrido desde que el cliente abre la carta hasta que confirma su pedido.
          </p>
          <div className={styles.funnelList}>
            <div className={styles.funnelRow}>
              <div className={styles.funnelHeader}>
                <span>1. Vistas de Carta Digital</span>
                <strong>{telemetry.conversionFunnel.menuViews}</strong>
              </div>
              <div className={styles.progressBarTrack}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${funnelStepPct(telemetry.conversionFunnel.menuViews)}%` }}
                />
              </div>
            </div>

            <div className={styles.funnelRow}>
              <div className={styles.funnelHeader}>
                <span>2. Aperturas de Detalle de Plato</span>
                <strong>{telemetry.conversionFunnel.itemViews}</strong>
              </div>
              <div className={styles.progressBarTrack}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${funnelStepPct(telemetry.conversionFunnel.itemViews)}%` }}
                />
              </div>
            </div>

            <div className={styles.funnelRow}>
              <div className={styles.funnelHeader}>
                <span>3. Adiciones al Carrito</span>
                <strong>{telemetry.conversionFunnel.cartAdditions}</strong>
              </div>
              <div className={styles.progressBarTrack}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${funnelStepPct(telemetry.conversionFunnel.cartAdditions)}%` }}
                />
              </div>
            </div>

            <div className={styles.funnelRow}>
              <div className={styles.funnelHeader}>
                <span>4. Pedidos Completados</span>
                <strong>{telemetry.conversionFunnel.ordersCompleted}</strong>
              </div>
              <div className={styles.progressBarTrack}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${funnelStepPct(telemetry.conversionFunnel.ordersCompleted)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Depth Funnel Card */}
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>Profundidad de Scroll en el Menú</h2>
          </div>
          <p className={styles.cardSubtext}>
            Porcentaje de sesiones que navegan hasta cada sección vertical de tu carta.
          </p>
          <div className={styles.funnelList}>
            {[
              { label: "25% de la carta (Inicio / Destacados)", count: telemetry.scrollFunnel.depth25 },
              { label: "50% de la carta ( Mitad del menú )", count: telemetry.scrollFunnel.depth50 },
              { label: "75% de la carta (Categorías inferiores)", count: telemetry.scrollFunnel.depth75 },
              { label: "100% de la carta (Final del menú)", count: telemetry.scrollFunnel.depth100 },
            ].map((step) => {
              const pct = scrollPct(step.count);
              return (
                <div key={step.label} className={styles.funnelRow}>
                  <div className={styles.funnelHeader}>
                    <span>{step.label}</span>
                    <strong>
                      {step.count} sesiones ({pct}%)
                    </strong>
                  </div>
                  <div className={styles.progressBarTrack}>
                    <div className={styles.progressBarFillTeal} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Intelligence Table: Dwell Time, Impressions, Views, CTR, Shares */}
        <div className={`${styles.card} ${styles.cardFullWidth}`}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>
              Inteligencia por Producto: Tiempo de Lectura, Impresiones, Clics y Conversión
            </h2>
          </div>
          <p className={styles.cardSubtext}>
            Mide cuánto tiempo pasan tus clientes viendo cada plato (Dwell Time), qué porcentaje hace clic al verlo (CTR), cuántas veces lo comparten y cuántos lo agregan al pedido.
          </p>

          {telemetry.topProducts.length === 0 ? (
            <div className={styles.emptyTelemetryBox}>
              Aún no se han registrado aperturas de platos en los últimos 30 días. Los eventos enviados desde la carta pública aparecerán aquí automáticamente.
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.telemetryTable}>
                <thead>
                  <tr>
                    <th>Plato</th>
                    <th>Impresiones</th>
                    <th>Aperturas (Clics)</th>
                    <th>CTR</th>
                    <th>Tiempo Promedio en Plato</th>
                    <th>Compartidos</th>
                    <th>Agregados al Carrito</th>
                    <th>Diagnóstico IA</th>
                  </tr>
                </thead>
                <tbody>
                  {telemetry.topProducts.slice(0, 15).map((item) => (
                    <tr key={item.itemId}>
                      <td>
                        <div className={styles.dishNameCell}>
                          <span>{item.itemName}</span>
                          {item.categoryName && (
                            <span className={styles.dishCategorySub}>{item.categoryName}</span>
                          )}
                        </div>
                      </td>
                      <td>{item.impressions}</td>
                      <td>
                        <strong>{item.views}</strong>
                      </td>
                      <td>{item.ctrPct}%</td>
                      <td>
                        <strong>
                          {item.avgDwellTimeSeconds > 0 ? `${item.avgDwellTimeSeconds}s` : "—"}
                        </strong>
                        {item.maxDwellTimeSeconds > item.avgDwellTimeSeconds && (
                          <span className={styles.dishCategorySub}>
                            {" "}
                            (máx {item.maxDwellTimeSeconds}s)
                          </span>
                        )}
                      </td>
                      <td>{item.shares}</td>
                      <td>
                        {item.cartAdditions} ({item.viewToCartRatePct}%)
                      </td>
                      <td>
                        {item.highInterestLowConversion ? (
                          <span className={styles.frictionBadge}>
                            Alta atención · Baja conversión
                          </span>
                        ) : (
                          <span className={styles.okBadge}>Saludable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Search Queries & Zero-Result Demand */}
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>Términos Buscados en la Carta</h2>
          </div>
          <p className={styles.cardSubtext}>
            Lo que tus clientes escriben en el buscador (en rojo: búsquedas que no arrojaron ningún plato).
          </p>
          {telemetry.searchTerms.length === 0 ? (
            <div className={styles.emptyTelemetryBox}>
              Sin búsquedas registradas todavía en este periodo.
            </div>
          ) : (
            <div className={styles.tagPills}>
              {telemetry.searchTerms.slice(0, 15).map((term) => (
                <span
                  key={term.query}
                  className={`${styles.tagPill} ${
                    term.zeroResultsCount > 0 ? styles.tagPillZero : ""
                  }`}
                >
                  <strong>&ldquo;{term.query}&rdquo;</strong>
                  <span>({term.count})</span>
                  {term.zeroResultsCount > 0 && <span>· Sin resultados</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Categories & Contact Engagement */}
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>Categorías Más Exploradas y Contacto</h2>
          </div>
          <p className={styles.cardSubtext}>
            Clics en pestañas de categoría y tiempo de permanencia por sección.
          </p>
          {telemetry.topCategories.length === 0 ? (
            <div className={styles.emptyTelemetryBox}>
              Sin interacciones de categorías registradas todavía.
            </div>
          ) : (
            <div className={styles.statsList}>
              {telemetry.topCategories.slice(0, 6).map((cat) => (
                <div key={cat.categoryId} className={styles.statRow}>
                  <span>{cat.categoryName}</span>
                  <strong>
                    {cat.clicks} clics
                    {cat.avgDwellTimeSeconds > 0 ? ` · ${cat.avgDwellTimeSeconds}s prom.` : ""}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
