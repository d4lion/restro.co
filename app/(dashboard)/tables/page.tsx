import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tableRepository } from "@/lib/repositories/table.repository";
import { orderRepository } from "@/lib/repositories/order.repository";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { TableManagerClient } from "@/components/tables/TableManagerClient";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestión de Mesas y QRs" };

export default async function TablesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [tenant, tables, activeOrders] = await Promise.all([
    tenantRepository.findById(session.tenantId),
    tableRepository.getTablesWithStatus(session.tenantId),
    orderRepository.findActiveByTenant(session.tenantId),
  ]);

  if (!tenant) redirect("/login");

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
          <h1 className={styles.title}>Mesas, QRs y Trazabilidad</h1>
          <p className={styles.subtitle}>
            Controla las mesas de tu local, edita su información, genera e imprime códigos QR en alta resolución y revisa consumos en tiempo real.
          </p>
        </div>
      </div>

      {/* Off-premise orders trace (Takeout & Delivery) */}
      {deliveryTakeoutOrders.length > 0 && (
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
      />
    </div>
  );
}
