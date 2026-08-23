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

  const historyOrders = orders.filter(
    (o) => o.status === "DELIVERED" || o.status === "CANCELLED"
  );

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || historyOrders[0] || null;

  return (
    <aside className={styles.traceabilityDrawer}>
      {/* Header */}
      <div className={styles.drawerHeader}>
        <div className={styles.drawerTitle} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <History size={20} color="#38BDF8" />
          Trazabilidad e Historial
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
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#94A3B8", marginBottom: 8, textTransform: "uppercase" }}>
            Comandas Recientes ({historyOrders.length})
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
            {historyOrders.slice(0, 15).map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                style={{
                  background: selectedOrder?.id === o.id ? "#2563EB" : "#1E293B",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                #{o.orderNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Order Detail & Event Timeline */}
        {selectedOrder ? (
          <div style={{ background: "#182234", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: "1.1rem", fontWeight: 900 }}>Comanda #{selectedOrder.orderNumber}</span>
                <div style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 700 }}>
                  {selectedOrder.customerName ? `Cliente: ${selectedOrder.customerName}` : `Tipo: ${selectedOrder.type}`}
                </div>
              </div>
              <button
                onClick={() => onReopenOrder(selectedOrder.id)}
                style={{
                  background: "#334155",
                  color: "#38BDF8",
                  border: "1px solid rgba(56,189,248,0.3)",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <RotateCcw size={14} /> Reabrir
              </button>
            </div>

            {/* Event Timeline */}
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#94A3B8", marginTop: 12, marginBottom: 8, textTransform: "uppercase" }}>
              Timeline de Eventos (Auditoría)
            </div>

            <div className={styles.timelineList}>
              {/* Event: Received */}
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot} style={{ background: "#38BDF8" }} />
                <span className={styles.timelineTime}>
                  {new Date(selectedOrder.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <span className={styles.timelineEventText}>Comanda Recibida en Sistema</span>
              </div>

              {/* Status History Events */}
              {selectedOrder.statusHistory?.map((h) => (
                <div key={h.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} style={{ background: h.toStatus === "READY" ? "#10B981" : h.toStatus === "INCIDENT" ? "#EF4444" : "#38BDF8" }} />
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
            <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 10 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#94A3B8", marginBottom: 6 }}>
                PRODUCTOS PEDIDOS ({selectedOrder.items.length})
              </div>
              {selectedOrder.items.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", color: "#CBD5E1", marginBottom: 4 }}>
                  <span><strong>{item.quantity}x</strong> {item.name}</span>
                  <span>{formatCOP(item.subtotal)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 6, borderTop: "1px dashed rgba(255,255,255,0.1)", fontWeight: 900, fontSize: "0.95rem" }}>
                <span>Total</span>
                <span style={{ color: "#38BDF8" }}>{formatCOP(selectedOrder.total)}</span>
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
