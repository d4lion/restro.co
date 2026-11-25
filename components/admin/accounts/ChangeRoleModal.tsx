"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { updateUserRoleAction } from "@/app/actions/platform-admin-accounts";
import { toast } from "sonner";
import styles from "./AccountModals.module.css";
import { Shield, ShieldAlert, Check } from "lucide-react";
import type { UserAccountSummary } from "@/lib/repositories/platform-admin.repository";
import type { StaffRole } from "@/lib/types";

interface Props {
  user: UserAccountSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLES: Array<{ role: StaffRole; label: string; desc: string; isSuper?: boolean }> = [
  {
    role: "SUPERADMIN",
    label: "Super Administrador (Plataforma)",
    desc: "Control total sobre todos los restaurantes, suscripciones, métricas y cuentas.",
    isSuper: true,
  },
  {
    role: "OWNER",
    label: "Propietario (Owner)",
    desc: "Dueño del restaurante. Acceso total a la configuración y carta de su local.",
  },
  {
    role: "MANAGER",
    label: "Gerente (Manager)",
    desc: "Gestión operativa de pedidos, carta, mesas y reportes del local.",
  },
  {
    role: "WAITER",
    label: "Mesero",
    desc: "Acceso para tomar pedidos y gestionar mesas en tiempo real.",
  },
  {
    role: "KITCHEN",
    label: "Cocina / KDS",
    desc: "Acceso exclusivo a la pantalla KDS de comandas y preparación.",
  },
];

export function ChangeRoleModal({ user, isOpen, onClose, onSuccess }: Props) {
  const [selectedRole, setSelectedRole] = useState<StaffRole>(user?.role || "OWNER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === user.role) {
      toast.info("El usuario ya tiene este rol");
      return;
    }

    setIsSubmitting(true);
    const res = await updateUserRoleAction({
      userId: user.id,
      newRole: selectedRole,
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
      title="Modificar Rol de Usuario"
      size="md"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.userBanner}>
          <div className={styles.userAvatar}>{user.name.charAt(0).toUpperCase()}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userSub}>
              {user.email} • Restaurante: <strong>{user.tenant.name}</strong>
            </span>
          </div>
        </div>

        <div className={styles.rolesList}>
          {ROLES.map((r) => {
            const isSelected = selectedRole === r.role;
            const isCurrent = user.role === r.role;

            return (
              <div
                key={r.role}
                onClick={() => setSelectedRole(r.role)}
                className={[
                  styles.roleCard,
                  isSelected ? styles["roleCard--selected"] : "",
                  r.isSuper ? styles["roleCard--super"] : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={styles.roleCardHeader}>
                  <div className={styles.roleTitleGroup}>
                    {r.isSuper ? <ShieldAlert size={16} color="#DC2626" /> : <Shield size={16} />}
                    <strong>{r.label}</strong>
                    {isCurrent && <span className={styles.currentTag}>ACTUAL</span>}
                  </div>
                  {isSelected && <Check size={16} className={styles.checkIcon} />}
                </div>
                <p className={styles.roleDesc}>{r.desc}</p>
              </div>
            );
          })}
        </div>

        <div className={styles.footerActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={selectedRole === user.role}
          >
            Actualizar Rol
          </Button>
        </div>
      </form>
    </Modal>
  );
}
