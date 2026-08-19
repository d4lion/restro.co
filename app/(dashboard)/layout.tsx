import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "sonner";
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

      {/* Sonner toast notifications — themed to the blue/white palette */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-display)",
            fontSize: "0.875rem",
            border: "1.5px solid #DBEAFE",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(30,58,138,0.14)",
          },
          classNames: {
            toast: "restro-toast",
            success: "restro-toast-success",
            error: "restro-toast-error",
          },
        }}
        richColors
        closeButton
      />
    </div>
  );
}
