import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tableRepository } from "@/lib/repositories/table.repository";
import { orderRepository } from "@/lib/repositories/order.repository";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { planRepository } from "@/lib/repositories/plan.repository";
import { PLAN_LIMITS, type PlanKey } from "@/lib/types";
import { TableManagerClient } from "@/components/tables/TableManagerClient";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestión de Mesas y QRs" };

export default async function TablesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [tenant, tables, activeOrders, planInfo] = await Promise.all([
    tenantRepository.findById(session.tenantId),
    tableRepository.getTablesWithStatus(session.tenantId),
    orderRepository.findActiveByTenant(session.tenantId),
    planRepository.getPlanForTenant(session.tenantId),
  ]);

  if (!tenant) redirect("/login");

  const plan = (planInfo?.plan.key ?? tenant.subscription?.plan?.key ?? "STARTER") as PlanKey;
  const limits = planInfo?.limits ?? PLAN_LIMITS[plan];
  const maxTables = Number.isFinite(limits.maxTables) ? limits.maxTables : null;
  const isCartaDigitalOnly = plan === "CARTA_DIGITAL" || plan === "STARTER";

  const deliveryTakeoutOrders = activeOrders.filter(
    (o) => o.type === "TAKEOUT" || o.type === "DELIVERY"
  );

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {isCartaDigitalOnly ? "Mesas y Códigos QR para Impresión" : "Mesas, QRs y Trazabilidad"}
          </h1>
          <p className={styles.subtitle}>
            {isCartaDigitalOnly
              ? "Crea las mesas de tu local, genera e imprime los códigos QR individuales por mesa para que tus clientes vean tu Carta Digital."
              : "Controla las mesas de tu local, edita su información, genera e imprime códigos QR en alta resolución y revisa consumos en tiempo real."}
          </p>
        </div>
      </div>

      {/* Off-premise orders trace (Takeout & Delivery) */}
      {!isCartaDigitalOnly && deliveryTakeoutOrders.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Trazabilidad de Domicilios y Retiro en Local</h2>
          <div className={styles.offPremiseGrid}>
            {deliveryTakeoutOrders.map((order) => (
              <div key={order.id} className={styles.offPremiseCard}>
                <div className={styles.offPremiseHeader}>
                  <span className={styles.badgeType}>
                    {order.type === "DELIVERY" ? "DOMICILIO" : "PARA LLEVAR"}
                  </span>
                  <span className={styles.orderNum}>#{order.orderNumber}</span>
                </div>
                <p className={styles.customerName}>{order.customerName || "Cliente anónimo"}</p>
                <div className={styles.itemList}>
                  {order.items.map((i) => (
                    <span key={i.id} className={styles.itemTag}>
                      {i.quantity}x {i.name}
                    </span>
                  ))}
                </div>
                <span className={styles.orderTotal}>{formatCOP(order.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Table Manager Client */}
      <TableManagerClient
        tables={tables}
        tenantSlug={tenant.slug}
        tenantName={tenant.name}
        plan={plan}
        planLabel={limits.label}
        maxTables={maxTables}
      />
    </div>
  );
}
