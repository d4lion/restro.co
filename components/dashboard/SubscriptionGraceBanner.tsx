"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, ArrowRight, X } from "lucide-react";
import { calculateSubscriptionTime } from "@/lib/subscription-utils";
import styles from "./SubscriptionGraceBanner.module.css";

interface Props {
  subscription?: {
    status?: string | null;
    currentPeriodStart?: Date | string | null;
    currentPeriodEnd?: Date | string | null;
    trialEndsAt?: Date | string | null;
    plan?: {
      key: string;
      label: string;
    } | null;
  } | null;
}

export function SubscriptionGraceBanner({ subscription }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !subscription) return null;

  const planKey = subscription.plan?.key ?? "STARTER";
  // Starter is free and indefinite — no warning needed
  if (planKey === "STARTER") return null;

  const calc = calculateSubscriptionTime({
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    trialEndsAt: subscription.trialEndsAt,
    status: subscription.status,
    planKey,
  });

  // Only render for grace period or hard expired
  if (calc.urgencyStatus !== "GRACE_PERIOD" && calc.urgencyStatus !== "EXPIRED") {
    return null;
  }

  const isGrace = calc.urgencyStatus === "GRACE_PERIOD";
  const daysLeft = calc.daysRemainingInGrace ?? 7;

  return (
    <div
      className={`${styles.banner} ${isGrace ? styles["banner--warning"] : styles["banner--danger"]}`}
      role="alert"
    >
      <div className={styles.leftContent}>
        <div className={styles.iconWrapper}>
          {isGrace ? <AlertTriangle size={20} /> : <ShieldAlert size={20} />}
        </div>
        <div className={styles.textContent}>
          <h4 className={styles.title}>
            {isGrace
              ? "Periodo de gracia activo: Tu suscripción ha vencido"
              : "Suscripción suspendida: Periodo de gracia finalizado"}
          </h4>
          <p className={styles.description}>
            {isGrace
              ? `Tu cuenta dispone de un periodo de tolerancia de 7 días. Te quedan ${daysLeft} ${
                  daysLeft === 1 ? "día" : "días"
                } de gracia para renovar tu suscripción antes de la suspensión de tus pedidos y funciones.`
              : "El periodo de tolerancia de 7 días ha expirado. Renueva o actualiza tu suscripción para rehabilitar el acceso a todas las operaciones de tu restaurante."}
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <Link
          href="/settings/support"
          style={{
            fontSize: "0.8125rem",
            color: isGrace ? "#92400E" : "#991B1B",
            fontWeight: 500,
            textDecoration: "underline",
            whiteSpace: "nowrap",
          }}
        >
          Reportar novedad
        </Link>
        <Link href="/settings/plan" className={styles.renewBtn}>
          <span>{isGrace ? "Renovar suscripción" : "Actualizar plan"}</span>
          <ArrowRight size={14} />
        </Link>
        <button
          type="button"
          className={styles.dismissBtn}
          title="Descartar aviso temporalmente"
          onClick={() => setDismissed(true)}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
