"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { changeUserPasswordAction } from "@/app/actions/platform-admin-accounts";
import { toast } from "sonner";
import styles from "./AccountModals.module.css";
import { KeyRound, Sparkles, Copy, Check } from "lucide-react";
import type { UserAccountSummary } from "@/lib/repositories/platform-admin.repository";

interface Props {
  user: UserAccountSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangePasswordModal({ user, isOpen, onClose, onSuccess }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  const handleCopy = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    toast.success("Contraseña copiada al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);
    const res = await changeUserPasswordAction({
      userId: user.id,
      newPassword,
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
      title="Restablecer Contraseña de Cuenta"
      size="md"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.userBanner}>
          <div className={styles.userAvatar}>{user.name.charAt(0).toUpperCase()}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userSub}>{user.email}</span>
          </div>
        </div>

        <div className={styles.passwordFieldGroup}>
          <Input
            label="Nueva Contraseña"
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Ingresa la nueva contraseña"
            hint="Mínimo 6 caracteres. El usuario podrá iniciar sesión inmediatamente con esta clave."
          />

          <div className={styles.passwordHelperButtons}>
            <button
              type="button"
              className={styles.generateBtn}
              onClick={generateRandomPassword}
            >
              <Sparkles size={14} /> Generar contraseña segura
            </button>

            {newPassword && (
              <button type="button" className={styles.copyBtn} onClick={handleCopy}>
                {copied ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                {copied ? "¡Copiada!" : "Copiar"}
              </button>
            )}
          </div>
        </div>

        <div className={styles.footerActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            icon={<KeyRound size={16} />}
          >
            Actualizar Contraseña
          </Button>
        </div>
      </form>
    </Modal>
  );
}
