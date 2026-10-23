import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import type { PlanKey, PlanRecord } from "@/lib/types";
import { SubscriptionPlansCard } from "@/components/dashboard/settings/SubscriptionPlansCard";
import styles from "../page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Plan y Pagos - Configuración | Restro",
};

export default async function SettingsPlanPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await tenantRepository.findById(session.tenantId);
  if (!tenant) redirect("/login");

  const planRecord = tenant.subscription?.plan as PlanRecord | undefined;
  const currentPlan = (planRecord?.key ?? "STARTER") as PlanKey;

  return (
    <div className={styles.subpageContent}>
      <SubscriptionPlansCard currentPlan={currentPlan} />
    </div>
  );
}
