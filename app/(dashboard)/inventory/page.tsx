import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { planRepository } from "@/lib/repositories/plan.repository";
import { PLAN_LIMITS, isDashboardModuleLocked, type PlanKey } from "@/lib/types";
import { PlanUpsellView } from "@/components/dashboard/PlanUpsellView";
import { Package, AlertTriangle, CheckCircle2, Layers } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Control de Inventario | Restro" };

export default async function InventoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const planInfo = await planRepository.getPlanForTenant(session.tenantId);
  const plan = (planInfo?.plan.key ?? session.plan ?? "STARTER") as PlanKey;
  const limits = planInfo?.limits ?? PLAN_LIMITS[plan];

  if (isDashboardModuleLocked(plan, "/inventory", limits)) {
    return (
      <PlanUpsellView
        moduleName="Inventario y Recetas"
        currentPlanLabel={limits.label}
        recommendedPlanLabel="Restro IA"
        recommendedPlanPrice="$49.900 COP / mes"
        description="Controla el stock de tus insumos en tiempo real, descuenta ingredientes automáticamente con cada venta y recibe alertas de agotamiento."
        features={[
          "Control de existencias de insumos, bebidas y materias primas",
          "Descuento automático de inventario al despachar comandas en cocina",
          "Alertas tempranas de stock bajo para evitar quiebres en pleno servicio",
          "Cálculo de costo por receta (escandallo) y margen de utilidad por plato",
        ]}
        icon={<Package size={28} strokeWidth={1.8} />}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "28px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>
            Control de Inventario
          </h1>
          <span className="badge badge--blue">{limits.label}</span>
        </div>
        <p style={{ color: "#64748B", fontSize: "14px", maxWidth: "560px", lineHeight: 1.5 }}>
          Monitorea tus insumos, niveles de stock y alertas de reabastecimiento.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#2563EB", marginBottom: "8px" }}>
            <Layers size={18} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>Insumos Activos</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>Al día</div>
        </div>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#D97706", marginBottom: "8px" }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>Alertas de Stock Bajo</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>0 alertas</div>
        </div>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#15803D", marginBottom: "8px" }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>Sincronización Carta</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>Activa</div>
        </div>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "40px 24px", textAlign: "center" }}>
        <Package size={32} color="#94A3B8" style={{ margin: "0 auto 12px" }} />
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#0F172A", marginBottom: "6px" }}>
          Módulo de Inventario Activo
        </h2>
        <p style={{ fontSize: "14px", color: "#64748B", maxWidth: "440px", margin: "0 auto" }}>
          Tu plan incluye gestión de inventario. Puedes controlar la disponibilidad de tus productos directamente desde Carta Digital.
        </p>
      </div>
    </div>
  );
}
