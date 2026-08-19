import { getSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { revalidatePath } from "next/cache";
import type { PlanKey } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configuración del Restaurante" };

async function logoutAction() {
  "use server";
  await deleteSession();
  redirect("/login");
}

async function updateRestaurantAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) return;

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;

  await tenantRepository.updateSettings(session.tenantId, {
    name,
    description,
    phone,
    address,
    city,
  });

  revalidatePath("/settings");
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await tenantRepository.findById(session.tenantId);
  if (!tenant) redirect("/login");

  const currentPlan = tenant.plan as PlanKey;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configuración y Planes</h1>
          <p className={styles.subtitle}>
            Administra los datos de tu restaurante, el enlace permanente de tu carta y tu plan de suscripción SaaS.
          </p>
        </div>
      </div>

      {/* Restaurant Profile Card */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Perfil Comercial del Restaurante</h2>
        <form action={updateRestaurantAction} className={styles.form}>
          <Input name="name" label="Nombre Comercial" defaultValue={tenant.name} required />
          <Textarea name="description" label="Descripción / Eslogan" defaultValue={tenant.description || ""} />
          <div className={styles.formRow}>
            <Input name="phone" label="Teléfono de contacto" defaultValue={tenant.phone || ""} />
            <Input name="city" label="Ciudad" defaultValue={tenant.city || "Bogotá"} />
          </div>
          <Input name="address" label="Dirección física" defaultValue={tenant.address || ""} />
          <Button type="submit" variant="primary">Guardar Cambios</Button>
        </form>
      </div>

      {/* Slug Policy Info Card */}
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

      {/* Subscription Plans Card */}
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
              <li>✓ Carta digital QR móvil</li>
              <li>✓ Imágenes de productos incluidas</li>
              <li>✓ Hasta 5 mesas</li>
              <li>✓ Hasta 20 productos</li>
            </ul>
          </div>

          {/* Plan Restro IA */}
          <div className={`${styles.planCard} ${styles["planCard--featured"]} ${currentPlan === "RESTRO_IA" ? styles["planCard--active"] : ""}`}>
            {currentPlan === "RESTRO_IA" && <span className={styles.activeBadge}>PLAN ACTUAL</span>}
            <span className={styles.popularTag}>RECOMENDADO</span>
            <h3 className={styles.planName}>Restro IA</h3>
            <p className={styles.planPrice}>$49.900 <small>/mes</small></p>
            <ul className={styles.planFeatures}>
              <li>✓ Todo lo de Starter</li>
              <li>✓ <strong>IA: Recomendaciones y combos</strong></li>
              <li>✓ <strong>IA: Predicción de horas pico</strong></li>
              <li>✓ Hasta 30 mesas</li>
              <li>✓ Productos ilimitados</li>
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
              <li>✓ Todo lo de Restro IA</li>
              <li>✓ Mesas ilimitadas</li>
              <li>✓ Cuentas staff ilimitadas</li>
              <li>✓ Exportar reportes Excel & PDF</li>
            </ul>
            {currentPlan !== "BUSINESS" && (
              <Button type="button" variant="outline" size="sm" fullWidth style={{ marginTop: "12px" }}>
                Contactar Ventas
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Logout / Danger Zone */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Cerrar Sesión</h2>
        <form action={logoutAction}>
          <Button type="submit" variant="danger">
            Cerrar Sesión de Usuario
          </Button>
        </form>
      </div>
    </div>
  );
}
