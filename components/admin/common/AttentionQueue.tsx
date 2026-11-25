"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, Clock, Calendar, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { calculateSubscriptionTime } from "@/lib/subscription-utils";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";
import styles from "./AttentionQueue.module.css";

interface Props {
  tenants: TenantAdminSummary[];
  onExtend: (tenant: TenantAdminSummary) => void;
  onEditDates: (tenant: TenantAdminSummary) => void;
  onOpenDetail?: (tenant: TenantAdminSummary) => void;
  title?: string;
  maxInitial?: number;
}

interface AttentionItem {
  tenant: TenantAdminSummary;
  priority: 1 | 2 | 3 | 4; // 1 = Expired/Cancelled, 2 = Expiring soon, 3 = Not configured (paid), 4 = Trial ending
  severity: "danger" | "warning" | "info";
  reason: string;
  timeLabel: string;
  recommendedAction: "extend" | "dates" | "review";
}

export function AttentionQueue({
  tenants,
  onExtend,
  onEditDates,
  onOpenDetail,
  title = "Requieren Atención Inmediata",
  maxInitial = 5,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const attentionItems = useMemo(() => {
    const items: AttentionItem[] = [];
    const now = new Date();

    tenants.forEach((t) => {
      const sub = t.subscription;
      if (!sub) return;

      const calc = calculateSubscriptionTime({
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        trialEndsAt: sub.trialEndsAt,
        status: sub.status,
        planKey: sub.plan.key,
        referenceDate: now,
      });

      // Priority 1: Expired or Cancelled (Locked out)
      if (calc.urgencyStatus === "EXPIRED" || calc.urgencyStatus === "CANCELLED") {
        items.push({
          tenant: t,
          priority: 1,
          severity: "danger",
          reason: sub.status === "CANCELLED" ? "Suscripción cancelada o suspendida" : "Periodo de gracia expiró (Servicio bloqueado)",
          timeLabel: calc.statusLabel,
          recommendedAction: "extend",
        });
      }
      // Priority 2: In Grace Period (7 days allowance)
      else if (calc.urgencyStatus === "GRACE_PERIOD") {
        items.push({
          tenant: t,
          priority: 2,
          severity: "warning",
          reason: `En periodo de gracia (restan ${calc.daysRemainingInGrace ?? 0}d antes de bloqueo)`,
          timeLabel: calc.statusLabel,
          recommendedAction: "extend",
        });
      }
      // Priority 3: Expiring soon (<= 7 days)
      else if (calc.urgencyStatus === "EXPIRING_SOON") {
        items.push({
          tenant: t,
          priority: 2,
          severity: "warning",
          reason: "Vence en los próximos días",
          timeLabel: calc.statusLabel,
          recommendedAction: "extend",
        });
      }
      // Priority 3: Paid plan with no dates configured
      else if (calc.urgencyStatus === "NOT_CONFIGURED" && sub.plan.key !== "STARTER") {
        items.push({
          tenant: t,
          priority: 3,
          severity: "warning",
          reason: "Plan de pago sin fechas de vigencia configuradas",
          timeLabel: "Sin fechas",
          recommendedAction: "dates",
        });
      }
      // Priority 4: Trial ending soon
      else if (calc.urgencyStatus === "TRIAL" && calc.daysRemaining !== null && calc.daysRemaining <= 3) {
        items.push({
          tenant: t,
          priority: 4,
          severity: "info",
          reason: "Periodo de prueba por expirar",
          timeLabel: calc.statusLabel,
          recommendedAction: "extend",
        });
      }
    });

    return items.sort((a, b) => a.priority - b.priority);
  }, [tenants]);

  if (attentionItems.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCard}>
          <CheckCircle2 size={16} />
          <span>Todo al día — No hay cuentas que requieran intervención inmediata.</span>
        </div>
      </div>
    );
  }

  const displayedItems = isExpanded ? attentionItems : attentionItems.slice(0, maxInitial);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <span className={styles.headerIcon}>
            <AlertTriangle size={16} />
          </span>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.countBadge}>{attentionItems.length} pendientes</span>
        </div>

        {attentionItems.length > maxInitial && (
          <button
            type="button"
            className={styles.subtitle}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>{isExpanded ? "Mostrar menos" : `Ver todos (${attentionItems.length})`}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      <div className={styles.list}>
        {displayedItems.map((item) => (
          <div key={item.tenant.id} className={styles.item}>
            <div className={styles.itemLeft}>
              <span className={`${styles.urgencyDot} ${styles[`urgencyDot--${item.severity}`]}`} />
              <div className={styles.tenantInfo}>
                <div className={styles.tenantNameRow}>
                  <span className={styles.tenantName}>{item.tenant.name}</span>
                  <span className={styles.planTag}>{item.tenant.subscription?.plan.label}</span>
                </div>
                <span className={styles.reasonText}>{item.reason}</span>
              </div>
            </div>

            <div className={styles.itemCenter}>
              <span className={`${styles.timeRemaining} ${styles[`timeRemaining--${item.severity}`]}`}>
                <Clock size={13} />
                {item.timeLabel}
              </span>
            </div>

            <div className={styles.itemActions}>
              {item.recommendedAction === "extend" ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onExtend(item.tenant)}
                >
                  Extender
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditDates(item.tenant)}
                >
                  Configurar Fechas
                </Button>
              )}

              {onOpenDetail && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Eye size={13} />}
                  title="Ver Ficha Integral"
                  onClick={() => onOpenDetail(item.tenant)}
                >
                  Ficha
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
