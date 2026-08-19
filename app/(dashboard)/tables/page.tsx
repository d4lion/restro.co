import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tableRepository } from "@/lib/repositories/table.repository";
import { orderRepository } from "@/lib/repositories/order.repository";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestión de Mesas y QRs" };

async function addTableAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) return;
  const name = formData.get("name") as string;
  const capacity = parseInt(formData.get("capacity") as string) || 4;

  if (name) {
    await tableRepository.create(session.tenantId, { name, capacity });
    revalidatePath("/tables");
  }
}

export default async function TablesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [tenant, tables, activeOrders] = await Promise.all([
    tenantRepository.findById(session.tenantId),
    tableRepository.getTablesWithStatus(session.tenantId),
    orderRepository.findActiveByTenant(session.tenantId),
  ]);

  if (!tenant) redirect("/login");

  const deliveryTakeoutOrders = activeOrders.filter((o) => o.type === "TAKEOUT" || o.type === "DELIVERY");

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mesas, QRs y Trazabilidad</h1>
          <p className={styles.subtitle}>
            Controla las mesas de tu local, imprime los códigos QR y revisa qué ha pedido cada mesa en tiempo real.
          </p>
        </div>
      </div>

      {/* Add Table Card */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Agregar Nueva Mesa</h2>
        <form action={addTableAction} className={styles.inlineForm}>
          <Input name="name" placeholder="Nombre de mesa (ej. Mesa 9, Terraza 3)" required />
          <Input name="capacity" type="number" placeholder="Capacidad (personas)" defaultValue="4" />
          <Button type="submit" variant="primary">Crear Mesa</Button>
        </form>
      </div>

      {/* Off-premise orders trace (Takeout & Delivery) */}
      {deliveryTakeoutOrders.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Trazabilidad de Domicilios y Retiro en Local</h2>
          <div className={styles.offPremiseGrid}>
            {deliveryTakeoutOrders.map((order) => (
              <div key={order.id} className={styles.offPremiseCard}>
                <div className={styles.offPremiseHeader}>
                  <span className={styles.badgeType}>{order.type === "DELIVERY" ? "DOMICILIO" : "PARA LLEVAR"}</span>
                  <span className={styles.orderNum}>#{order.orderNumber}</span>
                </div>
                <p className={styles.customerName}>{order.customerName || "Cliente anónimo"}</p>
                <div className={styles.itemList}>
                  {order.items.map((i) => (
                    <span key={i.id} className={styles.itemTag}>{i.quantity}x {i.name}</span>
                  ))}
                </div>
                <span className={styles.orderTotal}>{formatCOP(order.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables Status Grid */}
      <div className={styles.tablesSection}>
        <h2 className={styles.sectionTitle}>Mesas del Local ({tables.length})</h2>

        <div className={styles.tablesGrid}>
          {tables.map((table) => {
            const isOccupied = table.activeOrderCount > 0;
            const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${tenant.slug}?mesa=${table.name.replace(/\s+/g, "")}`;

            return (
              <div key={table.id} className={`${styles.tableCard} ${isOccupied ? styles["tableCard--active"] : ""}`}>
                <div className={styles.tableHeader}>
                  <span className={`${styles.statusBadge} ${isOccupied ? styles["status--active"] : styles["status--free"]}`}>
                    {isOccupied ? "OCUPADA" : "LIBRE"}
                  </span>
                  <span className={styles.capacity}>Capacidad: {table.capacity || 4} pers.</span>
                </div>

                <h3 className={styles.tableName}>{table.name}</h3>

                {/* Traceability: Active orders summary for this table */}
                {isOccupied ? (
                  <div className={styles.traceabilityBox}>
                    <p className={styles.traceTitle}>Trazabilidad de Consumo:</p>
                    <p className={styles.traceSub}>{table.activeOrderCount} pedido(s) en curso</p>
                    <p className={styles.traceTotal}>Total: {formatCOP(table.totalAccumulated)}</p>
                  </div>
                ) : (
                  <p className={styles.freeHint}>Disponible para nuevos clientes</p>
                )}

                {/* QR Preview Link */}
                <div className={styles.qrFooter}>
                  <a
                    href={qrUrl}
                    target="_blank"
                    className={styles.qrBtn}
                    title="Ver carta filtrada por esta mesa"
                  >
                    Ver Enlace QR Mesa
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
