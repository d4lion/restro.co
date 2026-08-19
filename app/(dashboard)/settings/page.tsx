import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import type { PlanKey } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ProfileCard } from "@/components/dashboard/settings/ProfileCard";
import { LogoutCard } from "@/components/dashboard/settings/LogoutCard";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configuración del Restaurante" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await tenantRepository.findById(session.tenantId);
  if (!tenant) redirect("/login");

  const currentPlan = tenant.plan as PlanKey;

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

      {/* ── Restaurant Profile — client component with edit mode ── */}
      <ProfileCard
        tenantId={tenant.id}
        name={tenant.name}
        description={tenant.description ?? null}
        phone={tenant.phone ?? null}
        address={tenant.address ?? null}
        city={tenant.city ?? null}
        logoUrl={tenant.logoUrl ?? null}
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
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Planes de Suscripción SaaS (COP)</h2>
        <p className={styles.cardSub}>Precios en pesos colombianos para todo tipo de establecimiento.</p>

        <div className={styles.plansGrid}>
          {/* Plan Starter */}
          <div className={`${styles.planCard} ${currentPlan === "STARTER" ? styles["planCard--active"] : ""}`}>
            {currentPlan === "STARTER" && <span className={styles.activeBadge}>PLAN ACTUAL</span>}
            <h3 className={styles.planName}>Starter</h3>
            <p className={styles.planPrice}>Gratis</p>
            <ul className={styles.planFeatures}>
              <li>Carta digital QR móvil</li>
              <li>Imágenes de productos incluidas</li>
              <li>Hasta 5 mesas</li>
              <li>Hasta 20 productos</li>
            </ul>
          </div>

          {/* Plan Restro IA */}
          <div className={`${styles.planCard} ${styles["planCard--featured"]} ${currentPlan === "RESTRO_IA" ? styles["planCard--active"] : ""}`}>
            {currentPlan === "RESTRO_IA" && <span className={styles.activeBadge}>PLAN ACTUAL</span>}
            <span className={styles.popularTag}>RECOMENDADO</span>
            <h3 className={styles.planName}>Restro IA</h3>
            <p className={styles.planPrice}>$49.900 <small>/mes</small></p>
            <ul className={styles.planFeatures}>
              <li>Todo lo de Starter</li>
              <li><strong>IA: Recomendaciones y combos</strong></li>
              <li><strong>IA: Predicción de horas pico</strong></li>
              <li>Hasta 30 mesas</li>
              <li>Productos ilimitados</li>
            </ul>
            {currentPlan !== "RESTRO_IA" && (
              <Button type="button" variant="primary" size="sm" fullWidth style={{ marginTop: "12px" }}>
                Seleccionar Plan
              </Button>
            )}
          </div>

          {/* Plan Business */}
          <div className={`${styles.planCard} ${currentPlan === "BUSINESS" ? styles["planCard--active"] : ""}`}>
            {currentPlan === "BUSINESS" && <span className={styles.activeBadge}>PLAN ACTUAL</span>}
            <h3 className={styles.planName}>Business</h3>
            <p className={styles.planPrice}>$99.900 <small>/mes</small></p>
            <ul className={styles.planFeatures}>
              <li>Todo lo de Restro IA</li>
              <li>Mesas ilimitadas</li>
              <li>Cuentas staff ilimitadas</li>
              <li>Exportar reportes Excel &amp; PDF</li>
            </ul>
            {currentPlan !== "BUSINESS" && (
              <Button type="button" variant="outline" size="sm" fullWidth style={{ marginTop: "12px" }}>
                Contactar Ventas
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Logout — client component with confirm ──────────── */}
      <LogoutCard />
    </div>
  );
}
