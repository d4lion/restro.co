import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileDashboardNav } from "@/components/layout/MobileDashboardNav";
import { Toaster } from "sonner";
import styles from "./layout.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await tenantRepository.findById(session.tenantId);
  if (!tenant) redirect("/login");

  return (
    <div className={styles.shell}>
      {/* ── Desktop Sidebar (hidden on mobile via CSS) ──────── */}
      <div className={styles.sidebarSlot}>
        <Sidebar
          restaurantName={tenant.name}
          restaurantSlug={tenant.slug}
          plan={tenant.plan}
        />
      </div>

      {/* ── Main content ────────────────────────────────────── */}
      <main className={styles.main}>
        {/* Mobile top header */}
        <div className={styles.mobileHeader}>
          <div className={styles.mobileHeaderLogo}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="rgba(255,255,255,0.15)" />
              <rect width="40" height="40" rx="10" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
              <path d="M10 28L20 12L30 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 22H25" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className={styles.mobileHeaderTitle}>Restro</span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "rgba(191,219,254,0.7)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
            {tenant.name}
          </span>
        </div>

        <div className={styles.content}>{children}</div>
      </main>

      {/* ── Mobile bottom navigation (hidden on desktop via CSS) */}
      <div className={styles.mobileNav}>
        <MobileDashboardNav />
      </div>

      {/* Sonner toast notifications */}
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
        }}
        richColors
        closeButton
      />
    </div>
  );
}
