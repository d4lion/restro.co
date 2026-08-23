"use client";

import React, { useState } from "react";
import type { OrderWithItems, OrderStatus } from "@/lib/types";
import { X, AlertTriangle, CheckSquare, Square, ChefHat, Check } from "lucide-react";
import styles from "./KdsDashboard.module.css";

interface KdsOrderInspectorProps {
  order: OrderWithItems | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export function KdsOrderInspector({
  order,
  onClose,
  onUpdateStatus,
}: KdsOrderInspectorProps) {
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  if (!order) return null;

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  const isDineIn = order.type === "DINE_IN";
  const orderTitle = isDineIn
    ? `Mesa ${order.tableId || "S/M"}`
    : order.type === "TAKEOUT"
    ? `Para Llevar — #${order.orderNumber}`
    : `Domicilio — #${order.orderNumber}`;

  const toggleStep = (stepKey: string) => {
    setCheckedSteps((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  // Helper to parse modifiers
  const parseModifiers = (json?: string | null) => {
    if (!json) return [];
    try {
      return JSON.parse(json) as Array<{ name: string; priceExtra: number }>;
    } catch {
      return [];
    }
  };

  return (
    <aside className={styles.inspectorDrawer}>
      {/* Header */}
      <div className={styles.inspectorHeader}>
        <div>
          <div className={styles.inspectorTitle}>Instrucciones de Prep.</div>
          <div style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 700 }}>
            {orderTitle}
          </div>
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
      <div className={styles.inspectorBody}>
        {/* Preparation Checklist */}
        <div className={styles.instructionBox}>
          <div className={styles.instructionTitle}>
            <ChefHat size={16} style={{ marginRight: 6 }} />
            Pasos de Preparación ({order.items.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {order.items.map((item, idx) => {
              const stepKey = `${item.id}-${idx}`;
              const isChecked = Boolean(checkedSteps[stepKey]);
              const modifiers = parseModifiers(item.modifiersJson);

              return (
                <div
                  key={stepKey}
                  onClick={() => toggleStep(stepKey)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    cursor: "pointer",
                    padding: "6px 8px",
                    borderRadius: 6,
                    background: isChecked ? "#F1F5F9" : "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ color: isChecked ? "#2563EB" : "#64748B", marginTop: 2 }}>
                    {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: isChecked ? "#64748B" : "#0F172A",
                        textDecoration: isChecked ? "line-through" : "none",
                      }}
                    >
                      {item.quantity}x {item.name}
                    </div>
                    {modifiers.length > 0 && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#1E40AF",
                          fontWeight: 600,
                          marginTop: 2,
                        }}
                      >
                        + {modifiers.map((m) => m.name).join(", ")}
                      </div>
                    )}
                    {item.notes && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#C2410C",
                          fontWeight: 600,
                          marginTop: 2,
                        }}
                      >
                        Nota: {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crucial Allergies & General Notes Alert */}
        {(order.notes || order.deliveryNotes) && (
          <div className={styles.allergiesAlert}>
            <div className={styles.allergiesTitle}>
              <AlertTriangle size={16} /> ALÉRGENOS / NOTAS IMPORTANTES:
            </div>
            <div style={{ fontSize: "0.825rem", fontWeight: 700 }}>
              {order.notes || order.deliveryNotes}
            </div>
          </div>
        )}

        {/* Customer Information */}
        {(order.customerName || order.customerPhone || order.deliveryAddress) && (
          <div className={styles.instructionBox}>
            <div className={styles.instructionTitle}>Cliente y Entrega</div>
            {order.customerName && (
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0F172A" }}>
                Cliente: {order.customerName}
              </div>
            )}
            {order.customerPhone && (
              <div style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 600 }}>
                Teléfono: {order.customerPhone}
              </div>
            )}
            {order.deliveryAddress && (
              <div style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 600, marginTop: 4 }}>
                Dirección: {order.deliveryAddress}
              </div>
            )}
          </div>
        )}

        {/* Financial Breakdown */}
        <div className={styles.financialSummary}>
          <div className={styles.instructionTitle} style={{ marginBottom: 4 }}>
            Desglose de la Orden
          </div>
          {order.items.map((item) => (
            <div key={item.id} className={styles.financialRow}>
              <span>
                <strong>{item.quantity}x</strong> {item.name}
              </span>
              <span>{formatCOP(item.subtotal)}</span>
            </div>
          ))}
          <div className={styles.financialTotal}>
            <div className={styles.financialRow} style={{ color: "#0F172A", fontSize: "1rem" }}>
              <span>Total Comanda</span>
              <span style={{ color: "#2563EB" }}>{formatCOP(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Quick Transition Action in Inspector */}
        <div style={{ marginTop: "auto" }}>
          {order.status === "PENDING" && (
            <button
              className={`${styles.primaryActionBtn} ${styles.btnStartPrep}`}
              onClick={() => onUpdateStatus(order.id, "PREPARING")}
              style={{ width: "100%" }}
            >
              Iniciar Prep.
            </button>
          )}
          {order.status === "PREPARING" && (
            <button
              className={`${styles.primaryActionBtn} ${styles.btnMarkReady}`}
              onClick={() => onUpdateStatus(order.id, "READY")}
              style={{ width: "100%" }}
            >
              Marcar como Lista
            </button>
          )}
          {order.status === "READY" && (
            <button
              className={`${styles.primaryActionBtn} ${styles.btnConfirmDelivered}`}
              onClick={() => onUpdateStatus(order.id, "DELIVERED")}
              style={{ width: "100%" }}
            >
              <Check size={16} /> Confirmar Entrega
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
