import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { orderRepository } from "@/lib/repositories/order.repository";
import { planRepository } from "@/lib/repositories/plan.repository";
import { PLAN_LIMITS, isDashboardModuleLocked, type PlanKey } from "@/lib/types";
import { KdsDashboardClient } from "@/components/dashboard/kds/KdsDashboardClient";
import { PlanUpsellView } from "@/components/dashboard/PlanUpsellView";
import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestión de Comandas | Restro" };

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const planInfo = await planRepository.getPlanForTenant(session.tenantId);
  const plan = (planInfo?.plan.key ?? session.plan ?? "STARTER") as PlanKey;
  const limits = planInfo?.limits ?? PLAN_LIMITS[plan];

  if (isDashboardModuleLocked(plan, "/orders", limits)) {
    return (
      <PlanUpsellView
        moduleName="Pedidos y Cocina (KDS)"
        currentPlanLabel={limits.label}
        recommendedPlanLabel="Restro IA"
        recommendedPlanPrice="$49.900 COP / mes"
        description="Recibe pedidos en tiempo real desde los códigos QR de tus mesas, para llevar o a domicilio, y coordina tu cocina con nuestra pantalla KDS interactiva."
        features={[
          "Pantalla KDS (Kitchen Display System) en tiempo real para cocina y barra",
          "Recepción automática de pedidos desde el QR de cada mesa sin errores",
          "Control de tiempos de preparación (SLA), alertas de retraso y priorización",
          "Trazabilidad completa de estados: Nuevo, Preparando, Listo y Entregado",
        ]}
        icon={<ClipboardList size={28} strokeWidth={1.8} />}
      />
    );
  }

  const orders = await orderRepository.findByTenant(session.tenantId, 100);

  return (
    <KdsDashboardClient
      initialOrders={orders}
      tenantId={session.tenantId}
    />
  );
}
