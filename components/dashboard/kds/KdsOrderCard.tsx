"use client";

import React from "react";
import type { OrderWithItems, OrderStatus } from "@/lib/types";
import {
  Clock,
  Check,
  Utensils,
  ShoppingBag,
  Truck,
  Zap,
  AlertTriangle,
  Circle,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import styles from "./KdsDashboard.module.css";

interface KdsOrderCardProps {
  order: OrderWithItems;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => void;
  onTogglePriority: (orderId: string, currentPriority: boolean) => void;
  onReportIncident: (orderId: string) => void;
  onUpdateItemStatus: (itemId: string, nextStatus: string) => void;
  onCancelOrder: (orderId: string) => void;
}

export function KdsOrderCard({
  order,
  onUpdateStatus,
  onTogglePriority,
  onReportIncident,
  onUpdateItemStatus,
  onCancelOrder,
}: KdsOrderCardProps) {
  // Compute SLA & Elapsed Time
  const createdAtMs = new Date(order.createdAt).getTime();
  const targetMinutes = order.targetPrepTimeMinutes || 12;
  const targetSec = targetMinutes * 60;

  let elapsedSec = 0;

  if (order.status === "READY" || order.status === "DELIVERED") {
    if (typeof order.actualPrepTimeSeconds === "number" && order.actualPrepTimeSeconds > 0) {
      elapsedSec = order.actualPrepTimeSeconds;
    } else if (order.readyAt) {
      elapsedSec = Math.max(0, Math.floor((new Date(order.readyAt).getTime() - createdAtMs) / 1000));
    } else {
      elapsedSec = Math.max(0, Math.floor((Date.now() - createdAtMs) / 1000));
    }
  } else {
    // For PENDING and PREPARING, count total elapsed wait time from createdAt
    elapsedSec = Math.max(0, Math.floor((Date.now() - createdAtMs) / 1000));
  }

  const elapsedMinutes = Math.floor(elapsedSec / 60);
  const elapsedSeconds = elapsedSec % 60;
  const elapsedFormatted = `${elapsedMinutes < 10 ? "0" : ""}${elapsedMinutes}:${elapsedSeconds < 10 ? "0" : ""}${elapsedSeconds}`;

  const progressPercent = Math.min(100, Math.floor((elapsedSec / targetSec) * 100));
  const isOverdue = Boolean(order.wasSlaBreached) || elapsedSec >= targetSec;
  const overdueSec = Math.max(0, elapsedSec - targetSec);
  const overdueMin = Math.floor(overdueSec / 60);
  const overdueRemainderSec = overdueSec % 60;
  const overdueFormatted = `+${overdueMin < 10 ? "0" : ""}${overdueMin}:${overdueRemainderSec < 10 ? "0" : ""}${overdueRemainderSec} retrasado`;

  // SLA Bar Style
  let slaBarClass = styles.slaBarFillNormal;
  let timerClass = styles.timerNormal;

  if (isOverdue) {
    slaBarClass = styles.slaBarFillOverdue;
    timerClass = styles.timerOverdue;
  } else if (progressPercent >= 75) {
    slaBarClass = styles.slaBarFillWarning;
    timerClass = styles.timerWarning;
  }

  // Destination Pill meta
  const getDestinationMeta = () => {
    switch (order.type) {
      case "DINE_IN":
        const displayTable = order.tableName
          ? (order.tableName.toLowerCase().startsWith("mesa") ? order.tableName : `Mesa ${order.tableName}`)
          : "LOCAL";

        return {
          label: displayTable,
          icon: <Utensils size={12} />,
          className: styles.pillDineIn,
        };
      case "TAKEOUT":
        return {
          label: "RECOGER",
          icon: <ShoppingBag size={12} />,
          className: styles.pillTakeout,
        };
      case "DELIVERY":
        return {
          label: "DOMICILIO",
          icon: <Truck size={12} />,
          className: styles.pillDelivery,
        };
      default:
        return {
          label: "RECOGER",
          icon: <ShoppingBag size={12} />,
          className: styles.pillTakeout,
        };
    }
  };

  const destMeta = getDestinationMeta();

  // Helper to parse modifiers JSON
  const parseModifiers = (json?: string | null) => {
    if (!json) return [];
    try {
      return JSON.parse(json) as Array<{ name: string; priceExtra: number }>;
    } catch {
      return [];
    }
  };

  // Cycle item status: PENDING (○) ➔ PREPARING (◉) ➔ READY (✓)
  const cycleItemStatus = (itemId: string, currentStatus?: string) => {
    let next = "PREPARING";
    if (currentStatus === "PREPARING") next = "READY";
    else if (currentStatus === "READY") next = "PENDING";
    onUpdateItemStatus(itemId, next);
  };

  return (
    <div
      className={`${styles.orderCard} ${order.isPriority ? styles.orderCardPriority : ""} ${
        isOverdue ? styles.orderCardOverdue : ""
      }`}
    >
      {/* 1. Header Banner: #7 + Destination Pill + Customer Name */}
      <div className={styles.cardHeaderBanner}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className={styles.orderNumberTitle}>#{order.orderNumber}</span>
          <span className={`${styles.destinationPill} ${destMeta.className}`}>
            {destMeta.label}
          </span>
        </div>

        {order.customerName && (
          <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
            {order.customerName}
          </span>
        )}
      </div>

      {/* 2. SLA Timer Header Row */}
      <div className={styles.slaSection}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={13} className={timerClass} />
          <span className={`${styles.timerElapsed} ${timerClass}`}>
            {elapsedFormatted}
          </span>
        </div>

        <span style={{ color: isOverdue ? "#DC2626" : "#64748B", fontWeight: 600 }}>
          {isOverdue ? overdueFormatted : `Objetivo: ${targetMinutes}:00`}
        </span>
      </div>

      {/* SLA Slim Progress Bar */}
      <div className={styles.slaBarContainer}>
        <div
          className={`${styles.slaBarFill} ${slaBarClass}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3. Card Body Content (Compact) */}
      <div className={styles.cardBody}>
        {/* Priority Banner if toggled */}
        {order.isPriority && (
          <div className={styles.priorityBanner}>
            <Zap size={12} /> PRIORITARIA
          </div>
        )}

        {/* Incident Alert Banner */}
        {order.incidentNote && (
          <div className={styles.incidentBanner}>
            <AlertTriangle size={12} /> {order.incidentNote}
          </div>
        )}

        {/* Items List with Statuses (○, ◉, ✓) */}
        <div className={styles.itemsList}>
          {order.items.map((item) => {
            const itemStatus = item.status || "PENDING";
            const modifiers = parseModifiers(item.modifiersJson);

            return (
              <div key={item.id}>
                <div className={styles.itemRow}>
                  {/* Item Status Icon Toggle */}
                  <span
                    className={styles.itemStatusIcon}
                    onClick={() => cycleItemStatus(item.id, itemStatus)}
                    title={`Estado: ${itemStatus} (clic para cambiar)`}
                  >
                    {itemStatus === "READY" ? (
                      <CheckCircle2 size={19} className={styles.statusReady} />
                    ) : itemStatus === "PREPARING" ? (
                      <Clock3 size={19} className={styles.statusPreparing} />
                    ) : (
                      <Circle size={19} className={styles.statusPending} />
                    )}
                  </span>

                  <div>
                    <span className={styles.itemQty}>{item.quantity}×</span>
                    <span className={styles.itemTitle}>{item.name}</span>
                  </div>
                </div>

                {/* Modifiers List */}
                {modifiers.length > 0 && (
                  <div className={styles.modifiersBox}>
                    {modifiers.map((m, idx) => (
                      <span key={idx} className={styles.modifierPill}>
                        + {m.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Item Notes */}
                {item.notes && (
                  <div className={styles.modifiersBox}>
                    <span className={styles.notesPill}>Nota: {item.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* General Order Notes */}
        {order.notes && (
          <div style={{ background: "#FEF2F2", border: "1px dashed #FECACA", color: "#991B1B", padding: "4px 6px", borderRadius: 4, fontSize: "0.7rem", fontWeight: 600 }}>
            Nota: {order.notes}
          </div>
        )}
      </div>

      {/* 4. Action Footer */}
      <div className={styles.cardFooter}>
        {order.status === "PENDING" && (
          <button
            className={`${styles.bigActionBtn} ${styles.btnStart}`}
            onClick={() => onUpdateStatus(order.id, "PREPARING")}
          >
            INICIAR PREP.
          </button>
        )}

        {order.status === "PREPARING" && (
          <button
            className={`${styles.bigActionBtn} ${styles.btnReady}`}
            onClick={() => onUpdateStatus(order.id, "READY")}
          >
            MARCAR LISTO
          </button>
        )}

        {order.status === "READY" && (
          <button
            className={`${styles.bigActionBtn} ${styles.btnDeliver}`}
            onClick={() => onUpdateStatus(order.id, "DELIVERED")}
          >
            <Check size={16} /> ENTREGAR
          </button>
        )}

        {/* Sub-actions */}
        <div className={styles.subActionsRow}>
          <button
            className={`${styles.subBtn} ${order.isPriority ? styles.subBtnPriority : ""}`}
            onClick={() => onTogglePriority(order.id, Boolean(order.isPriority))}
            title={order.isPriority ? "Quitar prioridad" : "Marcar prioridad"}
          >
            <Zap size={13} />
            <span>{order.isPriority ? "Prioritaria" : "Priorizar"}</span>
          </button>

          <button
            className={`${styles.subBtn} ${order.incidentNote ? styles.subBtnIncident : ""}`}
            onClick={() => onReportIncident(order.id)}
            title="Reportar incidencia"
          >
            <AlertTriangle size={13} />
            <span>Incidencia</span>
          </button>

          <button
            className={`${styles.subBtn} ${styles.subBtnDanger}`}
            onClick={() => onCancelOrder(order.id)}
            title="Cancelar comanda"
          >
            <XCircle size={13} />
            <span>Cancelar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
