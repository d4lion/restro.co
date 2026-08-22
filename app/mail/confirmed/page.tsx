import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { MailCheck, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Store } from "lucide-react";
import styles from "./page.module.css";

export const metadata = {
  title: "Email Confirmado Exitosamente | Restro",
  description: "Tu correo electrónico ha sido verificado con éxito en Restro.",
};

interface EmailConfirmedPageProps {
  searchParams: Promise<{ verified?: string }>;
}

export default async function EmailConfirmedPage({ searchParams }: EmailConfirmedPageProps) {
  const params = await searchParams;
  const session = await getSession();

  // STRICT ACCESS CONTROL:
  // Only allow users who came from a successful email code exchange (verified === "true")
  // and have an active authenticated session. Block all direct URL navigation.
  if (params?.verified !== "true" || !session) {
    if (session) {
      redirect("/overview");
    } else {
      redirect("/login");
    }
  }

  let tenant = null;
  if (session?.tenantId) {
    tenant = await tenantRepository.findById(session.tenantId);
  }

  const isCompleted = tenant?.onboarding ?? false;
  const destinationUrl = isCompleted ? "/overview" : "/onboarding";
  const buttonText = isCompleted ? "Ir a mi Dashboard" : "Configurar mi Restaurante";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          
          {/* Badge */}
          <div className={styles.badge}>
            <Sparkles size={13} /> Verificación completada
          </div>

          {/* Big Success Icon Circle */}
          <div className={styles.iconCircle}>
            <MailCheck size={44} strokeWidth={1.8} />
          </div>

          {/* Heading & Subtitle */}
          <h1 className={styles.title}>¡Correo confirmado de manera satisfactoria!</h1>
          <p className={styles.subtitle}>
            Tu cuenta de correo electrónico ha sido verificada con éxito.
            {tenant ? ` Tu restaurante "${tenant.name}" ya se encuentra activo.` : " Ya puedes acceder a todas las funciones de Restro."}
          </p>

          {/* Info Checklist Box */}
          <div className={styles.infoBox}>
            <div className={styles.infoItem}>
              <ShieldCheck size={18} className={styles.infoIcon} />
              <span>Cuenta de usuario verificada y autenticada</span>
            </div>
            <div className={styles.infoItem}>
              <CheckCircle2 size={18} className={styles.infoIcon} />
              <span>Acceso seguro a la plataforma y herramientas de Restro</span>
            </div>
            <div className={styles.infoItem}>
              <Store size={18} className={styles.infoIcon} />
              <span>{isCompleted ? "Tu carta digital está activa y lista para vender" : "Listo para iniciar el asistente de configuración inicial"}</span>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Link href={destinationUrl} className={styles.btnPrimary}>
              <span>{buttonText}</span>
              <ArrowRight size={18} />
            </Link>

            <Link href="/overview" className={styles.btnSecondary}>
              Ir al Panel Principal
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
