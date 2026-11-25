"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Clock,
  Store,
  BarChart3,
  LifeBuoy,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { CommandCenterOverview } from "./overview/CommandCenterOverview";
import { SubscriptionsDashboardClient } from "./subscriptions/SubscriptionsDashboardClient";
import { ClientsCRM } from "./clients/ClientsCRM";
import { TicketsManager } from "./tickets/TicketsManager";
import { MarketResearchBI } from "./market-research/MarketResearchBI";
import { RestaurantDetailDrawer } from "./clients/RestaurantDetailDrawer";
import { ExtendSubscriptionModal } from "./subscriptions/ExtendSubscriptionModal";
import { EditDatesModal } from "./subscriptions/EditDatesModal";
import { TenantPermissionsModal } from "./subscriptions/TenantPermissionsModal";
import { ChangePlanModal } from "./subscriptions/ChangePlanModal";
import { AuditHistoryModal } from "./subscriptions/AuditHistoryModal";
import { LinearProgress } from "@/components/ui/LinearProgress";
import { calculateSubscriptionTime } from "@/lib/subscription-utils";
import { logoutAction } from "@/app/actions/settings";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";
import type {
  PlatformGlobalMetrics as GlobalMetricsType,
  UserAccountSummary,
} from "@/lib/repositories/platform-admin.repository";
import type { PlatformMarketReport } from "@/lib/repositories/market-research.repository";
import styles from "./MasterControlHub.module.css";

interface Props {
  tenants: TenantAdminSummary[];
  accounts: UserAccountSummary[];
  metrics: GlobalMetricsType;
  marketReport: PlatformMarketReport;
  adminEmail?: string;
}

