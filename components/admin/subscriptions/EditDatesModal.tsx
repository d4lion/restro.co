"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { formatDateInput, addDaysToDate } from "@/lib/subscription-utils";
import { updateSubscriptionDatesAction } from "@/app/actions/admin-subscriptions";
import { toast } from "sonner";
import styles from "./EditDatesModal.module.css";
import { Calendar, Save, Calculator } from "lucide-react";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";

interface Props {
  tenant: TenantAdminSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDatesModal({ tenant, isOpen, onClose, onSuccess }: Props) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [trialEndsAt, setTrialEndsAt] = useState<string>("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (tenant && tenant.subscription) {
      const now = new Date();
      setStartDate(formatDateInput(tenant.subscription.currentPeriodStart || now));
      setEndDate(formatDateInput(tenant.subscription.currentPeriodEnd || addDaysToDate(now, 30)));
      setTrialEndsAt(formatDateInput(tenant.subscription.trialEndsAt));
      setStatus(tenant.subscription.status || "ACTIVE");
      setNote("Configuración manual de fechas de suscripción");
    }
  }, [tenant, isOpen]);

  if (!tenant || !tenant.subscription) return null;

  const handleApplyDurationFromStart = (days: number) => {
    const base = startDate ? new Date(startDate) : new Date();
    const calculated = addDaysToDate(base, days);
    setEndDate(formatDateInput(calculated));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant.subscription) return;

    setIsSubmitting(true);
    const res = await updateSubscriptionDatesAction({
      subscriptionId: tenant.subscription.id,
      tenantId: tenant.id,
      startDate: startDate ? `${startDate}T00:00:00` : null,
      endDate: endDate ? `${endDate}T23:59:59` : null,
      trialEndsAt: trialEndsAt ? `${trialEndsAt}T23:59:59` : null,
      status,
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
      title="Configurar Fechas y Estado de Suscripción"
      size="md"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.tenantInfoBanner}>
          <span className={styles.tenantName}>{tenant.name}</span>
          <span className={styles.tenantPlan}>
            Plan: <strong>{tenant.subscription.plan.label}</strong>
          </span>
        </div>

        {/* Start Date */}
        <div className={styles.fieldGroup}>
          <Input
            label="Fecha de inicio de la suscripción / ciclo actual"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            hint="Día en el que empezó o se activó el período actual"
          />
        </div>

        {/* Quick calculators */}
        <div className={styles.calcRow}>
          <span className={styles.calcTitle}>
            <Calculator size={13} /> Calcular fin automáticamente:
          </span>
          <div className={styles.calcButtons}>
            <button
              type="button"
              className={styles.calcBtn}
              onClick={() => handleApplyDurationFromStart(15)}
            >
              +15 días
            </button>
            <button
              type="button"
              className={styles.calcBtn}
              onClick={() => handleApplyDurationFromStart(30)}
            >
              +30 días (1 mes)
            </button>
            <button
              type="button"
              className={styles.calcBtn}
              onClick={() => handleApplyDurationFromStart(90)}
            >
              +90 días (3 meses)
            </button>
            <button
              type="button"
              className={styles.calcBtn}
              onClick={() => handleApplyDurationFromStart(365)}
            >
              +365 días (1 año)
            </button>
          </div>
        </div>

        {/* End Date */}
        <div className={styles.fieldGroup}>
          <Input
            label="Fecha de vencimiento (Period End)"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            hint="Fecha límite en la que expira la suscripción"
          />
        </div>

        {/* Trial End Date (Optional) */}
        <div className={styles.fieldGroup}>
          <Input
            label="Fecha límite de período de prueba (Opcional)"
            type="date"
            value={trialEndsAt}
            onChange={(e) => setTrialEndsAt(e.target.value)}
            hint="Dejar vacío si no está en período de prueba gratuito"
          />
        </div>

        {/* Status selector */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Estado de la suscripción</label>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ACTIVE">ACTIVE — Activa y al día</option>
            <option value="TRIAL">TRIAL — En período de prueba</option>
            <option value="EXPIRED">EXPIRED — Vencida</option>
            <option value="PAST_DUE">PAST_DUE — Pago atrasado</option>
            <option value="CANCELLED">CANCELLED — Cancelada</option>
          </select>
        </div>

        {/* Note */}
        <div className={styles.fieldGroup}>
          <Textarea
            label="Nota del cambio (quedará registrada en la auditoría)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            required
            placeholder="Motivo del ajuste manual de fechas"
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
            icon={<Save size={16} />}
          >
            Guardar Fechas
          </Button>
        </div>
      </form>
    </Modal>
  );
}
