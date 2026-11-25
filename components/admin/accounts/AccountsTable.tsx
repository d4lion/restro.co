"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  ExternalLink,
  Store,
  CheckCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Crown,
  Briefcase,
  UtensilsCrossed,
  ChefHat,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { formatDateTime } from "@/lib/subscription-utils";
import { ChangeRoleModal } from "./ChangeRoleModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { CreateAccountModal } from "./CreateAccountModal";
import { EditUserModal } from "./EditUserModal";
import { deleteUserAction } from "@/app/actions/platform-admin-accounts";
import { toast } from "sonner";
import styles from "./AccountsTable.module.css";
import type { UserAccountSummary } from "@/lib/repositories/platform-admin.repository";
import type { StaffRole } from "@/lib/types";

interface TenantOption {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  accounts: UserAccountSummary[];
  tenants: TenantOption[];
}

export function AccountsTable({ accounts, tenants }: Props) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modals state
  const [selectedUser, setSelectedUser] = useState<UserAccountSummary | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Confirmation modal state
  const [userToDelete, setUserToDelete] = useState<UserAccountSummary | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeletingUser(true);
    const res = await deleteUserAction({ userId: userToDelete.id });
    setIsDeletingUser(false);

    if (res.success) {
      toast.success(res.message);
      setUserToDelete(null);
      handleRefresh();
    } else {
      toast.error(res.message);
    }
  };

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return accounts.filter((acc) => {
      if (q) {
        const matchName = acc.name.toLowerCase().includes(q);
        const matchEmail = acc.email.toLowerCase().includes(q);
        const matchTenant = acc.tenant.name.toLowerCase().includes(q);
        const matchSlug = acc.tenant.slug.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchTenant && !matchSlug) return false;
      }

      if (roleFilter !== "ALL" && acc.role !== roleFilter) {
        return false;
      }

      return true;
    });
  }, [accounts, searchQuery, roleFilter]);

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case "SUPERADMIN":
        return <span className={`${styles.roleBadge} ${styles["roleBadge--super"]}`}>SUPER ADMIN</span>;
      case "OWNER":
        return <span className={`${styles.roleBadge} ${styles["roleBadge--owner"]}`}>PROPIETARIO</span>;
      case "MANAGER":
        return <span className={`${styles.roleBadge} ${styles["roleBadge--manager"]}`}>GERENTE</span>;
      case "WAITER":
        return <span className={`${styles.roleBadge} ${styles["roleBadge--waiter"]}`}>MESERO</span>;
      case "KITCHEN":
        return <span className={`${styles.roleBadge} ${styles["roleBadge--kitchen"]}`}>COCINA</span>;
      default:
        return <span className={styles.roleBadge}>{role}</span>;
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Cuentas y Accesos de la Plataforma</h2>
          <p className={styles.subtitle}>
            Administra los usuarios registrados, cambia roles, restablece contraseñas y asigna staff.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<UserPlus size={16} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Crear Nueva Cuenta
        </Button>
      </div>

      {/* Controls */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por nombre, correo o restaurante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.roleTabs}>
          {[
            { id: "ALL", label: `Todos (${accounts.length})`, icon: <Users size={13} /> },
            { id: "SUPERADMIN", label: "Super Admins", icon: <ShieldCheck size={13} /> },
            { id: "OWNER", label: "Dueños (Owners)", icon: <Crown size={13} /> },
            { id: "MANAGER", label: "Gerentes", icon: <Briefcase size={13} /> },
            { id: "WAITER", label: "Meseros", icon: <UtensilsCrossed size={13} /> },
            { id: "KITCHEN", label: "Cocina", icon: <ChefHat size={13} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${roleFilter === tab.id ? styles["tabBtn--active"] : ""}`}
              onClick={() => setRoleFilter(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      {filteredAccounts.length === 0 ? (
        <div className={styles.emptyCard}>
          <p>No se encontraron cuentas de usuario que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Restaurante Asignado</th>
                  <th>Rol de Acceso</th>
                  <th>Último Ingreso</th>
                  <th>Fecha de Registro</th>
                  <th style={{ textAlign: "right" }}>Acciones de Cuenta</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id}>
                    {/* User name & email */}
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatarMini}>{acc.name.charAt(0).toUpperCase()}</div>
                        <div className={styles.userDetails}>
                          <span className={styles.userName}>{acc.name}</span>
                          <span className={styles.userEmail}>{acc.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Associated Tenant */}
                    <td>
                      <div className={styles.tenantCell}>
                        <span className={styles.tenantName}>{acc.tenant.name}</span>
                        <div className={styles.tenantSub}>
                          <span>/{acc.tenant.slug}</span>
                          <span className={styles.planMiniBadge}>{acc.tenant.planLabel}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>{getRoleBadge(acc.role)}</td>

                    {/* Last Login */}
                    <td>
                      <span className={styles.dateText}>
                        {acc.lastLoginAt ? formatDateTime(acc.lastLoginAt) : "Nunca"}
                      </span>
                    </td>

                    {/* Created At */}
                    <td>
                      <span className={styles.dateText}>{formatDateTime(acc.createdAt)}</span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "right" }}>
                      <div className={styles.actionsRow}>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Shield size={13} />}
                          title="Modificar Rol"
                          onClick={() => {
                            setSelectedUser(acc);
                            setIsRoleModalOpen(true);
                          }}
                        >
                          Rol
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<KeyRound size={13} />}
                          title="Restablecer Contraseña"
                          onClick={() => {
                            setSelectedUser(acc);
                            setIsPasswordModalOpen(true);
                          }}
                        >
                          Clave
                        </Button>

                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          title="Editar Datos"
                          onClick={() => {
                            setSelectedUser(acc);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          type="button"
                          className={`${styles.iconActionBtn} ${styles["iconActionBtn--danger"]}`}
                          title="Eliminar Cuenta"
                          onClick={() => setUserToDelete(acc)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ChangeRoleModal
        user={selectedUser}
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <ChangePasswordModal
        user={selectedUser}
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <EditUserModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <CreateAccountModal
        tenants={tenants}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* Confirmation Modal for Account Deletion */}
      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => {
          if (!isDeletingUser) setUserToDelete(null);
        }}
        onConfirm={handleConfirmDeleteUser}
        title="Eliminar Cuenta de Usuario"
        variant="danger"
        confirmText="Eliminar Cuenta Definitivamente"
        isLoading={isDeletingUser}
        message={
          <span>
            ¿Estás seguro de que deseas eliminar permanentemente la cuenta de{" "}
            <strong>{userToDelete?.name}</strong> (<code>{userToDelete?.email}</code>)?
            Esta acción revocará sus accesos y no se puede deshacer.
          </span>
        }
      />
    </div>
  );
}
