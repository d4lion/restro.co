"use client";

import React, { useState } from "react";
import type { OrderWithItems } from "@/lib/types";
import { X, History, CheckCircle, Clock, AlertTriangle, RotateCcw } from "lucide-react";
import styles from "./KdsDashboard.module.css";

interface KdsTraceabilityDrawerProps {
  orders: OrderWithItems[];
  onClose: () => void;
  onReopenOrder: (orderId: string) => void;
}

export function KdsTraceabilityDrawer({
  orders,
  onClose,
  onReopenOrder,
}: KdsTraceabilityDrawerProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  const startOfTodayMs = new Date().setHours(0, 0, 0, 0);

  const historyOrders = orders
    .filter((o) => {
      const isHistoryStatus = o.status === "DELIVERED" || o.status === "CANCELLED";
      const isToday = new Date(o.createdAt).getTime() >= startOfTodayMs;
      return isHistoryStatus && isToday;
    })
    .slice(0, 10);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || historyOrders[0] || null;

  return (
    <aside className={styles.traceabilityDrawer}>
      {/* Header */}
      <div className={styles.drawerHeader}>
        <div className={styles.drawerTitle} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <History size={20} color="#38BDF8" />
          Trazabilidad e Historial del Día
        </div>
        <button
          className={styles.closeDrawerBtn}
          onClick={onClose}
          aria-label="Cerrar panel"
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className={styles.drawerBody}>
        {/* Order Selector Chips */}
        <div>
          <div className={styles.drawerSectionLabel}>
            Últimas {historyOrders.length} Comandas de Hoy
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
            {historyOrders.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className={`${styles.orderChipBtn} ${
                  selectedOrder?.id === o.id ? styles.orderChipBtnActive : ""
                }`}
              >
                #{o.orderNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Order Detail & Event Timeline */}
        {selectedOrder ? (
          <div className={styles.drawerDetailCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <span className={styles.drawerOrderTitle}>Comanda #{selectedOrder.orderNumber}</span>
                <div className={styles.drawerCustomerSub}>
                  {selectedOrder.customerName ? `Cliente: ${selectedOrder.customerName}` : `Tipo: ${selectedOrder.type}`}
                </div>
              </div>
              <button
                onClick={() => onReopenOrder(selectedOrder.id)}
                className={styles.btnReopen}
              >
                <RotateCcw size={14} /> Reabrir
              </button>
            </div>

            {/* Event Timeline */}
            <div className={styles.drawerSectionLabel} style={{ marginTop: 12, marginBottom: 8 }}>
              Timeline de Eventos (Auditoría)
            </div>

            <div className={styles.timelineList}>
              {/* Event: Received */}
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot} style={{ background: "#2563EB" }} />
                <span className={styles.timelineTime}>
                  {new Date(selectedOrder.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <span className={styles.timelineEventText}>Comanda Recibida en Sistema</span>
              </div>

              {/* Status History Events */}
              {selectedOrder.statusHistory?.map((h) => (
                <div key={h.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} style={{ background: h.toStatus === "READY" ? "#16A34A" : h.toStatus === "INCIDENT" ? "#DC2626" : "#2563EB" }} />
                  <span className={styles.timelineTime}>
                    {new Date(h.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className={styles.timelineEventText}>
                    {h.toStatus === "PREPARING"
                      ? "Preparación Iniciada en Cocina"
                      : h.toStatus === "READY"
                      ? "Marcar como Listo para Despacho"
                      : h.toStatus === "DELIVERED"
                      ? "Entrega Confirmada"
                      : h.toStatus === "INCIDENT"
                      ? `Incidencia Reportada: ${h.note || ""}`
                      : `Estado: ${h.toStatus}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Items Summary */}
            <div className={styles.drawerSectionDivider}>
              <div className={styles.drawerSectionLabel} style={{ marginBottom: 6 }}>
                PRODUCTOS PEDIDOS ({selectedOrder.items.length})
              </div>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className={styles.drawerItemRow}>
                  <span><strong>{item.quantity}x</strong> {item.name}</span>
                  <span>{formatCOP(item.subtotal)}</span>
                </div>
              ))}
              <div className={styles.drawerTotalRow}>
                <span>Total</span>
                <span className={styles.drawerTotalValue}>{formatCOP(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: "#64748B", textAlign: "center", padding: 40 }}>
            Sin órdenes en historial
          </div>
        )}
      </div>
    </aside>
  );
}
