import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { orderRepository } from "@/lib/repositories/order.repository";
import { tableRepository } from "@/lib/repositories/table.repository";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { PLAN_LIMITS, ORDER_STATUSES } from "@/lib/types";
import type { PlanKey } from "@/lib/types";
import {
  ClipboardCheck,
  LayoutGrid,
  DollarSign,
  Star,
  ExternalLink,
} from "lucide-react";
import styles from "./page.module.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Resumen" };

const STAT_COLORS: Record<string, { bg: string; color: string }> = {
  blue:    { bg: "#EFF6FF", color: "#2563EB" },
  green:   { bg: "#ECFDF5", color: "#059669" },
  orange:  { bg: "#FFF7ED", color: "#EA580C" },
  slate:   { bg: "#F1F5F9", color: "#475569" },
};

function StatCard({
  label,
  value,
  sub,
  colorKey = "blue",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  colorKey?: keyof typeof STAT_COLORS;
  icon: React.ReactNode;
}) {
  const { bg, color } = STAT_COLORS[colorKey];
  return (
    <div className={styles.statCard}>
      <div
        className={styles.statIconBox}
        style={{ background: bg, color }}
      >
        {icon}
      </div>
      <div>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
        {sub && <p className={styles.statSub}>{sub}</p>}
      </div>
    </div>
  );
}

export default async function OverviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [tenant, activeOrders, tables] = await Promise.all([
    tenantRepository.findById(session.tenantId),
    orderRepository.findActiveByTenant(session.tenantId),
    tableRepository.getTablesWithStatus(session.tenantId),
  ]);

  if (!tenant) redirect("/login");

  const plan = tenant.plan as PlanKey;
  const limits = PLAN_LIMITS[plan];

  const activeTables   = tables.filter((t) => t.activeOrderCount > 0);
  const totalToday     = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingCount   = activeOrders.filter((o) => o.status === "PENDING").length;
  const preparingCount = activeOrders.filter((o) => o.status === "PREPARING").length;

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Resumen Operativo</h1>
          <p className={styles.subtitle}>
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <a href={`/${tenant.slug}`} target="_blank" className={styles.viewMenuBtn}>
          <ExternalLink size={14} strokeWidth={2} />
          Ver carta pública
        </a>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Pedidos activos"
          value={activeOrders.length}
          sub={`${pendingCount} nuevos · ${preparingCount} en cocina`}
          colorKey="blue"
          icon={<ClipboardCheck size={22} strokeWidth={2} />}
        />
        <StatCard
          label="Mesas en servicio"
          value={`${activeTables.length} / ${tables.length}`}
          sub={`${tables.length - activeTables.length} desocupadas`}
          colorKey="green"
          icon={<LayoutGrid size={22} strokeWidth={2} />}
        />
        <StatCard
          label="Ventas acumuladas hoy"
          value={formatCOP(totalToday)}
          sub="Pedidos en curso"
          colorKey="orange"
          icon={<DollarSign size={22} strokeWidth={2} />}
        />
        <StatCard
          label="Suscripción SaaS"
          value={PLAN_LIMITS[plan].label}
          sub={`${limits.maxTables === Infinity ? "Ilimitadas" : limits.maxTables} mesas · ${limits.hasAI ? "Analítica IA activa" : "Sin IA"}`}
          colorKey={plan === "RESTRO_IA" ? "blue" : plan === "BUSINESS" ? "orange" : "slate"}
          icon={<Star size={22} strokeWidth={2} />}
        />
      </div>

      {/* ── Active Orders ───────────────────────────────────── */}
      {activeOrders.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Comandas Recientes</h2>
          <div className={styles.ordersList}>
            {activeOrders.slice(0, 6).map((order) => {
              const statusConfig = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <span className={styles.orderNumber}>#{order.orderNumber}</span>
                    <span
                      className={styles.orderStatus}
                      style={{
                        color: statusConfig.color,
                        borderColor: `${statusConfig.color}40`,
                        background: `${statusConfig.color}18`,
                      }}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className={styles.orderType}>
                    {order.type === "DINE_IN" ? "En el local" : order.type === "TAKEOUT" ? "Para llevar" : "Domicilio"}
                    {order.customerName && ` · ${order.customerName}`}
                  </p>
                  <p className={styles.orderItems}>
                    {order.items.slice(0, 2).map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    {order.items.length > 2 && ` +${order.items.length - 2} más`}
                  </p>
                  <p className={styles.orderTotal}>{formatCOP(order.total)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Tables Grid ─────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Estado de Mesas</h2>
          <Link href="/tables" className={styles.sectionLink}>Ver todas →</Link>
        </div>
        <div className={styles.tablesGrid}>
          {tables.slice(0, 12).map((table) => {
            const status = !table.isActive
              ? "DISABLED"
              : table.activeOrderCount > 0
              ? "ACTIVE"
              : "FREE";
            const dotColor =
              status === "FREE" ? "#10B981" : status === "ACTIVE" ? "#F59E0B" : "#CBD5E1";
            return (
              <Link key={table.id} href="/tables" className={styles.tableCard}>
                <div className={styles.tableDot} style={{ background: dotColor }} />
                <p className={styles.tableName}>{table.name}</p>
                {table.activeOrderCount > 0 && (
                  <p className={styles.tableOrders}>{table.activeOrderCount} pedido(s)</p>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
