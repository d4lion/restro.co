"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  CalendarPlus,
  Calendar,
  Shield,
  ArrowUpRight,
  History,
  ExternalLink,
  ChevronDown,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Users,
  Store,
  Layers,
  Eye,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SubscriptionMetricsBar } from "./SubscriptionMetricsBar";
import { SubscriptionTimeBadge } from "./SubscriptionTimeBadge";
import { AttentionQueue } from "../common/AttentionQueue";
import { ExtendSubscriptionModal } from "./ExtendSubscriptionModal";
import { EditDatesModal } from "./EditDatesModal";
import { TenantPermissionsModal } from "./TenantPermissionsModal";
import { ChangePlanModal } from "./ChangePlanModal";
import { AuditHistoryModal } from "./AuditHistoryModal";
import {
  calculateSubscriptionTime,
  formatDateShort,
  formatCurrencyCOP,
} from "@/lib/subscription-utils";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";
import type { PlanKey } from "@/lib/types";
import styles from "./SubscriptionsDashboardClient.module.css";

interface Props {
  tenants: TenantAdminSummary[];
  onOpenDetail?: (tenant: TenantAdminSummary) => void;
}

export function SubscriptionsDashboardClient({ tenants, onOpenDetail }: Props) {
  const router = useRouter();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"EXPIRATION" | "CREATED" | "NAME">("EXPIRATION");

  // Active Modals state
  const [selectedTenant, setSelectedTenant] = useState<TenantAdminSummary | null>(null);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isDatesOpen, setIsDatesOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  // Filtered & Sorted Tenants
  const filteredTenants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = new Date();

    return tenants
      .filter((t) => {
        // Search query
        if (q) {
          const matchName = t.name.toLowerCase().includes(q);
          const matchSlug = t.slug.toLowerCase().includes(q);
          const matchEmail = t.ownerUser?.email.toLowerCase().includes(q);
          if (!matchName && !matchSlug && !matchEmail) return false;
        }

        // Plan filter
        if (planFilter !== "ALL" && t.subscription?.plan.key !== planFilter) {
          return false;
        }

        // Status filter
        if (statusFilter !== "ALL") {
          if (!t.subscription) return false;
          const calc = calculateSubscriptionTime({
            currentPeriodStart: t.subscription.currentPeriodStart,
            currentPeriodEnd: t.subscription.currentPeriodEnd,
            trialEndsAt: t.subscription.trialEndsAt,
            status: t.subscription.status,
            planKey: t.subscription.plan.key,
            referenceDate: now,
          });

          if (statusFilter === "ACTIVE") {
            return calc.urgencyStatus === "ACTIVE" || calc.urgencyStatus === "UNLIMITED";
          }
          if (statusFilter === "GRACE_PERIOD") {
            return calc.urgencyStatus === "GRACE_PERIOD";
          }
          if (statusFilter === "EXPIRING_SOON") {
            return calc.urgencyStatus === "EXPIRING_SOON" || calc.urgencyStatus === "GRACE_PERIOD";
          }
          if (statusFilter === "EXPIRED") {
            return calc.urgencyStatus === "EXPIRED" || calc.urgencyStatus === "CANCELLED";
          }
          if (statusFilter === "TRIAL") {
            return calc.urgencyStatus === "TRIAL";
          }
          if (statusFilter === "NOT_CONFIGURED") {
            return calc.urgencyStatus === "NOT_CONFIGURED";
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "NAME") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "CREATED") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }

        // Default: Sort by Expiration (closest expiration first)
        const aEnd = a.subscription?.currentPeriodEnd
          ? new Date(a.subscription.currentPeriodEnd).getTime()
          : Infinity;
        const bEnd = b.subscription?.currentPeriodEnd
          ? new Date(b.subscription.currentPeriodEnd).getTime()
          : Infinity;

        return aEnd - bEnd;
      });
  }, [tenants, searchQuery, statusFilter, planFilter, sortBy]);

  return (
    <div className={styles.wrapper}>
      {/* Header section */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel de Gestión de Suscripciones & Tenants</h1>
          <p className={styles.subtitle}>
            Control central de vigencias, extensiones manuales, permisos y auditoría de restaurantes.
          </p>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <SubscriptionMetricsBar
        tenants={tenants}
        onSelectFilter={(filter) => setStatusFilter(filter)}
        activeFilter={statusFilter}
      />

      {/* Actionable Attention Queue */}
      <AttentionQueue
        tenants={tenants}
        onExtend={(t) => {
          setSelectedTenant(t);
          setIsExtendOpen(true);
        }}
        onEditDates={(t) => {
          setSelectedTenant(t);
          setIsDatesOpen(true);
        }}
        onOpenDetail={onOpenDetail}
      />

      {/* Search & Filters Controls */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por restaurante, slug o email del dueño..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filtersGroup}>
          {/* Plan Filter */}
          <select
            className={styles.selectFilter}
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="ALL">Todos los Planes</option>
            <option value="STARTER">Starter (Gratis)</option>
            <option value="CARTA_DIGITAL">Carta Digital ($9.900)</option>
            <option value="RESTRO_IA">Restro IA ($49.900)</option>
            <option value="BUSINESS">Business ($99.900)</option>
          </select>

          {/* Sort Selector */}
          <select
            className={styles.selectFilter}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="EXPIRATION">Ordenar: Vencimiento próximo</option>
            <option value="CREATED">Ordenar: Creados recientemente</option>
            <option value="NAME">Ordenar: Nombre (A-Z)</option>
          </select>

          {(searchQuery || statusFilter !== "ALL" || planFilter !== "ALL") && (
            <Button
              size="sm"
              variant="outline"
              icon={<RotateCcw size={13} />}
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setPlanFilter("ALL");
              }}
            >
              Limpiar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className={styles.statusTabs}>
        {[
          { id: "ALL", label: `Todos (${tenants.length})`, icon: null },
          { id: "GRACE_PERIOD", label: "En Gracia (7 días)", icon: <Clock size={13} /> },
          { id: "EXPIRING_SOON", label: "Por Vencer (≤ 7 días)", icon: <AlertTriangle size={13} /> },
          { id: "ACTIVE", label: "Activas", icon: <CheckCircle2 size={13} /> },
          { id: "EXPIRED", label: "Vencidas / Bloqueadas", icon: <Clock size={13} /> },
          { id: "TRIAL", label: "En Prueba", icon: <Sparkles size={13} /> },
          { id: "NOT_CONFIGURED", label: "Sin Fechas", icon: <Layers size={13} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tabPill} ${statusFilter === tab.id ? styles["tabPill--active"] : ""}`}
            onClick={() => setStatusFilter(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Results Table / Cards */}
      {filteredTenants.length === 0 ? (
        <div className={styles.emptyState}>
          <Store size={40} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No se encontraron restaurantes</p>
          <span className={styles.emptySub}>
            Prueba ajustando los filtros de búsqueda o restablece el estado.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
              setPlanFilter("ALL");
            }}
          >
            Restablecer Filtros
          </Button>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Restaurante</th>
                  <th>Plan Actual</th>
                  <th>Tiempo Restante</th>
                  <th>Periodo Vigente</th>
                  <th>Permisos / Overrides</th>
                  <th style={{ textAlign: "right" }}>Acciones de Gestión</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((t) => {
                  const sub = t.subscription;
                  const plan = sub?.plan;

                  return (
                    <tr key={t.id} className={!t.isActive ? styles["row--inactive"] : ""}>
                      {/* Restaurant Info */}
                      <td>
                        <div className={styles.restaurantCell}>
                          <div className={styles.restaurantNameRow}>
                            <span className={styles.restaurantName}>{t.name}</span>
                            {!t.isActive && (
                              <span className={styles.suspendedTag}>SUSPENDIDO</span>
                            )}
                          </div>
                          <div className={styles.restaurantSubRow}>
                            <Link
                              href={`/restaurant/${t.slug}`}
                              target="_blank"
                              className={styles.slugLink}
                            >
                              /{t.slug} <ExternalLink size={11} />
                            </Link>
                            {t.ownerUser?.email && (
                              <span className={styles.ownerEmail}>• {t.ownerUser.email}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan Badge */}
                      <td>
                        {plan ? (
                          <div className={styles.planCell}>
                            <span className={`${styles.planBadge} ${styles[`plan--${plan.key}`]}`}>
                              {plan.label}
                            </span>
                            <span className={styles.planPriceText}>
                              {plan.priceMonthly === 0 ? "Gratis" : `${formatCurrencyCOP(plan.priceMonthly)}/m`}
                            </span>
                          </div>
                        ) : (
                          <span className={styles.noSubText}>Sin suscripción</span>
                        )}
                      </td>

                      {/* Time Remaining Calculator Widget */}
                      <td>
                        {sub ? (
                          <SubscriptionTimeBadge
                            start={sub.currentPeriodStart}
                            end={sub.currentPeriodEnd}
                            trialEndsAt={sub.trialEndsAt}
                            status={sub.status}
                            planKey={sub.plan.key}
                          />
                        ) : (
                          <span className={styles.noSubText}>—</span>
                        )}
                      </td>

                      {/* Current Period Dates */}
                      <td>
                        <div className={styles.datesCell}>
                          <div className={styles.dateRow}>
                            <span className={styles.dateLabel}>Inicio:</span>
                            <span className={styles.dateValue}>
                              {formatDateShort(sub?.currentPeriodStart) || "Sin fecha"}
                            </span>
                          </div>
                          <div className={styles.dateRow}>
                            <span className={styles.dateLabel}>Fin:</span>
                            <span className={`${styles.dateValue} ${styles["dateValue--end"]}`}>
                              {formatDateShort(sub?.currentPeriodEnd) ||
                                (plan?.key === "STARTER" ? "Ilimitado" : "Sin configurar")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Overrides Badge */}
                      <td>
                        <div className={styles.overridesCell}>
                          {t.featureOverrides.length > 0 ? (
                            <span
                              className={styles.overrideCountBadge}
                              title={t.featureOverrides.map((o) => `${o.feature}: ${o.value}`).join(", ")}
                            >
                              <Shield size={12} /> {t.featureOverrides.length} Especiales
                            </span>
                          ) : (
                            <span className={styles.defaultPlanBadge}>Límites de plan</span>
                          )}
                          <span className={styles.usageText}>
                            {t.counts.tables} mesas • {t.counts.orders} pedidos
                          </span>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ textAlign: "right" }}>
                        <div className={styles.actionsCell}>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={<CalendarPlus size={14} />}
                            onClick={() => {
                              setSelectedTenant(t);
                              setIsExtendOpen(true);
                            }}
                          >
                            Extender
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Calendar size={14} />}
                            title="Ingresar / Modificar Fechas"
                            onClick={() => {
                              setSelectedTenant(t);
                              setIsDatesOpen(true);
                            }}
                          >
                            Fechas
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Shield size={14} />}
                            title="Dar Permisos & Overrides"
                            onClick={() => {
                              setSelectedTenant(t);
                              setIsPermissionsOpen(true);
                            }}
                          >
                            Permisos
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<ArrowUpRight size={14} />}
                            title="Cambiar de Plan"
                            onClick={() => {
                              setSelectedTenant(t);
                              setIsChangePlanOpen(true);
                            }}
                          >
                            Plan
                          </Button>

                          {onOpenDetail && (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<Eye size={13} />}
                              title="Ver Ficha Integral"
                              onClick={() => onOpenDetail(t)}
                            >
                              Ficha
                            </Button>
                          )}

                          <button
                            type="button"
                            className={styles.historyBtn}
                            title="Ver Historial & Auditoría"
                            onClick={() => {
                              setSelectedTenant(t);
                              setIsHistoryOpen(true);
                            }}
                          >
                            <History size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ExtendSubscriptionModal
        tenant={selectedTenant}
        isOpen={isExtendOpen}
        onClose={() => setIsExtendOpen(false)}
        onSuccess={handleRefresh}
      />

      <EditDatesModal
        tenant={selectedTenant}
        isOpen={isDatesOpen}
        onClose={() => setIsDatesOpen(false)}
        onSuccess={handleRefresh}
      />

      <TenantPermissionsModal
        tenant={selectedTenant}
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
        onSuccess={handleRefresh}
      />

      <ChangePlanModal
        tenant={selectedTenant}
        isOpen={isChangePlanOpen}
        onClose={() => setIsChangePlanOpen(false)}
        onSuccess={handleRefresh}
      />

      <AuditHistoryModal
        tenant={selectedTenant}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
