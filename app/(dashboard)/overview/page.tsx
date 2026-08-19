import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
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
  ArrowRight,
} from "lucide-react";

import styles from "./page.module.css";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = { title: "Resumen" };

const STAT_COLORS: Record<string, { bg: string; color: string }> = {
  blue:   { bg: "#EFF6FF", color: "#2563EB" },
  teal:   { bg: "#F0FDFA", color: "#0F766E" },
  orange: { bg: "#FFFBEB", color: "#D97706" },
  slate:  { bg: "#F1F5F9", color: "#475569" },
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
      <div className={styles.statIconBox} style={{ background: bg, color }}>
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

  const [tenant, activeOrders, tables, prismaUser] = await Promise.all([
    tenantRepository.findById(session.tenantId),
    orderRepository.findActiveByTenant(session.tenantId),
    tableRepository.getTablesWithStatus(session.tenantId),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    }),
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

  // Dynamic time-based greeting for closeness
  const rawName = prismaUser?.name?.trim() || tenant.name;
  const clientFirstName = rawName.split(" ")[0];

  const hour = new Date().getHours();
  let greetingSalutation = "¡Buenos días";
  let greetingEmoji = "☀️";

  if (hour >= 5 && hour < 12) {
    greetingSalutation = "¡Buenos días";
    greetingEmoji = "☀️";
  } else if (hour >= 12 && hour < 19) {
    greetingSalutation = "¡Buenas tardes";
    greetingEmoji = "🌤️";
  } else {
    greetingSalutation = "¡Buenas noches";
    greetingEmoji = "🌙";
  }

  const greetingTitle = `${greetingSalutation}, ${clientFirstName}`;

  return (
    <div className={styles.page}>
      {/* ── Header Top Bar ──────────────────────────────────── */}
      <div className={styles.headerTopBar}>
        <span className={styles.dateBadge}>
          {new Date().toLocaleDateString("es-CO", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
        <a href={`/restaurant/${tenant.slug}`} target="_blank" className={styles.viewMenuBtn}>
          <ExternalLink size={15} strokeWidth={1.8} />
          Ver carta pública
        </a>
      </div>

      {/* ── Greeting Hero Banner Card ────────────────────────── */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            {greetingTitle} <span className={styles.heroEmoji}>{greetingEmoji}</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Mantente al día con las analíticas y métricas de hoy. Obtén un resumen rápido de las estadísticas clave de tu restaurante.
          </p>
          <Link href="/analytics" className={styles.heroBtn}>
            Ver reporte completo <ArrowRight size={16} />
          </Link>
        </div>
        <div className={styles.heroIllustrationBox}>
          <Image
            src="/images/analytic-user.svg"
            alt="Resumen operativo"
            className={styles.heroIllustrationImg}
            width={120}
            height={120}
            loading="eager"
          />
        </div>
      </div>

      {/* ── 24. Stats Grid ─────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Pedidos activos"
          value={activeOrders.length}
          sub={`${pendingCount} nuevos · ${preparingCount} en cocina`}
          colorKey="blue"
          icon={<ClipboardCheck size={20} strokeWidth={1.8} />}
        />
        <StatCard
          label="Mesas en servicio"
          value={`${activeTables.length} / ${tables.length}`}
          sub={`${tables.length - activeTables.length} desocupadas`}
          colorKey="teal"
          icon={<LayoutGrid size={20} strokeWidth={1.8} />}
        />
        <StatCard
          label="Ventas acumuladas hoy"
          value={formatCOP(totalToday)}
          sub="Pedidos en curso"
          colorKey="orange"
          icon={<DollarSign size={20} strokeWidth={1.8} />}
        />
        <StatCard
          label="Suscripción SaaS"
          value={PLAN_LIMITS[plan].label}
          sub={`${limits.maxTables === Infinity ? "Ilimitadas" : limits.maxTables} mesas · ${limits.hasAI ? "Analítica IA activa" : "Sin IA"}`}
          colorKey={plan === "RESTRO_IA" ? "teal" : plan === "BUSINESS" ? "blue" : "slate"}
          icon={<Star size={20} strokeWidth={1.8} />}
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
                        background: `${statusConfig.color}15`,
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
              status === "FREE" ? "#16A34A" : status === "ACTIVE" ? "#D97706" : "#94A3B8";
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
