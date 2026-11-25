"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { formatDateShort, formatDateInput, addDaysToDate } from "@/lib/subscription-utils";
import { extendSubscriptionAction } from "@/app/actions/admin-subscriptions";
import { toast } from "sonner";
import styles from "./ExtendSubscriptionModal.module.css";
import { CalendarPlus, ArrowRight, Check, Sparkles } from "lucide-react";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";

interface Props {
  tenant: TenantAdminSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_DURATIONS = [
  { label: "+7 días", days: 7 },
  { label: "+15 días", days: 15 },
  { label: "+30 días (1 mes)", days: 30 },
  { label: "+90 días (3 meses)", days: 90 },
  { label: "+180 días (6 meses)", days: 180 },
  { label: "+365 días (1 año)", days: 365 },
];

export function ExtendSubscriptionModal({ tenant, isOpen, onClose, onSuccess }: Props) {
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [customDate, setCustomDate] = useState<string>("");
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);
  const [note, setNote] = useState<string>("Renovación / Extensión manual de suscripción");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!tenant || !tenant.subscription) return null;

  const now = new Date();
  const currentEnd = tenant.subscription.currentPeriodEnd
    ? new Date(tenant.subscription.currentPeriodEnd)
    : null;

  // Base date for extension: if current subscription is still active in the future, extend from that date; else from today
  const baseDate = currentEnd && currentEnd > now ? currentEnd : now;

  let calculatedEndDate: Date;
  let effectiveDaysToAdd: number;

  if (isCustomDate && customDate) {
    calculatedEndDate = new Date(`${customDate}T23:59:59`);
    const diffMs = calculatedEndDate.getTime() - baseDate.getTime();
    effectiveDaysToAdd = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  } else {
    effectiveDaysToAdd = selectedDays;
    calculatedEndDate = addDaysToDate(baseDate, selectedDays);
  }

  const handleSelectPreset = (days: number) => {
    setSelectedDays(days);
    setIsCustomDate(false);
    setCustomDate("");
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDate(e.target.value);
    setIsCustomDate(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant.subscription) return;

    setIsSubmitting(true);
    const parsedAmount = amount ? parseInt(amount.replace(/\D/g, ""), 10) : undefined;

    const res = await extendSubscriptionAction({
      subscriptionId: tenant.subscription.id,
      tenantId: tenant.id,
      daysToAdd: effectiveDaysToAdd,
      newEndDate: isCustomDate && customDate ? calculatedEndDate.toISOString() : undefined,
      note: note.trim(),
      amount: parsedAmount,
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
      title="Extender Suscripción Manualmente"
      size="md"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.tenantInfoBanner}>
          <div className={styles.tenantInfoLeft}>
            <span className={styles.tenantName}>{tenant.name}</span>
            <span className={styles.tenantPlan}>
              Plan: <strong>{tenant.subscription.plan.label}</strong>
            </span>
          </div>
          <div className={styles.tenantInfoRight}>
            <span className={styles.tenantDateLabel}>Vencimiento actual</span>
            <span className={styles.tenantDateValue}>
              {formatDateShort(currentEnd) || "Sin fecha fija"}
            </span>
          </div>
        </div>

        {/* Durations grid */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Selecciona el periodo a extender
          </label>
          <div className={styles.presetsGrid}>
            {PRESET_DURATIONS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => handleSelectPreset(preset.days)}
                className={`${styles.presetBtn} ${
                  !isCustomDate && selectedDays === preset.days ? styles["presetBtn--active"] : ""
                }`}
              >
                {!isCustomDate && selectedDays === preset.days && <Check size={14} />}
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date option */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            O define una fecha de vencimiento específica
          </label>
          <Input
            type="date"
            min={formatDateInput(now)}
            value={customDate}
            onChange={handleCustomDateChange}
            placeholder="Seleccionar fecha"
          />
        </div>

        {/* Calculation Preview Box */}
        <div className={styles.previewBox}>
          <div className={styles.previewHeader}>
            <Sparkles size={16} className={styles.sparkleIcon} />
            <span className={styles.previewTitle}>Cálculo del nuevo período</span>
          </div>
          <div className={styles.previewTimeline}>
            <div className={styles.timelineNode}>
              <span className={styles.nodeLabel}>Desde</span>
              <span className={styles.nodeValue}>{formatDateShort(baseDate)}</span>
            </div>
            <ArrowRight size={18} className={styles.timelineArrow} />
            <div className={styles.timelineNode}>
              <span className={styles.nodeLabel}>Nuevo Vencimiento</span>
              <span className={`${styles.nodeValue} ${styles["nodeValue--new"]}`}>
                {formatDateShort(calculatedEndDate)}
              </span>
            </div>
          </div>
          <div className={styles.previewTag}>
            +{effectiveDaysToAdd} días adicionales de servicio activo
          </div>
        </div>

        {/* Motivo / Nota */}
        <div className={styles.fieldGroup}>
          <Textarea
            label="Motivo / Nota de la extensión (quedará en el historial)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            required
            placeholder="Ej: Pago recibido vía Nequi, soporte especial, etc."
          />
        </div>

        {/* Monto pagado opcional */}
        <div className={styles.fieldGroup}>
          <Input
            label="Monto registrado (Opcional en COP)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ej: 49900"
            hint="Si se cobró por fuera de la plataforma (Nequi, efectivo, transferencia)"
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
            icon={<CalendarPlus size={16} />}
          >
            Confirmar Extensión
          </Button>
        </div>
      </form>
    </Modal>
  );
}
