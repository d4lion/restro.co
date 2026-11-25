"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Store,
  Users,
  Search,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AccountsTable } from "../accounts/AccountsTable";
import { formatCurrencyCOP, formatDateShort } from "@/lib/subscription-utils";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";
import type { UserAccountSummary } from "@/lib/repositories/platform-admin.repository";
import type { PlatformMarketReport } from "@/lib/repositories/market-research.repository";
import styles from "./ClientsCRM.module.css";

interface Props {
  tenants: TenantAdminSummary[];
  accounts: UserAccountSummary[];
  marketReport: PlatformMarketReport;
  onOpenDetail: (tenant: TenantAdminSummary) => void;
  onExtend: (tenant: TenantAdminSummary) => void;
  onEditDates: (tenant: TenantAdminSummary) => void;
}

export function ClientsCRM({
  tenants,
  accounts,
  marketReport,
  onOpenDetail,
  onExtend,
  onEditDates,
}: Props) {
  const [activeTab, setActiveTab] = useState<"restaurants" | "accounts">("restaurants");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const benchmarksMap = useMemo(() => {
    const map = new Map<string, (typeof marketReport.tenants)[0]>();
    marketReport.tenants.forEach((b) => map.set(b.tenantId, b));
    return map;
  }, [marketReport.tenants]);

  const activeTenantsCount = tenants.filter((t) => t.isActive).length;
  const suspendedTenantsCount = tenants.length - activeTenantsCount;

  const filteredTenants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return tenants.filter((t) => {
      if (q) {
        const matchName = t.name.toLowerCase().includes(q);
        const matchSlug = t.slug.toLowerCase().includes(q);
        const matchEmail = t.ownerUser?.email.toLowerCase().includes(q);
        const matchCity = t.city?.toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchEmail && !matchCity) return false;
      }

      if (statusFilter === "ACTIVE" && !t.isActive) return false;
      if (statusFilter === "SUSPENDED" && t.isActive) return false;

      return true;
    });
  }, [tenants, searchQuery, statusFilter]);

  const tenantOptions = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
  }));

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Clientes y Restaurantes (CRM Operativo)</h2>
          <p className={styles.subtitle}>
            Directorio maestro de restaurantes, propietarios y cuentas de personal con acceso al sistema.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            Total Restaurantes
            <Store size={14} />
          </span>
          <span className={styles.kpiValue}>{tenants.length}</span>
          <span className={styles.kpiSub}>Ecosistema Restro Core</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            Operando (Activos)
            <CheckCircle2 size={14} style={{ color: "#16A34A" }} />
          </span>
          <span className={styles.kpiValue} style={{ color: "#16A34A" }}>
            {activeTenantsCount}
          </span>
          <span className={styles.kpiSub}>Servicio habilitado</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            Suspendidos
            <AlertTriangle size={14} style={{ color: "#DC2626" }} />
          </span>
          <span className={styles.kpiValue} style={{ color: "#DC2626" }}>
            {suspendedTenantsCount}
          </span>
          <span className={styles.kpiSub}>Sin acceso operativo</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            Cuentas de Acceso
            <Users size={14} />
          </span>
          <span className={styles.kpiValue}>{accounts.length}</span>
          <span className={styles.kpiSub}>Superadmins, owners y staff</span>
        </div>
      </div>

      {/* View Switcher: Restaurants vs Accounts */}
      <div className={styles.viewSwitcher}>
        <button
          type="button"
          className={`${styles.switcherBtn} ${activeTab === "restaurants" ? styles["switcherBtn--active"] : ""}`}
          onClick={() => setActiveTab("restaurants")}
        >
          <Store size={14} />
          <span>Restaurantes (Tenants)</span>
          <span className={styles.countTag}>{tenants.length}</span>
        </button>

        <button
          type="button"
          className={`${styles.switcherBtn} ${activeTab === "accounts" ? styles["switcherBtn--active"] : ""}`}
          onClick={() => setActiveTab("accounts")}
        >
          <Users size={14} />
          <span>Cuentas de Usuarios (Staff)</span>
          <span className={styles.countTag}>{accounts.length}</span>
        </button>
      </div>

      {/* SECTION 1: RESTAURANTS DIRECTORY */}
      {activeTab === "restaurants" && (
        <>
          {/* Controls */}
          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar por restaurante, slug, ciudad o dueño..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVE">Solo Activos</option>
              <option value="SUSPENDED">Solo Suspendidos</option>
            </select>
          </div>

          {/* Table */}
          {filteredTenants.length === 0 ? (
            <div className={styles.tableContainer}>
              <div className={styles.emptyState}>
                <p>No se encontraron restaurantes con los filtros aplicados.</p>
              </div>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Restaurante</th>
                      <th>Estado Operativo</th>
                      <th>Plan SaaS</th>
                      <th>Ubicación</th>
                      <th>Capacidad</th>
                      <th>Ventas (GMV)</th>
                      <th style={{ textAlign: "right" }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((t) => {
                      const bm = benchmarksMap.get(t.id);
                      return (
                        <tr key={t.id}>
                          <td>
                            <div className={styles.restaurantCell}>
                              <span className={styles.restaurantName}>{t.name}</span>
                              <div className={styles.restaurantSub}>
                                <Link
                                  href={`/restaurant/${t.slug}`}
                                  target="_blank"
                                  style={{ color: "#2563EB", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px" }}
                                >
                                  /{t.slug} <ExternalLink size={10} />
                                </Link>
                                {t.ownerUser?.email && <span>• {t.ownerUser.email}</span>}
                              </div>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`${styles.statusPill} ${
                                t.isActive ? styles["statusPill--active"] : styles["statusPill--suspended"]
                              }`}
                            >
                              {t.isActive ? "Activo" : "Suspendido"}
                            </span>
                          </td>

                          <td>
                            <span className={styles.planTag}>{t.subscription?.plan.label || "Starter"}</span>
                          </td>

                          <td style={{ fontSize: "0.8125rem", color: "#64748B" }}>
                            {t.city || "Colombia"}
                          </td>

                          <td style={{ fontSize: "0.8125rem", fontVariantNumeric: "tabular-nums" }}>
                            <strong>{t.counts.tables}</strong> mesas • <strong>{bm?.totalMenuItems || 0}</strong> platos
                          </td>

                          <td style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>
                            {bm ? formatCurrencyCOP(bm.totalSalesCop) : formatCurrencyCOP(0)}
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <Button
                              size="sm"
                              variant="primary"
                              icon={<Eye size={13} />}
                              onClick={() => onOpenDetail(t)}
                            >
                              Ver Ficha
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* SECTION 2: ACCOUNTS DIRECTORY */}
      {activeTab === "accounts" && (
        <AccountsTable accounts={accounts} tenants={tenantOptions} />
      )}
    </div>
  );
}
