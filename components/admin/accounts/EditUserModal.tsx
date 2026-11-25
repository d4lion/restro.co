"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateUserDetailsAction } from "@/app/actions/platform-admin-accounts";
import { toast } from "sonner";
import styles from "./AccountModals.module.css";
import { UserCheck } from "lucide-react";
import type { UserAccountSummary } from "@/lib/repositories/platform-admin.repository";

interface Props {
  user: UserAccountSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserModal({ user, isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user, isOpen]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Nombre y correo son requeridos");
      return;
    }

    setIsSubmitting(true);
    const res = await updateUserDetailsAction({
      userId: user.id,
      name: name.trim(),
      email: email.trim(),
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
      title="Editar Datos de Cuenta"
      size="md"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldGroup}>
          <Input
            label="Nombre Completo"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <Input
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            hint="Si cambias el correo, el usuario deberá iniciar sesión con el nuevo correo"
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
            icon={<UserCheck size={16} />}
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}
