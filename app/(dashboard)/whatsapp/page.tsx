import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { planRepository } from "@/lib/repositories/plan.repository";
import { PLAN_LIMITS, isDashboardModuleLocked, type PlanKey } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlanUpsellView } from "@/components/dashboard/PlanUpsellView";
import { MessageCircle } from "lucide-react";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "WhatsApp Business (Próximamente)" };

async function waitlistAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) return;
  const email = formData.get("email") as string;
  if (email) {
    await tenantRepository.addWhatsappWaitlist(session.tenantId, email);
  }
}

export default async function WhatsappPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [tenant, planInfo] = await Promise.all([
    tenantRepository.findById(session.tenantId),
    planRepository.getPlanForTenant(session.tenantId),
  ]);
  if (!tenant) redirect("/login");

  const plan = (planInfo?.plan.key ?? tenant.subscription?.plan?.key ?? "STARTER") as PlanKey;
  const limits = planInfo?.limits ?? PLAN_LIMITS[plan];

  if (isDashboardModuleLocked(plan, "/whatsapp", limits)) {
    return (
      <PlanUpsellView
        moduleName="Canal WhatsApp Business"
        currentPlanLabel={limits.label}
        recommendedPlanLabel="Business"
        recommendedPlanPrice="$99.900 COP / mes"
        description="Automatiza la recepción de pedidos a domicilio y para recoger directamente desde tu línea de WhatsApp Business conectada a tu cocina."
        features={[
          "Envío automático de tu carta interactiva cuando un cliente escribe por WhatsApp",
          "Recepción de pedidos de domicilio y recogida sin comisiones por orden",
          "Sincronización directa de pedidos confirmados con tu pantalla KDS",
          "Notificaciones automáticas de estado de pedido para tus comensales",
        ]}
        icon={<MessageCircle size={28} strokeWidth={1.8} />}
      />
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Canal WhatsApp Business</h1>
            <span className="badge badge--building">EN CONSTRUCCIÓN</span>
          </div>
          <p className={styles.subtitle}>
            Próximamente tus clientes podrán realizar pedidos directamente a través de WhatsApp escaneando un código QR.
          </p>
        </div>
      </div>

      {/* Building Banner */}
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <h2 className={styles.bannerTitle}>Módulo en Desarrollo Activo</h2>
          <p className={styles.bannerText}>
            Estamos integrando la conexión por código QR (WhatsApp Web Pair API) para que vincules tu cuenta de WhatsApp Business en 30 segundos sin verificaciones complejas de Meta.
          </p>
        </div>
      </div>

      {/* Flow Explanation */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Flujo de Vinculación de WhatsApp</h3>
          <div className={styles.stepsList}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div>
                <strong>Conexión con Código QR</strong>
                <p>Escanearás el código QR desde tu aplicación de WhatsApp Business en el celular.</p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div>
                <strong>Recepción de Carta Digital</strong>
                <p>Restro enviará automáticamente la carta digital interactiva cuando un cliente escriba.</p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div>
                <strong>Envío Directo a Cocina</strong>
                <p>Los pedidos confirmados por WhatsApp ingresarán directamente a tu pantalla KDS.</p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Placeholder & Waitlist Form */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Vista Previa de Conexión</h3>
          <div className={styles.qrPlaceholderBox}>
            <div className={styles.qrIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <span className="badge badge--warning">Estado: Desconectado</span>
            <p className={styles.qrHelp}>Módulo de conexión en preparación...</p>
          </div>

          <form action={waitlistAction} className={styles.waitlistForm}>
            <p className={styles.waitlistTitle}>Acceso Anticipado al Lanzamiento</p>
            <Input
              type="email"
              name="email"
              placeholder="tu@email.com"
              defaultValue={tenant.whatsappWaitlistEmail ?? ""}
              hint={tenant.whatsappWaitlistEmail ? "Registrado para el lanzamiento" : "Ingresa tu email para recibir notificación al activarlo"}
            />
            <Button type="submit" variant="secondary" size="md">
              Avisarme al Lanzamiento
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
