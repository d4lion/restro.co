"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatCurrencyCOP } from "@/lib/subscription-utils";
import { getSubscriptionAuditHistoryAction } from "@/app/actions/admin-subscriptions";
import { SleekSpinner } from "@/components/ui/SleekSpinner";
import styles from "./AuditHistoryModal.module.css";
import {
  History,
  CalendarCheck,
  ArrowRightLeft,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  DollarSign,
  Info,
} from "lucide-react";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";

interface Props {
  tenant: TenantAdminSummary | null;
  isOpen: boolean;
  onClose: () => void;
}

interface AuditEvent {
  id: string;
  createdAt: string;
  type: string;
  amount: number | null;
  currency: string;
  note: string | null;
  metadata: Record<string, unknown> | null;
}

export function AuditHistoryModal({ tenant, isOpen, onClose }: Props) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (tenant?.subscription?.id && isOpen) {
      setLoading(true);
      getSubscriptionAuditHistoryAction(tenant.subscription.id)
        .then((res) => {
          if (res.success && res.data) {
            setEvents(res.data);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [tenant, isOpen]);

  if (!tenant || !tenant.subscription) return null;

  const getEventBadge = (type: string) => {
    switch (type) {
      case "SUBSCRIPTION_RENEWED":
        return {
          label: "EXTENSIÓN / RENOVACIÓN",
          variant: "success",
          icon: <CalendarCheck size={14} />,
        };
      case "PLAN_CHANGED":
        return {
          label: "CAMBIO DE PLAN",
          variant: "info",
          icon: <ArrowRightLeft size={14} />,
        };
      case "DATES_MANUALLY_UPDATED":
        return {
          label: "AJUSTE DE FECHAS",
          variant: "warning",
          icon: <History size={14} />,
        };
      case "FEATURE_OVERRIDE_SET":
        return {
          label: "PERMISO OTORGADO",
          variant: "accent",
          icon: <ShieldCheck size={14} />,
        };
      case "FEATURE_OVERRIDE_REMOVED":
        return {
          label: "PERMISO REMOVIDO",
          variant: "neutral",
          icon: <ShieldAlert size={14} />,
        };
      case "TENANT_STATUS_CHANGED":
        return {
          label: "ESTADO DEL RESTAURANTE",
          variant: "warning",
          icon: <Sliders size={14} />,
        };
      case "PAYMENT_SUCCESS":
        return {
          label: "PAGO REGISTRADO",
          variant: "success",
          icon: <DollarSign size={14} />,
        };
      default:
        return {
          label: type,
          variant: "neutral",
          icon: <Info size={14} />,
        };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registro Histórico & Auditoría de Suscripción"
      size="lg"
      isLoading={loading}
    >
      <div className={styles.container}>
        <div className={styles.headerBanner}>
          <div className={styles.bannerInfo}>
            <span className={styles.tenantName}>{tenant.name}</span>
            <span className={styles.bannerSub}>
              Historial inmutable de movimientos, renovaciones y permisos
            </span>
          </div>
          <span className={styles.eventsCountBadge}>
            {events.length} {events.length === 1 ? "evento registrado" : "eventos registrados"}
          </span>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <SleekSpinner size="lg" color="primary" />
            <p>Cargando trazabilidad de la suscripción...</p>
          </div>
        ) : events.length === 0 ? (
          <div className={styles.emptyContainer}>
            <History size={36} className={styles.emptyIcon} />
            <p>Aún no hay eventos registrados para este restaurante.</p>
            <span className={styles.emptySub}>
              Cualquier cambio de plan, extensión manual o modificación de fechas quedará registrado aquí.
            </span>
          </div>
        ) : (
          <div className={styles.timeline}>
            {events.map((ev) => {
              const badge = getEventBadge(ev.type);

              return (
                <div key={ev.id} className={styles.timelineItem}>
                  <div className={styles.timelineMarker}>
                    <div className={`${styles.markerDot} ${styles[`markerDot--${badge.variant}`]}`}>
                      {badge.icon}
                    </div>
                    <div className={styles.markerLine} />
                  </div>

                  <div className={styles.timelineContent}>
                    <div className={styles.eventHeader}>
                      <span className={`${styles.typeBadge} ${styles[`typeBadge--${badge.variant}`]}`}>
                        {badge.label}
                      </span>
                      <span className={styles.timestamp}>{formatDateTime(ev.createdAt)}</span>
                    </div>

                    {ev.note && <p className={styles.eventNote}>{ev.note}</p>}

                    {ev.amount != null && (
                      <div className={styles.amountPill}>
                        Monto registrado: <strong>{formatCurrencyCOP(ev.amount)}</strong>
                      </div>
                    )}

                    {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                      <div className={styles.metaBox}>
                        {Object.entries(ev.metadata).map(([k, v]) => {
                          if (v === null || v === undefined) return null;
                          const valString = typeof v === "object" ? JSON.stringify(v) : String(v);

                          return (
                            <div key={k} className={styles.metaRow}>
                              <span className={styles.metaKey}>{k}:</span>
                              <span className={styles.metaVal}>{valString}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
