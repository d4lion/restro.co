"use client";

import React from "react";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";
import { calculateSubscriptionTime, formatCurrencyCOP } from "@/lib/subscription-utils";
import styles from "./SubscriptionMetricsBar.module.css";
import { Store, CheckCircle, Clock, AlertTriangle, Sparkles, DollarSign } from "lucide-react";

interface Props {
  tenants: TenantAdminSummary[];
  onSelectFilter?: (filterStatus: string) => void;
  activeFilter?: string;
}

export function SubscriptionMetricsBar({ tenants, onSelectFilter, activeFilter }: Props) {
  const now = new Date();

  let activeCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;
  let trialCount = 0;
  let mrrTotal = 0;

  tenants.forEach((t) => {
    if (!t.subscription) return;

    const calc = calculateSubscriptionTime({
      currentPeriodStart: t.subscription.currentPeriodStart,
      currentPeriodEnd: t.subscription.currentPeriodEnd,
      trialEndsAt: t.subscription.trialEndsAt,
      status: t.subscription.status,
      planKey: t.subscription.plan.key,
      referenceDate: now,
    });

    if (calc.urgencyStatus === "EXPIRING_SOON") {
      expiringSoonCount++;
      activeCount++;
      mrrTotal += t.subscription.plan.priceMonthly;
    } else if (calc.urgencyStatus === "GRACE_PERIOD") {
      expiringSoonCount++;
      activeCount++;
      mrrTotal += t.subscription.plan.priceMonthly;
    } else if (calc.urgencyStatus === "ACTIVE" || calc.urgencyStatus === "UNLIMITED") {
      activeCount++;
      mrrTotal += t.subscription.plan.priceMonthly;
    } else if (calc.urgencyStatus === "EXPIRED" || calc.urgencyStatus === "CANCELLED") {
      expiredCount++;
    } else if (calc.urgencyStatus === "TRIAL") {
      trialCount++;
    }
  });

  const cards = [
    {
      id: "EXPIRING_SOON",
      label: "Por Vencer (≤ 7 días)",
      value: expiringSoonCount,
      icon: <Clock size={18} />,
      color: "warning",
      badgeText: expiringSoonCount > 0 ? "¡Requieren atención inmediata!" : "Sin alertas pendientes",
      highlight: expiringSoonCount > 0,
    },
    {
      id: "EXPIRED",
      label: "Suscripciones Vencidas",
      value: expiredCount,
      icon: <AlertTriangle size={18} />,
      color: "danger",
      badgeText: expiredCount > 0 ? "Suspendidas o sin pago" : "Ninguna vencida",
      highlight: expiredCount > 0,
    },
    {
      id: "ACTIVE",
      label: "Suscripciones Activas",
      value: activeCount,
      icon: <CheckCircle size={18} />,
      color: "success",
      badgeText: `${tenants.length > 0 ? Math.round((activeCount / tenants.length) * 100) : 0}% del ecosistema`,
    },
    {
      id: "MRR",
      label: "MRR Recurrente Estimado",
      value: formatCurrencyCOP(mrrTotal),
      icon: <DollarSign size={18} />,
      color: "accent",
      badgeText: "Facturación mensual proyectada",
      isMoney: true,
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((c) => {
        const isClickable = c.id !== "MRR" && onSelectFilter;
        const isSelected = activeFilter === c.id;

        return (
          <div
            key={c.id}
            onClick={() => isClickable && onSelectFilter && onSelectFilter(c.id)}
            className={[
              styles.card,
              styles[`card--${c.color}`],
              isClickable ? styles["card--clickable"] : "",
              isSelected ? styles["card--selected"] : "",
              c.highlight ? styles["card--highlight"] : "",
            ]
              .filter(Boolean)
              .join(" ")}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>{c.label}</span>
              <div className={`${styles.iconWrapper} ${styles[`icon--${c.color}`]}`}>{c.icon}</div>
            </div>

            <div className={styles.cardBody}>
              <span className={`${styles.cardValue} ${c.isMoney ? styles["cardValue--money"] : ""}`}>
                {c.value}
              </span>
              <span className={styles.cardSub}>{c.badgeText}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
