import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import type { PlanKey, PlanRecord } from "@/lib/types";
import { OrderSettingsCard } from "@/components/dashboard/settings/OrderSettingsCard";
import styles from "../page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formas de Pedir - Configuración | Restro",
};

export default async function SettingsOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await tenantRepository.findById(session.tenantId);
  if (!tenant) redirect("/login");

  const planRecord = tenant.subscription?.plan as PlanRecord | undefined;
  const currentPlan = (planRecord?.key ?? "STARTER") as PlanKey;

  return (
    <div className={styles.subpageContent}>
      <OrderSettingsCard
        allowDineIn={tenant.allowDineIn}
        allowTakeout={tenant.allowTakeout}
        allowDelivery={tenant.allowDelivery}
        isMenuOnly={tenant.isMenuOnly}
        isPlanMenuOnly={currentPlan === "CARTA_DIGITAL" || currentPlan === "STARTER"}
        requireTableQrForDineIn={tenant.requireTableQrForDineIn}
        allowWhatsAppOrdering={tenant.allowWhatsAppOrdering}
        whatsappNumber={tenant.whatsappNumber}
        isCartaDigitalPlan={currentPlan === "CARTA_DIGITAL"}
      />
    </div>
  );
}
