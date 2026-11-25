"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { changeTenantPlanAdminAction } from "@/app/actions/admin-subscriptions";
import { toast } from "sonner";
import styles from "./ChangePlanModal.module.css";
import { Sparkles, Check, ArrowUpRight } from "lucide-react";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";
import type { PlanKey } from "@/lib/types";

interface Props {
  tenant: TenantAdminSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_PLANS: Array<{
  key: PlanKey;
  label: string;
  tag: string;
  price: string;
  desc: string;
  highlight?: boolean;
}> = [
  {
    key: "STARTER",
    label: "Starter",
    tag: "GRATIS",
    price: "Gratis",
    desc: "Hasta 5 mesas y 5 productos en carta. Carta digital informativa.",
  },
  {
    key: "CARTA_DIGITAL",
    label: "Carta Digital",
    tag: "ESENCIAL",
    price: "$9.900/mes",
    desc: "Productos y códigos QR ilimitados. Impresión por mesa.",
  },
  {
    key: "RESTRO_IA",
    label: "Restro IA",
    tag: "PRO",
    price: "$49.900/mes",
    desc: "KDS en tiempo real, inventario, analítica y sugerencias con IA.",
    highlight: true,
  },
  {
    key: "BUSINESS",
    label: "Business",
    tag: "ENTERPRISE",
    price: "$99.900/mes",
    desc: "Todo ilimitado, canal WhatsApp integrado, reportes Excel y soporte VIP.",
  },
];

export function ChangePlanModal({ tenant, isOpen, onClose, onSuccess }: Props) {
  const currentPlanKey = tenant?.subscription?.plan.key || "STARTER";
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(currentPlanKey);
  const [resetCycle, setResetCycle] = useState<boolean>(true);
  const [note, setNote] = useState<string>("Actualización de plan administrativa");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!tenant || !tenant.subscription) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlan === currentPlanKey) {
      toast.info("El restaurante ya tiene este plan seleccionado");
      return;
    }

    setIsSubmitting(true);
    const res = await changeTenantPlanAdminAction({
      tenantId: tenant.id,
      newPlanKey: selectedPlan,
      resetCycle,
      cycleDays: 30,
      note: note.trim(),
    });

    setIsSubmitting(false);

    if (res.success) {
      toast.success(res.message);
      onSuccess();
      onClose();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar Plan de Suscripción"
      size="md"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.tenantInfoBanner}>
          <span className={styles.tenantName}>{tenant.name}</span>
          <span className={styles.tenantCurrent}>
            Plan actual: <strong>{tenant.subscription.plan.label}</strong>
          </span>
        </div>

        <div className={styles.plansList}>
          {AVAILABLE_PLANS.map((p) => {
            const isCurrent = p.key === currentPlanKey;
            const isSelected = p.key === selectedPlan;

            return (
              <div
                key={p.key}
                onClick={() => setSelectedPlan(p.key)}
                className={[
                  styles.planCard,
                  isSelected ? styles["planCard--selected"] : "",
                  isCurrent ? styles["planCard--current"] : "",
                  p.highlight ? styles["planCard--highlight"] : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={styles.planCardHeader}>
                  <div className={styles.planTitleGroup}>
                    <span className={styles.planName}>{p.label}</span>
                    <span className={styles.planTag}>{p.tag}</span>
                    {isCurrent && <span className={styles.currentBadge}>ACTUAL</span>}
                  </div>
                  <span className={styles.planPrice}>{p.price}</span>
                </div>
                <p className={styles.planDesc}>{p.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Reset cycle switch */}
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={resetCycle}
            onChange={(e) => setResetCycle(e.target.checked)}
            className={styles.checkbox}
          />
          <div>
            <strong>Reiniciar ciclo de facturación a 30 días</strong>
            <p>Establece la fecha de inicio hoy y fecha de fin dentro de 30 días.</p>
          </div>
        </label>

        {/* Note */}
        <div className={styles.fieldGroup}>
          <Textarea
            label="Motivo del cambio de plan (para el registro de auditoría)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            required
            placeholder="Ej: Solicitud del cliente, upgrade pactado, etc."
          />
        </div>

        <div className={styles.footerActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={selectedPlan === currentPlanKey}
            icon={<ArrowUpRight size={16} />}
          >
            Actualizar Plan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
