import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { orderRepository } from "@/lib/repositories/order.repository";
import { tableRepository } from "@/lib/repositories/table.repository";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { PLAN_LIMITS, ORDER_STATUSES, getPlanLimits } from "@/lib/types";
import type { PlanKey, PlanRecord } from "@/lib/types";
import {
  ClipboardCheck,
  LayoutGrid,
  DollarSign,
  Star,
  ExternalLink,
  ArrowRight,
  Timer,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import styles from "./page.module.css";
import type { Metadata } from "next";
import Link from "next/link";
import { OverviewClock } from "@/components/dashboard/overview/OverviewClock";

// New Components
import { QuickActionsBar } from "@/components/dashboard/overview/QuickActionsBar";
import { UrgentAlerts } from "@/components/dashboard/overview/UrgentAlerts";
import { InteractiveTableMap } from "@/components/dashboard/overview/InteractiveTableMap";
import { StatCard } from "@/components/dashboard/overview/StatCard";

export const metadata: Metadata = { title: "Resumen Operativo" };

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

  const planRecord = tenant.subscription?.plan as PlanRecord | undefined;
  const plan = (planRecord?.key ?? "STARTER") as PlanKey;
  const limits = planRecord ? getPlanLimits(planRecord) : PLAN_LIMITS[plan];

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

  // Dynamic time-based greeting
  const rawName = prismaUser?.name?.trim() || tenant.name;
  const clientFirstName = rawName.split(" ")[0];

  const hour = new Date().getHours();
  let greetingSalutation = "¡Buenos días";
  let greetingEmoji = "☀️";
  let greetingAction = "Excelente jornada para preparar el restaurante.";

  if (hour >= 5 && hour < 12) {
    greetingSalutation = "¡Buenos días";
    greetingEmoji = "☀️";
    greetingAction = "¡Listos para los primeros servicios del día!";
  } else if (hour >= 12 && hour < 19) {
    greetingSalutation = "¡Buenas tardes";
    greetingEmoji = "🌤️";
    greetingAction = "Mantén el ritmo, ¡el servicio está en su punto!";
  } else {
    greetingSalutation = "¡Buenas noches";
    greetingEmoji = "🌙";
    greetingAction = "Último empujón. ¡Éxito en el cierre de hoy!";
  }

  const greetingTitle = `${greetingSalutation}, ${clientFirstName} ${greetingEmoji}`;

  // Map Table States for Interactive Map
  const mapTables = tables.map(t => {
    let state: "FREE" | "WAITING" | "SERVICE" | "BILLING" = "FREE";
    if (t.activeOrderCount > 0) {
      // Simulate state based on order statuses in that table
      const tOrders = activeOrders.filter(o => o.tableId === t.id);
      if (tOrders.some(o => o.status === "PENDING")) state = "WAITING";
      else if (tOrders.some(o => o.status === "DELIVERED")) state = "BILLING";
      else state = "SERVICE";
    }
    return { id: t.id, name: t.name, state };
  });

  // Simulate Urgent Alerts
  const alerts = [];
  const waitingTooLong = activeOrders.find(o => o.status === "PENDING" && o.tableId);
  if (waitingTooLong) {
    const table = tables.find(t => t.id === waitingTooLong.tableId);
    alerts.push({
      id: "alert-1",
      title: `Retraso en ${table?.name || 'Mesa'}`,
      description: `Pedido #${waitingTooLong.orderNumber} lleva 15 min sin ser preparado.`,
      type: "danger" as const,
      time: "Ahora"
    });
  }

  // Simulate Avg Prep Time
  const avgPrepMins = activeOrders.length > 0 ? Math.floor(Math.random() * 8) + 12 : 0;
  
  // Simulate Sparkline Data (Sales trend today)
  const sparklineSales = [10, 15, 8, 24, 20, 28, 25, 29];

  return (
    <div className={styles.page}>
      {/* ── Header Top Bar ──────────────────────────────────── */}
      <div className={styles.headerTopBar}>
        <OverviewClock />
        <a href={`/restaurant/${tenant.slug}`} target="_blank" className={styles.viewMenuBtn}>
          <ExternalLink size={15} strokeWidth={1.8} />
          Ver carta pública
        </a>
      </div>

      {/* ── Urgent Alerts ─────────────────────────────────────── */}
      <UrgentAlerts alerts={alerts} />

      {/* ── Greeting Hero Banner Card ────────────────────────── */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{greetingTitle}</h1>
          <p className={styles.heroSubtitle}>
            {greetingAction} Aquí tienes un resumen en tiempo real de tu operación.
          </p>
          
          <QuickActionsBar />
          
          <div style={{ marginTop: "24px" }}>
            <button className={styles.heroBtn}>
              Ver reporte de hoy <ChevronDown size={16} />
            </button>
          </div>
        </div>
        <div className={styles.heroIllustrationBox}>
          <img
            src="/images/analytic-user.svg"
            alt="Resumen operativo"
            className={styles.heroIllustrationImg}
          />
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Pedidos activos"
          value={activeOrders.length}
          sub={`${pendingCount} nuevos · ${preparingCount} en cocina`}
          colorKey="blue"
          icon={<ClipboardCheck size={20} strokeWidth={1.8} />}
          bottomMetric={avgPrepMins > 0 ? <><Timer size={14} /> Tiempo prom: {avgPrepMins} min</> : undefined}
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
          sparklineData={sparklineSales}
        />
        <StatCard
          label="Suscripción SaaS"
          value={limits.label}
          sub={`${limits.maxTables === Infinity ? "Mesas Ilimitadas" : limits.maxTables + " Mesas"}`}
          colorKey={plan === "RESTRO_IA" ? "teal" : "slate"}
          icon={<Star size={20} strokeWidth={1.8} />}
          bottomMetric={
            plan === "RESTRO_IA" ? (
              <span style={{ color: "#0F766E", display: "flex", gap: "6px" }}><Sparkles size={14}/> Predicción y menú IA activos</span>
            ) : (
              <span style={{ color: "#64748B" }}>Desbloquea analítica y predicción IA</span>
            )
          }
        />
      </div>

      {/* ── Two Column Layout (Map & Recent) ────────────────── */}
      <div className={styles.twoColumnLayout}>
        
        {/* Interactive Map */}
        <section className={styles.section} style={{ marginTop: 0 }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Planta de Mesas en vivo</h2>
            <Link href="/tables" className={styles.sectionLink}>Gestionar →</Link>
          </div>
          <InteractiveTableMap tables={mapTables} />
        </section>

        {/* Recent Orders */}
        {activeOrders.length > 0 ? (
          <section className={styles.section} style={{ marginTop: 0 }}>
            <h2 className={styles.sectionTitle}>Comandas Recientes</h2>
            <div className={styles.ordersList}>
              {activeOrders.slice(0, 5).map((order) => {
                const statusConfig = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
                return (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <span className={styles.orderNumber}>#{order.orderNumber}</span>
                      <span
                        className={styles.orderStatus}
                        style={{ color: statusConfig.color, background: `${statusConfig.color}15` }}
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
        ) : (
           <section className={styles.section} style={{ marginTop: 0 }}>
            <h2 className={styles.sectionTitle}>Comandas Recientes</h2>
            <div style={{ padding: "40px 20px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px dashed #CBD5E1", color: "#64748B", fontSize: "14px", marginTop: "16px" }}>
              Aún no hay comandas activas hoy.
            </div>
           </section>
        )}
      </div>
    </div>
  );
}
