"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createAccountForTenantAction } from "@/app/actions/platform-admin-accounts";
import { toast } from "sonner";
import styles from "./AccountModals.module.css";
import { UserPlus, Sparkles } from "lucide-react";
import type { StaffRole } from "@/lib/types";

interface TenantOption {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  tenants: TenantOption[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAccountModal({ tenants, isOpen, onClose, onSuccess }: Props) {
  const [tenantId, setTenantId] = useState(tenants[0]?.id || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("OWNER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !email || !password || !name) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsSubmitting(true);
    const res = await createAccountForTenantAction({
      tenantId,
      email: email.trim(),
      password,
      name: name.trim(),
      role,
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success(res.message);
      setName("");
      setEmail("");
      setPassword("");
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
      title="Crear Nueva Cuenta de Usuario"
      size="md"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Asignar al Restaurante / Tenant</label>
          <select
            className={styles.select}
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            required
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (/{t.slug})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <Input
            label="Nombre Completo"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ej: Laura Ramírez"
          />
        </div>

        <div className={styles.fieldGroup}>
          <Input
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="laura@restaurante.com"
          />
        </div>

        <div className={styles.fieldGroup}>
          <Input
            label="Contraseña Inicial"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Mínimo 6 caracteres"
          />
          <button
            type="button"
            className={styles.generateInlineBtn}
            onClick={generateRandomPassword}
          >
            <Sparkles size={13} /> Generar contraseña aleatoria
          </button>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Rol asignado</label>
          <select
            className={styles.select}
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
          >
            <option value="OWNER">Propietario (Owner)</option>
            <option value="MANAGER">Gerente (Manager)</option>
            <option value="WAITER">Mesero</option>
            <option value="KITCHEN">Cocina</option>
            <option value="SUPERADMIN">Super Administrador (Plataforma)</option>
          </select>
        </div>

        <div className={styles.footerActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            icon={<UserPlus size={16} />}
          >
            Crear Cuenta
          </Button>
        </div>
      </form>
    </Modal>
  );
}
