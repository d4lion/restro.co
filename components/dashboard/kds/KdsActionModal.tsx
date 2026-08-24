"use client";

import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  XCircle,
  UserX,
  ShieldAlert,
  RefreshCw,
  PackageX,
  Clock,
  FileText,
  AlertCircle,
  MapPin,
  UtensilsCrossed,
  Check,
} from "lucide-react";
import styles from "./KdsDashboard.module.css";

export type ModalMode = "CANCEL" | "INCIDENT";

interface QuickReason {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const CANCEL_REASONS: QuickReason[] = [
  {
    id: "user_cancelled",
    title: "Cliente canceló el pedido",
    description: "El usuario solicitó anular o se retiró del local",
    icon: <UserX size={20} className={styles.reasonIconDanger} />,
  },
  {
    id: "fraudulent",
    title: "Orden ilegítima o fraudulenta",
    description: "Pedido de prueba, spam o cliente inaccesible",
    icon: <ShieldAlert size={20} className={styles.reasonIconDanger} />,
  },
  {
    id: "order_changed",
    title: "Cambio de pedido / Modificación",
    description: "Se anula para reemplazar por una comanda corregida",
    icon: <RefreshCw size={20} className={styles.reasonIconInfo} />,
  },
  {
    id: "out_of_stock",
    title: "Falta de ingredientes / Agotado",
    description: "Insumos agotados para preparar uno o más platos",
    icon: <PackageX size={20} className={styles.reasonIconWarning} />,
  },
  {
    id: "excessive_wait",
    title: "Tiempo de espera excesivo",
    description: "Demora en cocina y el cliente no puede esperar",
    icon: <Clock size={20} className={styles.reasonIconWarning} />,
  },
  {
    id: "custom",
    title: "Otra razón personalizada",
    description: "Especificar motivo detallado en la nota inferior",
    icon: <FileText size={20} className={styles.reasonIconNeutral} />,
  },
];

const INCIDENT_REASONS: QuickReason[] = [
  {
    id: "missing_ingredient",
    title: "Falta de ingredientes / Stock bajo",
    description: "Notificar ingrediente agotado o sustituto aplicado",
    icon: <PackageX size={20} className={styles.reasonIconWarning} />,
  },
  {
    id: "kitchen_delay",
    title: "Demora en cocina / Alta carga",
    description: "Volumen alto de comandas afectando tiempo de entrega",
    icon: <Clock size={20} className={styles.reasonIconWarning} />,
  },
  {
    id: "special_instruction",
    title: "Alergia o instrucción especial",
    description: "Observación crítica sobre la preparación del plato",
    icon: <AlertCircle size={20} className={styles.reasonIconDanger} />,
  },
  {
    id: "table_address_issue",
    title: "Inconsistencia en Mesa / Dirección",
    description: "Verificar ubicación de entrega o número de mesa",
    icon: <MapPin size={20} className={styles.reasonIconInfo} />,
  },
  {
    id: "order_item_error",
    title: "Error en comanda / Ajuste de ítem",
    description: "Detalle a rectificar con mesero o caja",
    icon: <UtensilsCrossed size={20} className={styles.reasonIconInfo} />,
  },
  {
    id: "custom",
    title: "Otra observación de cocina",
    description: "Escribir detalle específico en el campo inferior",
    icon: <FileText size={20} className={styles.reasonIconNeutral} />,
  },
];

interface KdsActionModalProps {
  isOpen: boolean;
  mode: ModalMode;
  orderNumber: number;
  customerName?: string | null;
  onClose: () => void;
  onConfirm: (reasonTitle: string, customNote?: string) => void;
}

export const KdsActionModal = React.memo(function KdsActionModal({
  isOpen,
  mode,
  orderNumber,
  customerName,
  onClose,
  onConfirm,
}: KdsActionModalProps) {
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [customNote, setCustomNote] = useState<string>("");

  if (!isOpen) return null;

  const isCancel = mode === "CANCEL";
  const reasonsList = isCancel ? CANCEL_REASONS : INCIDENT_REASONS;

  const handleSelectReason = (reason: QuickReason) => {
    setSelectedReasonId(reason.id);
  };

  const handleConfirm = () => {
    const selectedReason = reasonsList.find((r) => r.id === selectedReasonId);
    let mainReasonTitle = selectedReason?.title || "";

    if (!mainReasonTitle && !customNote.trim()) {
      return;
    }

    if (!mainReasonTitle && customNote.trim()) {
      mainReasonTitle = "Nota personalizada";
    }

    onConfirm(mainReasonTitle, customNote.trim());
    setSelectedReasonId("");
    setCustomNote("");
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTitleGroup}>
            <div
              className={`${styles.modalHeaderIconBadge} ${
                isCancel ? styles.badgeCancel : styles.badgeIncident
              }`}
            >
              {isCancel ? <XCircle size={22} /> : <AlertTriangle size={22} />}
            </div>

            <div>
              <h3 className={styles.modalTitle}>
                {isCancel
                  ? `Cancelar Comanda #${orderNumber}`
                  : `Reportar Novedad — Comanda #${orderNumber}`}
              </h3>
              <p className={styles.modalSubtitle}>
                {customerName ? `Cliente: ${customerName} · ` : ""}
                {isCancel
                  ? "Selecciona el motivo principal para anular la comanda"
                  : "Registra la observación de cocina para trazabilidad"}
              </p>
            </div>
          </div>

          <button
            className={styles.modalCloseBtn}
            onClick={onClose}
            title="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body: Quick Selection Cards */}
        <div className={styles.modalBody}>
          <label className={styles.sectionLabel}>
            Motivos frecuentes (Selección rápida):
          </label>

          <div className={styles.reasonsGrid}>
            {reasonsList.map((reason) => {
              const isSelected = selectedReasonId === reason.id;
              return (
                <div
                  key={reason.id}
                  className={`${styles.reasonCard} ${
                    isSelected ? styles.reasonCardSelected : ""
                  }`}
                  onClick={() => handleSelectReason(reason)}
                >
                  <div className={styles.reasonCardHeader}>
                    {reason.icon}
                    <span className={styles.reasonTitle}>{reason.title}</span>
                    {isSelected && (
                      <span className={styles.selectedCheckBadge}>
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                  <p className={styles.reasonDesc}>{reason.description}</p>
                </div>
              );
            })}
          </div>

          {/* Optional Textarea Input */}
          <div className={styles.textareaGroup}>
            <label className={styles.sectionLabel}>
              Detalle u observación escrita (Opcional):
            </label>
            <textarea
              className={styles.modalTextarea}
              placeholder={
                isCancel
                  ? "Escribe detalles adicionales sobre la cancelación..."
                  : "Escribe la novedad detallada (ej. sin cebolla, ingrediente agotado)..."
              }
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.modalBtnSecondary} onClick={onClose}>
            Volver
          </button>

          <button
            className={`${styles.modalBtnPrimary} ${
              isCancel ? styles.btnPrimaryDanger : styles.btnPrimaryWarning
            }`}
            onClick={handleConfirm}
            disabled={!selectedReasonId && !customNote.trim()}
          >
            {isCancel ? (
              <>
                <XCircle size={16} /> Confirmar Cancelación
              </>
            ) : (
              <>
                <AlertTriangle size={16} /> Registrar Novedad
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
