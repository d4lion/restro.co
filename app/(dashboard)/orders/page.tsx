import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { orderRepository } from "@/lib/repositories/order.repository";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/lib/types";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cocina y Pedidos (KDS)" };

async function updateOrderStatusAction(formData: FormData) {
  "use server";
  const orderId = formData.get("orderId") as string;
  const nextStatus = formData.get("nextStatus") as OrderStatus;
  if (orderId && nextStatus) {
    await orderRepository.updateStatus(orderId, nextStatus);
    revalidatePath("/orders");
    revalidatePath("/overview");
  }
}

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orders = await orderRepository.findByTenant(session.tenantId, 50);

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders = orders.filter((o) => o.status === "READY");
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED" || o.status === "CANCELLED");

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>KDS — Comandas en Tiempo Real</h1>
          <p className={styles.subtitle}>
            Tablero de gestión de comisiones para personal de cocina y meseros.
          </p>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className={styles.kanban}>
        {/* Column: Novedades / Nuevo */}
        <div className={styles.column}>
          <div className={`${styles.columnHeader} ${styles["col--pending"]}`}>
            <h2>NUEVOS ({pendingOrders.length})</h2>
          </div>
          <div className={styles.cardsList}>
            {pendingOrders.map((order) => (
              <div key={order.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.orderNum}>#{order.orderNumber}</span>
                  <span className={styles.orderType}>
                    {order.type === "DINE_IN" ? "En el local" : order.type === "TAKEOUT" ? "Para llevar" : "Domicilio"}
                  </span>
                </div>
                {order.customerName && <p className={styles.customer}>{order.customerName}</p>}
                <div className={styles.itemsList}>
                  {order.items.map((item) => (
                    <div key={item.id} className={styles.itemRow}>
                      <span><strong>{item.quantity}x</strong> {item.name}</span>
                      {item.notes && <span className={styles.itemNotes}>({item.notes})</span>}
                    </div>
                  ))}
                </div>
                {order.notes && <div className={styles.orderNotes}>Nota: {order.notes}</div>}
                <div className={styles.cardBottom}>
                  <span className={styles.total}>{formatCOP(order.total)}</span>
                  <form action={updateOrderStatusAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="nextStatus" value="PREPARING" />
                    <button type="submit" className={styles.actionBtn}>Pasar a Cocina</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column: En Preparación */}
        <div className={styles.column}>
          <div className={`${styles.columnHeader} ${styles["col--preparing"]}`}>
            <h2>EN COCINA ({preparingOrders.length})</h2>
          </div>
          <div className={styles.cardsList}>
            {preparingOrders.map((order) => (
              <div key={order.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.orderNum}>#{order.orderNumber}</span>
                  <span className={styles.orderType}>
                    {order.type === "DINE_IN" ? "En el local" : order.type === "TAKEOUT" ? "Para llevar" : "Domicilio"}
                  </span>
                </div>
                <div className={styles.itemsList}>
                  {order.items.map((item) => (
                    <div key={item.id} className={styles.itemRow}>
                      <span><strong>{item.quantity}x</strong> {item.name}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.cardBottom}>
                  <span className={styles.total}>{formatCOP(order.total)}</span>
                  <form action={updateOrderStatusAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="nextStatus" value="READY" />
                    <button type="submit" className={styles.actionBtnReady}>Marcar Listo</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column: Listos */}
        <div className={styles.column}>
          <div className={`${styles.columnHeader} ${styles["col--ready"]}`}>
            <h2>LISTOS PARA SERVIR ({readyOrders.length})</h2>
          </div>
          <div className={styles.cardsList}>
            {readyOrders.map((order) => (
              <div key={order.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.orderNum}>#{order.orderNumber}</span>
                </div>
                <div className={styles.itemsList}>
                  {order.items.map((item) => (
                    <div key={item.id} className={styles.itemRow}>
                      <span><strong>{item.quantity}x</strong> {item.name}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.cardBottom}>
                  <form action={updateOrderStatusAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="nextStatus" value="DELIVERED" />
                    <button type="submit" className={styles.actionBtnDelivered}>Marcar Entregado</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column: Completados */}
        <div className={styles.column}>
          <div className={`${styles.columnHeader} ${styles["col--delivered"]}`}>
            <h2>HISTORIAL RECIENTE ({deliveredOrders.length})</h2>
          </div>
          <div className={styles.cardsList}>
            {deliveredOrders.slice(0, 5).map((order) => (
              <div key={order.id} className={`${styles.card} ${styles["card--done"]}`}>
                <div className={styles.cardTop}>
                  <span className={styles.orderNum}>#{order.orderNumber}</span>
                  <span className={styles.total}>{formatCOP(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
