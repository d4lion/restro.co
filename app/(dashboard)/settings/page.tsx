import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { StoreHeaderPreviewCard } from "@/components/dashboard/settings/StoreHeaderPreviewCard";
import { SlugCard } from "@/components/dashboard/settings/SlugCard";
import { LogoutCard } from "@/components/dashboard/settings/LogoutCard";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Restaurante - Configuración | Restro",
};

export default async function SettingsStorePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await tenantRepository.findById(session.tenantId);
  if (!tenant) redirect("/login");

  return (
    <div className={styles.subpageContent}>
      {/* ── Store Identity, Logo, Cover & Social Profiles ── */}
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

      {/* ── Friendly Slug & QR Menu URL Card ── */}
      <SlugCard slug={tenant.slug} />

      {/* ── User Logout Card ── */}
      <LogoutCard />
    </div>
  );
}
