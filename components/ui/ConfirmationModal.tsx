"use client";

import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import styles from "./ConfirmationModal.module.css";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "primary",
  isLoading = false,
}: ConfirmationModalProps) {
  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertTriangle size={22} />;
      case "warning":
        return <AlertCircle size={22} />;
      case "primary":
      default:
        return <Info size={22} />;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case "danger":
        return "danger";
      case "warning":
        return "orange";
      case "primary":
      default:
        return "primary";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showClose={!isLoading}
      isLoading={isLoading}
    >
      <div className={styles.content}>
        <div className={styles.bodyRow}>
          <div className={`${styles.iconCircle} ${styles[`iconCircle--${variant}`]}`}>
            {getIcon()}
          </div>
          <div className={styles.textGroup}>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.message}>{message}</div>
          </div>
        </div>

        <div className={styles.footer}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={getButtonVariant()}
            size="sm"
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
