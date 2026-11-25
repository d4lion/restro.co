"use client";

import React from "react";
import { calculateSubscriptionTime, type SubscriptionTimeCalculation } from "@/lib/subscription-utils";
import styles from "./SubscriptionTimeBadge.module.css";
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert, Infinity as InfinityIcon } from "lucide-react";

interface Props {
  start?: Date | string | null;
  end?: Date | string | null;
  trialEndsAt?: Date | string | null;
  status?: string | null;
  planKey?: string | null;
  showProgress?: boolean;
}

export function SubscriptionTimeBadge({
  start,
  end,
  trialEndsAt,
  status,
  planKey,
  showProgress = true,
}: Props) {
  const calc = calculateSubscriptionTime({
    currentPeriodStart: start,
    currentPeriodEnd: end,
    trialEndsAt,
    status,
    planKey,
  });

  const getIcon = (urgency: SubscriptionTimeCalculation["urgencyStatus"]) => {
    switch (urgency) {
      case "UNLIMITED":
        return <InfinityIcon size={14} className={styles.icon} />;
      case "ACTIVE":
        return <CheckCircle2 size={14} className={styles.icon} />;
      case "EXPIRING_SOON":
        return <Clock size={14} className={styles.icon} />;
      case "GRACE_PERIOD":
        return <AlertTriangle size={14} className={styles.icon} />;
      case "EXPIRED":
        return <AlertTriangle size={14} className={styles.icon} />;
      case "CANCELLED":
        return <ShieldAlert size={14} className={styles.icon} />;
      case "TRIAL":
        return <Clock size={14} className={styles.icon} />;
      default:
        return <Clock size={14} className={styles.icon} />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.badge} ${styles[`badge--${calc.badgeVariant}`]}`}>
        {getIcon(calc.urgencyStatus)}
        <span className={styles.label}>{calc.statusLabel}</span>
      </div>

      {showProgress && calc.urgencyStatus !== "UNLIMITED" && calc.urgencyStatus !== "NOT_CONFIGURED" && (
        <div className={styles.progressTrack} title={`Ciclo: ${calc.percentElapsed}% transcurrido`}>
          <div
            className={`${styles.progressBar} ${styles[`progressBar--${calc.badgeVariant}`]}`}
            style={{ width: `${Math.min(100, Math.max(4, calc.percentElapsed))}%` }}
          />
        </div>
      )}
    </div>
  );
}
