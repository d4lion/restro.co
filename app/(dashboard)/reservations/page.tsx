import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { planRepository } from "@/lib/repositories/plan.repository";
import { PLAN_LIMITS, isDashboardModuleLocked, type PlanKey } from "@/lib/types";
import { PlanUpsellView } from "@/components/dashboard/PlanUpsellView";
import { CalendarDays, Clock, Users, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestión de Reservas | Restro" };

export default async function ReservationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const planInfo = await planRepository.getPlanForTenant(session.tenantId);
  const plan = (planInfo?.plan.key ?? session.plan ?? "STARTER") as PlanKey;
  const limits = planInfo?.limits ?? PLAN_LIMITS[plan];

  if (isDashboardModuleLocked(plan, "/reservations", limits)) {
    return (
      <PlanUpsellView
        moduleName="Reservas de Mesas"
        currentPlanLabel={limits.label}
        recommendedPlanLabel="Restro IA"
        recommendedPlanPrice="$49.900 COP / mes"
        description="Administra la disponibilidad de tu salón, recibe reservas en línea y asigna mesas automáticamente evitando sobreocupación."
        features={[
          "Calendario digital de reservas por franja horaria y capacidad de mesa",
          "Confirmaciones y recordatorios automáticos para reducir inasistencias (no-shows)",
          "Asignación inteligente de mesas en planta según número de comensales",
          "Historial de clientes frecuentes y preferencias de servicio",
        ]}
        icon={<CalendarDays size={28} strokeWidth={1.8} />}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "28px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>
            Reservas de Mesas
          </h1>
          <span className="badge badge--blue">{limits.label}</span>
        </div>
        <p style={{ color: "#64748B", fontSize: "14px", maxWidth: "560px", lineHeight: 1.5 }}>
          Gestiona las reservas programadas de tus comensales y optimiza la ocupación de tu salón.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#2563EB", marginBottom: "8px" }}>
            <CalendarDays size={18} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>Reservas de Hoy</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>0 programadas</div>
        </div>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0D9488", marginBottom: "8px" }}>
            <Users size={18} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>Comensales Esperados</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>0 personas</div>
        </div>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#15803D", marginBottom: "8px" }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>Estado del Salón</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>Disponible</div>
        </div>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "40px 24px", textAlign: "center" }}>
        <Clock size={32} color="#94A3B8" style={{ margin: "0 auto 12px" }} />
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#0F172A", marginBottom: "6px" }}>
          Sin reservas registradas para hoy
        </h2>
        <p style={{ fontSize: "14px", color: "#64748B", maxWidth: "420px", margin: "0 auto" }}>
          Las reservas creadas para tu restaurante aparecerán aquí organizadas por horario y mesa asignada.
        </p>
      </div>
    </div>
  );
}
