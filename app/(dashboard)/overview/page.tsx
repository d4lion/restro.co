import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { orderRepository } from "@/lib/repositories/order.repository";
import { tableRepository } from "@/lib/repositories/table.repository";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { PLAN_LIMITS, ORDER_STATUSES } from "@/lib/types";
import type { PlanKey } from "@/lib/types";
import styles from "./page.module.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Resumen" };

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ color: color ?? "var(--brand-blue)" }}>
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

  const activeTables = tables.filter((t) => t.activeOrderCount > 0);
  const totalToday = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingCount = activeOrders.filter((o) => o.status === "PENDING").length;
  const preparingCount = activeOrders.filter((o) => o.status === "PREPARING").length;

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Resumen Operativo</h1>
          <p className={styles.subtitle}>
            {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <a href={`/${tenant.slug}`} target="_blank" className={styles.viewMenuBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Ver carta pública
        </a>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Pedidos activos"
          value={activeOrders.length}
          sub={`${pendingCount} nuevos · ${preparingCount} en cocina`}
          color="var(--brand-blue)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
        <StatCard
          label="Mesas en servicio"
          value={`${activeTables.length} / ${tables.length}`}
          sub={`${tables.length - activeTables.length} desocupadas`}
          color="var(--color-success)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          }
        />
        <StatCard
          label="Ventas acumuladas hoy"
          value={formatCOP(totalToday)}
          sub="Pedidos en curso"
          color="var(--brand-orange)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Suscripción SaaS"
          value={PLAN_LIMITS[plan].label}
          sub={`${limits.maxTables === Infinity ? "Ilimitadas" : limits.maxTables} mesas · ${limits.hasAI ? "Analítica IA activa" : "Sin IA"}`}
          color={plan === "RESTRO_IA" ? "var(--brand-blue)" : plan === "BUSINESS" ? "var(--brand-adamind)" : "var(--text-muted)"}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        />
      </div>

      {/* Active Orders Section */}
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
                      style={{ color: statusConfig.color, borderColor: `${statusConfig.color}40`, background: `${statusConfig.color}15` }}
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

      {/* Tables Grid Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Estado de Mesas</h2>
          <Link href="/tables" className={styles.sectionLink}>Ver todas →</Link>
        </div>
        <div className={styles.tablesGrid}>
          {tables.slice(0, 12).map((table) => {
            const status = !table.isActive ? "DISABLED" : table.activeOrderCount > 0 ? "ACTIVE" : "FREE";
            const dotColor = status === "FREE" ? "#10B981" : status === "ACTIVE" ? "#F59E0B" : "#64748B";
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
