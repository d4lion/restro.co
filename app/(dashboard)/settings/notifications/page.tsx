import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { NotificationSettingsCard } from "@/components/dashboard/settings/NotificationSettingsCard";
import styles from "../page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alertas y Sonidos - Configuración | Restro",
};

export default async function SettingsNotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className={styles.subpageContent}>
      <NotificationSettingsCard />
    </div>
  );
}
