import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { orderRepository } from "@/lib/repositories/order.repository";
import { PLAN_LIMITS } from "@/lib/types";
import type { PlanKey } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Analítica e Inteligencia Artificial" };

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await tenantRepository.findById(session.tenantId);
  if (!tenant) redirect("/login");

  const orders = await orderRepository.findByTenant(session.tenantId, 100);
  const plan = tenant.plan as PlanKey;
  const hasAI = PLAN_LIMITS[plan].hasAI;

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

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
            Descubre patrones de consumo, horas pico y recomendaciones asistidas por IA para maximizar la rentabilidad.
          </p>
        </div>
      </div>

      {/* AI Upgrade Banner if on Starter plan */}
      {!hasAI && (
        <div className={styles.aiBanner}>
          <div className={styles.aiBannerContent}>
            <h2>Desbloquea el módulo Restro IA</h2>
            <p>
              El plan <strong>Restro IA ($49.900/mes)</strong> analiza automáticamente tus ventas para decirte qué productos recomendar, en qué combos agruparlos y cómo optimizar tus precios.
            </p>

            <Link href="/settings" style={{ marginTop: "12px", display: "inline-block" }}>
              <Button type="button" variant="primary" size="md">
                Actualizar a Plan Restro IA
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Analytics Grid */}
      <div className={styles.grid}>
        {/* Sales Overview Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Rendimiento Operativo</h2>
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
              <span>Ticket Promedio por Mesa</span>
              <strong>
                {orders.length > 0
                  ? formatCOP(orders.reduce((sum, o) => sum + o.total, 0) / orders.length)
                  : "$0"}
              </strong>
            </div>
          </div>
        </div>

        {/* AI Recommendations Card */}
        <div className={`${styles.card} ${!hasAI ? styles["card--locked"] : ""}`}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>Recomendaciones de IA</h2>
            {!hasAI && <span className="badge badge--warning">Exclusivo Restro IA</span>}
          </div>

          <div className={styles.aiInsights}>
            <div className={styles.insightItem}>
              <div>
                <strong>Recomendación de Combo Inteligente</strong>
                <p>
                  El 68% de los clientes que piden <em>Churrasco 300g</em> agregan <em>Limonada de coco</em>. Ofrecerlo como combo incrementa el ticket un 14%.
                </p>
              </div>
            </div>

            <div className={styles.insightItem}>
              <div>
                <strong>Predicción de Horas Pico</strong>
                <p>
                  Tu mayor afluencia es Viernes y Sábado entre 12:30 PM y 3:00 PM. Se sugiere reforzar personal en turno de cocina.
                </p>
              </div>
            </div>

            <div className={styles.insightItem}>
              <div>
                <strong>Optimización de Precios</strong>
                <p>
                  El plato <em>Deditos de queso</em> mantiene demanda constante. Ajustar el precio a $18.500 optimizará tu margen operativo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
