import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { BusinessHoursCard } from "@/components/dashboard/settings/BusinessHoursCard";
import styles from "../page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Horarios de Atención - Configuración | Restro",
};

export default async function SettingsHoursPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await tenantRepository.findById(session.tenantId);
  if (!tenant) redirect("/login");

  return (
    <div className={styles.subpageContent}>
      <BusinessHoursCard
        initialHours={tenant.businessHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
        }))}
      />
    </div>
  );
}
