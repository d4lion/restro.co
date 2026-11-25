"use client";

import React from "react";
import type { PlatformGlobalMetrics } from "@/lib/repositories/platform-admin.repository";
import { formatCurrencyCOP } from "@/lib/subscription-utils";
import styles from "./GlobalPlatformMetrics.module.css";
import {
  TrendingUp,
  ShoppingBag,
  Store,
  Users,
  UtensilsCrossed,
  DollarSign,
  Layers,
  Sparkles,
  PieChart,
} from "lucide-react";

interface Props {
  metrics: PlatformGlobalMetrics;
}

export function GlobalPlatformMetrics({ metrics }: Props) {
  return (
    <div className={styles.wrapper}>
      {/* Primary KPI Row */}
      <div className={styles.kpiRow}>
        {/* GMV */}
        <div className={`${styles.kpiCard} ${styles["kpiCard--gmv"]}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Ventas Totales Plataforma (GMV)</span>
            <div className={`${styles.iconCircle} ${styles["icon--green"]}`}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.largeValue}>{formatCurrencyCOP(metrics.totalGmvCop)}</span>
            <span className={styles.subText}>Facturado en comandas procesadas</span>
          </div>
        </div>

        {/* MRR SaaS */}
        <div className={`${styles.kpiCard} ${styles["kpiCard--mrr"]}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>MRR Recurrente Estimado</span>
            <div className={`${styles.iconCircle} ${styles["icon--blue"]}`}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.largeValue}>{formatCurrencyCOP(metrics.mrrTotalCop)}/mes</span>
            <span className={styles.subText}>{metrics.totalSubscriptions} suscripciones activas</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className={styles.kpiCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Volumen de Pedidos</span>
            <div className={`${styles.iconCircle} ${styles["icon--amber"]}`}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.largeValue}>{metrics.totalOrders.toLocaleString()}</span>
            <span className={styles.subText}>
              <strong>{metrics.ordersToday}</strong> hoy • <strong>{metrics.ordersThisMonth}</strong> este mes
            </span>
          </div>
        </div>

        {/* Average Ticket */}
        <div className={styles.kpiCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Ticket Promedio por Pedido</span>
            <div className={`${styles.iconCircle} ${styles["icon--purple"]}`}>
              <Sparkles size={20} />
            </div>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.largeValue}>{formatCurrencyCOP(metrics.averageTicketCop)}</span>
            <span className={styles.subText}>En pedidos no cancelados</span>
          </div>
        </div>
      </div>

      {/* Secondary Detailed Breakdown Grid */}
      <div className={styles.detailsGrid}>
        {/* Restaurants & Ecosystem Card */}
        <div className={styles.detailCard}>
          <div className={styles.detailCardHeader}>
            <div className={styles.detailHeaderTitle}>
              <Store size={18} className={styles.detailIcon} />
              <h3>Salud del Ecosistema de Restaurantes</h3>
            </div>
            <span className={styles.totalBadge}>{metrics.totalTenants} Total</span>
          </div>
          <div className={styles.statList}>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>Restaurantes Activos Operando:</span>
              <strong className={styles.statItemVal} style={{ color: "#16A34A" }}>
                {metrics.activeTenants}
              </strong>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>Restaurantes Suspendidos / Inactivos:</span>
              <strong className={styles.statItemVal} style={{ color: "#DC2626" }}>
                {metrics.suspendedTenants}
              </strong>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>Total de Platos / Productos en Cartas:</span>
              <strong className={styles.statItemVal}>{metrics.totalMenuItems.toLocaleString()}</strong>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>Mesas con Código QR Habilitadas:</span>
              <strong className={styles.statItemVal}>{metrics.totalTables.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Users & Accounts Distribution */}
        <div className={styles.detailCard}>
          <div className={styles.detailCardHeader}>
            <div className={styles.detailHeaderTitle}>
              <Users size={18} className={styles.detailIcon} />
              <h3>Distribución de Cuentas y Accesos</h3>
            </div>
            <span className={styles.totalBadge}>{metrics.totalUsers} Cuentas</span>
          </div>
          <div className={styles.statList}>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>Super Administradores (Plataforma):</span>
              <strong className={styles.statItemVal} style={{ color: "#2563EB" }}>
                {metrics.usersByRole.SUPERADMIN || 0}
              </strong>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>Propietarios (Owners de Restaurante):</span>
              <strong className={styles.statItemVal}>{metrics.usersByRole.OWNER || 0}</strong>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>Gerentes (Managers):</span>
              <strong className={styles.statItemVal}>{metrics.usersByRole.MANAGER || 0}</strong>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>Personal Operativo (Meseros & Cocina):</span>
              <strong className={styles.statItemVal}>
                {(metrics.usersByRole.WAITER || 0) + (metrics.usersByRole.KITCHEN || 0)}
              </strong>
            </div>
          </div>
        </div>

        {/* Subscription Plan Distribution */}
        <div className={styles.detailCard}>
          <div className={styles.detailCardHeader}>
            <div className={styles.detailHeaderTitle}>
              <PieChart size={18} className={styles.detailIcon} />
              <h3>Distribución de Planes SaaS</h3>
            </div>
            <span className={styles.totalBadge}>4 Planes</span>
          </div>
          <div className={styles.planBars}>
            <div className={styles.planBarRow}>
              <div className={styles.planBarHeader}>
                <span className={styles.planBarName}>Starter (Gratis)</span>
                <span className={styles.planBarCount}>{metrics.planDistribution.STARTER} tenants</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${metrics.totalTenants > 0 ? (metrics.planDistribution.STARTER / metrics.totalTenants) * 100 : 0}%`,
                    backgroundColor: "#64748B",
                  }}
                />
              </div>
            </div>

            <div className={styles.planBarRow}>
              <div className={styles.planBarHeader}>
                <span className={styles.planBarName}>Carta Digital ($9.900)</span>
                <span className={styles.planBarCount}>{metrics.planDistribution.CARTA_DIGITAL} tenants</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${metrics.totalTenants > 0 ? (metrics.planDistribution.CARTA_DIGITAL / metrics.totalTenants) * 100 : 0}%`,
                    backgroundColor: "#16A34A",
                  }}
                />
              </div>
            </div>

            <div className={styles.planBarRow}>
              <div className={styles.planBarHeader}>
                <span className={styles.planBarName}>Restro IA ($49.900)</span>
                <span className={styles.planBarCount}>{metrics.planDistribution.RESTRO_IA} tenants</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${metrics.totalTenants > 0 ? (metrics.planDistribution.RESTRO_IA / metrics.totalTenants) * 100 : 0}%`,
                    backgroundColor: "#7C3AED",
                  }}
                />
              </div>
            </div>

            <div className={styles.planBarRow}>
              <div className={styles.planBarHeader}>
                <span className={styles.planBarName}>Business ($99.900)</span>
                <span className={styles.planBarCount}>{metrics.planDistribution.BUSINESS} tenants</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${metrics.totalTenants > 0 ? (metrics.planDistribution.BUSINESS / metrics.totalTenants) * 100 : 0}%`,
                    backgroundColor: "#EA580C",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