export function MasterControlHub({
  tenants,
  accounts,
  metrics,
  marketReport,
  adminEmail = "admin@restro.internal",
}: Props) {
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<
    "overview" | "subscriptions" | "clients" | "tickets" | "bi"
  >("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Modals & Drawer State
  const [selectedTenantForDrawer, setSelectedTenantForDrawer] = useState<TenantAdminSummary | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [selectedTenantForModal, setSelectedTenantForModal] = useState<TenantAdminSummary | null>(null);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isDatesOpen, setIsDatesOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleSwitch = (sec: typeof activeSection) => {
    setMobileMenuOpen(false);
    startTransition(() => {
      setActiveSection(sec);
    });
  };

  // Open Drawer handler
  const handleOpenDetail = (tenant: TenantAdminSummary) => {
    setSelectedTenantForDrawer(tenant);
    setIsDrawerOpen(true);
  };

  const handleOpenDetailById = (tenantId: string) => {
    const found = tenants.find((t) => t.id === tenantId);
    if (found) {
      setSelectedTenantForDrawer(found);
      setIsDrawerOpen(true);
    }
  };

  // Matching benchmark data for drawer
  const benchmarkForDrawer = useMemo(() => {
    if (!selectedTenantForDrawer) return null;
    return (
      marketReport.tenants.find((b) => b.tenantId === selectedTenantForDrawer.id) || null
    );
  }, [selectedTenantForDrawer, marketReport.tenants]);

  // Urgent attention count (subscriptions)
  const attentionCount = useMemo(() => {
    const now = new Date();
    return tenants.filter((t) => {
      if (!t.subscription) return false;
      const calc = calculateSubscriptionTime({
        currentPeriodStart: t.subscription.currentPeriodStart,
        currentPeriodEnd: t.subscription.currentPeriodEnd,
        trialEndsAt: t.subscription.trialEndsAt,
        status: t.subscription.status,
        planKey: t.subscription.plan.key,
        referenceDate: now,
      });
      return (
        calc.urgencyStatus === "EXPIRING_SOON" ||
        calc.urgencyStatus === "GRACE_PERIOD" ||
        calc.urgencyStatus === "EXPIRED" ||
        calc.urgencyStatus === "CANCELLED"
      );
    }).length;
  }, [tenants]);

  // Open tickets count
  const { openTicketsCount, totalTicketsCount } = useMemo(() => {
    let openCount = 0;
    let totalCount = 0;
    tenants.forEach((t) => {
      t.supportTickets?.forEach((st) => {
        totalCount++;
        if (st.status === "OPEN" || st.status === "IN_PROGRESS") {
          openCount++;
        }
      });
    });
    return { openTicketsCount: openCount, totalTicketsCount: totalCount };
  }, [tenants]);

  return (
    <div className={styles.hubContainer}>
      {isPending && <LinearProgress size="sm" className={styles.hubProgressBar} />}

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Modern Left Sidebar */}
      <aside
        className={`${styles.sidebar} ${
          mobileMenuOpen ? styles["sidebar--mobileOpen"] : ""
        }`}
      >
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brandIcon}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.brandDetails}>
            <div className={styles.brandTitleRow}>
              <span className={styles.brandTitle}>Restro Core</span>
              <span className={styles.routeTag}>/a/g/s</span>
            </div>
            <span className={styles.adminBadge}>SUPERADMIN</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className={styles.sidebarNav}>
          <div className={styles.navSectionLabel}>Módulos de Control</div>

          {/* 1. Centro de Control */}
          <button
            type="button"
            className={`${styles.navItem} ${
              activeSection === "overview" ? styles["navItem--active"] : ""
            }`}
            onClick={() => handleSwitch("overview")}
          >
            <div className={styles.navItemInner}>
              <LayoutDashboard size={18} />
              <span className={styles.navItemText}>Centro de Control</span>
            </div>
          </button>

          {/* 2. Suscripciones y Vigencias */}
          <button
            type="button"
            className={`${styles.navItem} ${
              activeSection === "subscriptions" ? styles["navItem--active"] : ""
            }`}
            onClick={() => handleSwitch("subscriptions")}
          >
            <div className={styles.navItemInner}>
              <Clock size={18} />
              <span className={styles.navItemText}>Suscripciones & Vigencias</span>
            </div>
            {attentionCount > 0 ? (
              <span
                className={`${styles.counterBadge} ${styles["counterBadge--alert"]}`}
                title={`${attentionCount} requieren atención`}
              >
                {attentionCount}
              </span>
            ) : (
              <span className={styles.counterBadge}>{tenants.length}</span>
            )}
          </button>

          {/* 3. Clientes y Cuentas */}
          <button
            type="button"
            className={`${styles.navItem} ${
              activeSection === "clients" ? styles["navItem--active"] : ""
            }`}
            onClick={() => handleSwitch("clients")}
          >
            <div className={styles.navItemInner}>
              <Store size={18} />
              <span className={styles.navItemText}>Clientes & Cuentas</span>
            </div>
            <span className={styles.counterBadge}>{tenants.length}</span>
          </button>

          {/* 4. Gestor de Tickets & Novedades */}
          <button
            type="button"
            className={`${styles.navItem} ${
              activeSection === "tickets" ? styles["navItem--active"] : ""
            }`}
            onClick={() => handleSwitch("tickets")}
          >
            <div className={styles.navItemInner}>
              <LifeBuoy size={18} />
              <span className={styles.navItemText}>Gestor de Tickets</span>
            </div>
            {openTicketsCount > 0 ? (
              <span
                className={`${styles.counterBadge} ${styles["counterBadge--warning"]}`}
                title={`${openTicketsCount} tickets abiertos o en atención`}
              >
                {openTicketsCount}
              </span>
            ) : (
              <span className={styles.counterBadge}>{totalTicketsCount}</span>
            )}
          </button>

          {/* 5. Analítica & Benchmarking (BI) */}
          <button
            type="button"
            className={`${styles.navItem} ${
              activeSection === "bi" ? styles["navItem--active"] : ""
            }`}
            onClick={() => handleSwitch("bi")}
          >
            <div className={styles.navItemInner}>
              <BarChart3 size={18} />
              <span className={styles.navItemText}>Analítica & BI</span>
            </div>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          {/* User info */}
          <div className={styles.userInfoCard}>
            <div className={styles.userAvatar}>
              <ShieldCheck size={16} />
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userEmail} title={adminEmail}>
                {adminEmail}
              </span>
              <span className={styles.userRole}>Super Administrador</span>
            </div>
          </div>

          {/* Footer Actions: Visitar Restaurante & Cerrar Sesión */}
          <div className={styles.footerActions}>
            <Link href="/overview" className={styles.restaurantLink}>
              <Store size={15} />
              <span>Visitar Restaurante</span>
            </Link>

            <form action={logoutAction} className={styles.logoutForm}>
              <button type="submit" className={styles.logoutBtn}>
                <LogOut size={15} />
                <span>Cerrar Sesión</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainArea}>
        {/* Mobile Header Bar */}
        <div className={styles.mobileHeader}>
          <div className={styles.mobileBrand}>
            <ShieldCheck size={18} color="#2563EB" />
            <span>Restro Core</span>
            <span className={styles.routeTag}>/a/g/s</span>
          </div>
          <button
            type="button"
            className={styles.mobileToggleBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Dynamic Section Content */}
        <div className={styles.mainContentWrapper}>
          {activeSection === "overview" && (
            <CommandCenterOverview
              tenants={tenants}
              metrics={metrics}
              onNavigate={(sec) => handleSwitch(sec)}
              onExtend={(t) => {
                setSelectedTenantForModal(t);
                setIsExtendOpen(true);
              }}
              onEditDates={(t) => {
                setSelectedTenantForModal(t);
                setIsDatesOpen(true);
              }}
              onOpenDetail={handleOpenDetail}
            />
          )}

          {activeSection === "subscriptions" && (
            <SubscriptionsDashboardClient
              tenants={tenants}
              onOpenDetail={handleOpenDetail}
            />
          )}

          {activeSection === "clients" && (
            <ClientsCRM
              tenants={tenants}
              accounts={accounts}
              marketReport={marketReport}
              onOpenDetail={handleOpenDetail}
              onExtend={(t) => {
                setSelectedTenantForModal(t);
                setIsExtendOpen(true);
              }}
              onEditDates={(t) => {
                setSelectedTenantForModal(t);
                setIsDatesOpen(true);
              }}
            />
          )}

          {activeSection === "tickets" && (
            <TicketsManager
              tenants={tenants}
              onOpenDetail={handleOpenDetail}
            />
          )}

          {activeSection === "bi" && (
            <MarketResearchBI
              report={marketReport}
              onOpenDetail={handleOpenDetailById}
            />
          )}
        </div>
      </main>

      {/* Ficha Integral del Restaurante (Drawer) */}
      <RestaurantDetailDrawer
        tenant={selectedTenantForDrawer}
        benchmark={benchmarkForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onExtend={(t) => {
          setSelectedTenantForModal(t);
          setIsExtendOpen(true);
        }}
        onEditDates={(t) => {
          setSelectedTenantForModal(t);
          setIsDatesOpen(true);
        }}
        onPermissions={(t) => {
          setSelectedTenantForModal(t);
          setIsPermissionsOpen(true);
        }}
        onChangePlan={(t) => {
          setSelectedTenantForModal(t);
          setIsChangePlanOpen(true);
        }}
        onViewHistory={(t) => {
          setSelectedTenantForModal(t);
          setIsHistoryOpen(true);
        }}
      />

      {/* Shared Action Modals */}
      <ExtendSubscriptionModal
        tenant={selectedTenantForModal}
        isOpen={isExtendOpen}
        onClose={() => setIsExtendOpen(false)}
        onSuccess={handleRefresh}
      />

      <EditDatesModal
        tenant={selectedTenantForModal}
        isOpen={isDatesOpen}
        onClose={() => setIsDatesOpen(false)}
        onSuccess={handleRefresh}
      />

      <TenantPermissionsModal
        tenant={selectedTenantForModal}
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
        onSuccess={handleRefresh}
      />

      <ChangePlanModal
        tenant={selectedTenantForModal}
        isOpen={isChangePlanOpen}
        onClose={() => setIsChangePlanOpen(false)}
        onSuccess={handleRefresh}
      />

      <AuditHistoryModal
        tenant={selectedTenantForModal}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
