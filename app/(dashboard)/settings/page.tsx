import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import type { PlanKey, PlanRecord } from "@/lib/types";
import { StoreHeaderPreviewCard } from "@/components/dashboard/settings/StoreHeaderPreviewCard";
import { OrderSettingsCard } from "@/components/dashboard/settings/OrderSettingsCard";
import { NotificationSettingsCard } from "@/components/dashboard/settings/NotificationSettingsCard";
import { BusinessHoursCard } from "@/components/dashboard/settings/BusinessHoursCard";
import { SubscriptionPlansCard } from "@/components/dashboard/settings/SubscriptionPlansCard";
import { LogoutCard } from "@/components/dashboard/settings/LogoutCard";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configuración del Restaurante" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await tenantRepository.findById(session.tenantId);
  if (!tenant) redirect("/login");

  const planRecord = tenant.subscription?.plan as PlanRecord | undefined;
  const currentPlan = (planRecord?.key ?? "STARTER") as PlanKey;

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configuración y Planes</h1>
          <p className={styles.subtitle}>
            Administra los datos de tu restaurante, carga tu logo comercial, gestiona el enlace permanente de tu carta y tu plan de suscripción SaaS.
          </p>
        </div>
      </div>

      {/* ── Facebook-Style Store Front Header Live Preview ── */}
      <StoreHeaderPreviewCard
        tenantId={tenant.id}
        name={tenant.name}
        description={tenant.description ?? null}
        phone={tenant.phone ?? null}
        address={tenant.address ?? null}
        city={tenant.city ?? null}
        logoUrl={tenant.logoUrl ?? null}
        coverUrl={tenant.coverUrl ?? null}
        brandColor={tenant.brandColor ?? "#FF6B35"}
        instagramUrl={tenant.instagramUrl ?? null}
        facebookUrl={tenant.facebookUrl ?? null}
        tiktokUrl={tenant.tiktokUrl ?? null}
        websiteUrl={tenant.websiteUrl ?? null}
        businessHours={tenant.businessHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
        }))}
      />

      {/* ── Realtime Notification Settings ─────────────────────── */}
      <NotificationSettingsCard />

      {/* ── Order Settings ───────────────────────────────────── */}
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

      {/* ── Business Hours ────────────────────────────────────── */}
      <BusinessHoursCard
        initialHours={tenant.businessHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
        }))}
      />

      {/* ── Slug Policy Info Card ───────────────────────────── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Enlace Permanente de tu Carta QR (Slug)</h2>
        <div className={styles.slugBox}>
          <div className={styles.slugUrl}>
            <code>restro.adamind.cloud/<strong>{tenant.slug}</strong></code>
          </div>
          <p className={styles.slugHint}>
            <strong>Política de Slugs:</strong> El slug está asociado a tus códigos QR impresos. Es editable libremente durante los primeros 30 días. Posteriormente queda bloqueado para evitar romper los QR impresos.
          </p>
        </div>
      </div>

      {/* ── Subscription Plans Card ─────────────────────────── */}
      <SubscriptionPlansCard currentPlan={currentPlan} />

      {/* ── Logout — client component with confirm ──────────── */}
      <LogoutCard />
    </div>
  );
}
