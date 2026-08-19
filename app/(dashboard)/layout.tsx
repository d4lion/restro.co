import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { Sidebar } from "@/components/layout/Sidebar";
import styles from "./layout.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const tenant = await tenantRepository.findById(session.tenantId);
  if (!tenant) {
    redirect("/login");
  }

  return (
    <div className={styles.shell}>
      <Sidebar
        restaurantName={tenant.name}
        restaurantSlug={tenant.slug}
        plan={tenant.plan}
      />
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
