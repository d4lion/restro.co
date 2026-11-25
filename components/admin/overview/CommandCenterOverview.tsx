"use client";

import React, { useMemo } from "react";
import {
  LayoutDashboard,
  Clock,
  Store,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  History,
  ShieldCheck,
  LifeBuoy,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AttentionQueue } from "../common/AttentionQueue";
import { formatCurrencyCOP, formatDateShort, formatDateTime } from "@/lib/subscription-utils";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";
import type { PlatformGlobalMetrics } from "@/lib/repositories/platform-admin.repository";
import styles from "./CommandCenterOverview.module.css";

interface Props {
  tenants: TenantAdminSummary[];
  metrics: PlatformGlobalMetrics;
  onNavigate: (section: "subscriptions" | "clients" | "tickets" | "bi") => void;
  onExtend: (tenant: TenantAdminSummary) => void;
  onEditDates: (tenant: TenantAdminSummary) => void;
  onOpenDetail: (tenant: TenantAdminSummary) => void;
}

export function CommandCenterOverview({
  tenants,
  metrics,
  onNavigate,
  onExtend,
  onEditDates,
  onOpenDetail,
}: Props) {
  // Aggregate recent billing and audit events from tenants
  const recentEvents = useMemo(() => {
    const list: Array<{
      id: string;
      tenantName: string;
      tenant: TenantAdminSummary;
      type: string;
      createdAt: Date;
      note: string | null;
    }> = [];

    tenants.forEach((t) => {
      t.subscription?.billingEvents?.forEach((ev) => {
        list.push({
          id: ev.id,
          tenantName: t.name,
          tenant: t,
          type: ev.type,
          createdAt: new Date(ev.createdAt),
          note: ev.note,
        });
      });
    });

    return list
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
  }, [tenants]);

  // Aggregate support tickets across tenants
  const allTickets = useMemo(() => {
    const list: Array<{
      id: string;
      tenantName: string;
      tenant: TenantAdminSummary;
      title: string;
      description: string;
      status: string;
      priority: string;
      category: string;
      createdAt: Date;
    }> = [];

    tenants.forEach((t) => {
      t.supportTickets?.forEach((st) => {
        list.push({
          id: st.id,
          tenantName: t.name,
          tenant: t,
          title: st.title,
          description: st.description,
          status: st.status,
          priority: st.priority,
          category: st.category,
          createdAt: new Date(st.createdAt),
        });
      });
    });

    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [tenants]);

  const openTickets = useMemo(
    () => allTickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS"),
    [allTickets]
  );

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Centro de Control de Operaciones SaaS</h2>
          <p className={styles.subtitle}>
            Estado general de los restaurantes, vigencias prioritarias y actividad en tiempo real.
          </p>
        </div>

        <div className={styles.shortcutsRow}>
          <Button
            size="sm"
            variant="outline"
            icon={<Clock size={14} />}
            onClick={() => onNavigate("subscriptions")}
          >
            Suscripciones
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<Store size={14} />}
            onClick={() => onNavigate("clients")}
          >
            Directorio Clientes
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<TrendingUp size={14} />}
            onClick={() => onNavigate("bi")}
          >
            Benchmarking BI
          </Button>
        </div>
      </div>

      {/* 1. Prioritized Actionable Attention Queue */}
      <AttentionQueue
        tenants={tenants}
        onExtend={onExtend}
        onEditDates={onEditDates}
        onOpenDetail={onOpenDetail}
        title="Cola de Atención Prioritaria (Acciones Requeridas)"
        maxInitial={4}
      />

      {/* 2. Operational Health & MRR KPI Cards */}
      <div className={styles.healthGrid}>
        {/* Active Restaurants */}
        <div
          className={`${styles.healthCard} ${styles["healthCard--clickable"]}`}
          onClick={() => onNavigate("clients")}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Ecosistema de Restaurantes</span>
            <div className={styles.iconCircle} style={{ background: "#DCFCE7", color: "#15803D" }}>
              <Store size={15} />
            </div>
          </div>
          <span className={styles.cardValue}>
            {metrics.activeTenants} / {metrics.totalTenants}
          </span>
          <span className={styles.cardSub}>
            {metrics.activeTenants} operando activamente ({metrics.suspendedTenants} suspendidos)
          </span>
        </div>

        {/* Normalized MRR */}
        <div
          className={`${styles.healthCard} ${styles["healthCard--clickable"]}`}
          onClick={() => onNavigate("subscriptions")}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>MRR Recurrente Estimado</span>
            <div className={styles.iconCircle} style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
              <DollarSign size={15} />
            </div>
          </div>
          <span className={styles.cardValue} style={{ color: "#2563EB" }}>
            {formatCurrencyCOP(metrics.mrrTotalCop)}
          </span>
          <span className={styles.cardSub}>
            De {metrics.totalSubscriptions} suscripciones activas en planes de pago
          </span>
        </div>

        {/* Total Orders Volume */}
        <div
          className={`${styles.healthCard} ${styles["healthCard--clickable"]}`}
          onClick={() => onNavigate("bi")}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Comandas Procesadas</span>
            <div className={styles.iconCircle} style={{ background: "#FEF3C7", color: "#B45309" }}>
              <ShoppingBag size={15} />
            </div>
          </div>
          <span className={styles.cardValue}>{metrics.totalOrders.toLocaleString()}</span>
          <span className={styles.cardSub}>
            {metrics.ordersToday} hoy • {metrics.ordersThisMonth} este mes
          </span>
        </div>

        {/* Platform GMV */}
        <div
          className={`${styles.healthCard} ${styles["healthCard--clickable"]}`}
          onClick={() => onNavigate("bi")}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Facturación Total (GMV)</span>
            <div className={styles.iconCircle} style={{ background: "#F1F5F9", color: "#0F172A" }}>
              <TrendingUp size={15} />
            </div>
          </div>
          <span className={styles.cardValue}>{formatCurrencyCOP(metrics.totalGmvCop)}</span>
          <span className={styles.cardSub}>
            Ticket promedio: {formatCurrencyCOP(metrics.averageTicketCop)}
          </span>
        </div>
      </div>

      {/* 3. Secondary Split: Plan Breakdown & Recent Activity */}
      <div className={styles.splitGrid}>
        {/* Distribution of SaaS Plans */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>
              <ShieldCheck size={16} /> Distribución de Planes SaaS
            </span>
            <Button size="sm" variant="ghost" onClick={() => onNavigate("subscriptions")}>
              Ver vigencias <ArrowRight size={12} />
            </Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.8125rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Starter (Gratuito):</span>
              <strong>{metrics.planDistribution?.STARTER ?? 0} restaurantes</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Carta Digital ($9.900/m):</span>
              <strong>{metrics.planDistribution?.CARTA_DIGITAL ?? 0} restaurantes</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Restro IA ($49.900/m):</span>
              <strong>{metrics.planDistribution?.RESTRO_IA ?? 0} restaurantes</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Business ($99.900/m):</span>
              <strong>{metrics.planDistribution?.BUSINESS ?? 0} restaurantes</strong>
            </div>
          </div>
        </div>

        {/* Recent Audit / Billing Activity */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>
              <History size={16} /> Movimientos Recientes de Suscripciones
            </span>
          </div>

          {recentEvents.length === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
              No se han registrado movimientos recientes en las suscripciones.
            </p>
          ) : (
            <div className={styles.recentList}>
              {recentEvents.map((ev) => (
                <div key={ev.id} className={styles.recentItem}>
                  <div>
                    <strong>{ev.tenantName}</strong>: {ev.note || ev.type}
                  </div>
                  <span className={styles.recentDate}>{formatDateShort(ev.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Tracking of Tenant Support Tickets & Novedades */}
      <div className={styles.panelCard}>
        <div className={styles.panelHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className={styles.panelTitle}>
              <LifeBuoy size={16} /> Seguimiento de Novedades & Tickets de Soporte
            </span>
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "9999px",
                backgroundColor: openTickets.length > 0 ? "#FEE2E2" : "#DCFCE7",
                color: openTickets.length > 0 ? "#DC2626" : "#15803D",
                border: openTickets.length > 0 ? "1px solid #FCA5A5" : "1px solid #86EFAC",
              }}
            >
              {openTickets.length} {openTickets.length === 1 ? "novedad activa" : "novedades activas"}
            </span>
          </div>

          <Button size="sm" variant="outline" onClick={() => onNavigate("tickets")}>
            Gestor de Tickets <ArrowRight size={12} />
          </Button>
        </div>

        {openTickets.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#15803D", fontSize: "0.8125rem", padding: "8px 0" }}>
            <CheckCircle2 size={16} />
            <span>Todos los restaurantes al día — No hay incidencias ni solicitudes pendientes.</span>
          </div>
        ) : (
          <div className={styles.recentList}>
            {openTickets.slice(0, 6).map((ticket) => (
              <div
                key={ticket.id}
                className={styles.recentItem}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong>{ticket.tenantName}</strong>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: "4px",
                        backgroundColor: "#F1F5F9",
                        color: "#475569",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      {ticket.category}
                    </span>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "4px",
                        backgroundColor:
                          ticket.priority === "URGENT"
                            ? "#FEE2E2"
                            : ticket.priority === "HIGH"
                            ? "#FEF3C7"
                            : "#EFF6FF",
                        color:
                          ticket.priority === "URGENT"
                            ? "#DC2626"
                            : ticket.priority === "HIGH"
                            ? "#D97706"
                            : "#2563EB",
                      }}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.8125rem", color: "#334155" }}>
                    {ticket.title} — {ticket.description.slice(0, 80)}
                    {ticket.description.length > 80 ? "..." : ""}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className={styles.recentDate}>{formatDateShort(ticket.createdAt)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Eye size={12} />}
                    onClick={() => onOpenDetail(ticket.tenant)}
                  >
                    Ficha
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
