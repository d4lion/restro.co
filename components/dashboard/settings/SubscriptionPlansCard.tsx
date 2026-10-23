"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { changePlanAction } from "@/app/actions/settings";
import type { PlanKey } from "@/lib/types";
import styles from "@/app/(dashboard)/settings/page.module.css";

interface Props {
  currentPlan: PlanKey;
}

export function SubscriptionPlansCard({ currentPlan }: Props) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);

  const handleSelectPlan = async (planKey: PlanKey) => {
    if (planKey === currentPlan) return;
    setLoadingPlan(planKey);
    const res = await changePlanAction(planKey);
    setLoadingPlan(null);

    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className={styles.card} id="planes">
      <h2 className={styles.cardTitle}>Planes de Suscripción SaaS (COP)</h2>
      <p className={styles.cardSub}>
        Precios en pesos colombianos para todo tipo de establecimiento. Cambia de plan cuando lo necesites.
      </p>

      <div className={styles.plansGrid}>
        {/* Plan Starter */}
        <div className={`${styles.planCard} ${currentPlan === "STARTER" ? styles["planCard--active"] : ""}`}>
          {currentPlan === "STARTER" && <span className={styles.activeBadge}>PLAN ACTUAL</span>}
          <h3 className={styles.planName}>Starter</h3>
          <p className={styles.planPrice}>Gratis</p>
          <ul className={styles.planFeatures}>
            <li>Carta digital QR móvil</li>
            <li><strong>Máximo 5 productos en carta</strong></li>
            <li><strong>Máximo 5 mesas con QR</strong></li>
            <li>Pedido por WhatsApp (opcional, tú lo activas)</li>
            <li>Sin KDS ni analítica</li>
          </ul>
          {currentPlan !== "STARTER" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              loading={loadingPlan === "STARTER"}
              onClick={() => handleSelectPlan("STARTER")}
              style={{ marginTop: "12px" }}
            >
              Seleccionar Plan
            </Button>
          )}
        </div>

        {/* Plan Carta Digital ($9.900/mes) */}
        <div className={`${styles.planCard} ${currentPlan === "CARTA_DIGITAL" ? styles["planCard--active"] : ""}`}>
          {currentPlan === "CARTA_DIGITAL" && <span className={styles.activeBadge}>PLAN ACTUAL</span>}
          <span className={styles.popularTag} style={{ background: "#15803D" }}>SOLO CARTA</span>
          <h3 className={styles.planName}>Carta Digital</h3>
          <p className={styles.planPrice}>
            $9.900 <small>/mes</small>
          </p>
          <ul className={styles.planFeatures}>
            <li><strong>Productos ilimitados en tu carta</strong></li>
            <li><strong>Mesas y códigos QR ilimitados</strong></li>
            <li>Página web pública de tu carta con tu marca</li>
            <li>Impresión de QRs individuales por mesa</li>
            <li><strong>QR de mesa: el cliente arma su pedido y se lo muestra al mesero</strong></li>
            <li>Pedido por WhatsApp (opcional, tú lo activas)</li>
            <li>Sin KDS ni analítica</li>
          </ul>
          {currentPlan !== "CARTA_DIGITAL" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              fullWidth
              loading={loadingPlan === "CARTA_DIGITAL"}
              onClick={() => handleSelectPlan("CARTA_DIGITAL")}
              style={{ marginTop: "12px" }}
            >
              Seleccionar Plan
            </Button>
          )}
        </div>

        {/* Plan Restro IA */}
        <div className={`${styles.planCard} ${styles["planCard--featured"]} ${currentPlan === "RESTRO_IA" ? styles["planCard--active"] : ""}`}>
          {currentPlan === "RESTRO_IA" && <span className={styles.activeBadge}>PLAN ACTUAL</span>}
          <span className={styles.popularTag}>RECOMENDADO</span>
          <h3 className={styles.planName}>Restro IA</h3>
          <p className={styles.planPrice}>
            $49.900 <small>/mes</small>
          </p>
          <ul className={styles.planFeatures}>
            <li>Todo lo de Carta Digital</li>
            <li><strong>KDS — Pantalla de cocina y pedidos</strong></li>
            <li><strong>IA: Recomendaciones y combos</strong></li>
            <li><strong>IA: Predicción de horas pico</strong></li>
            <li>Mesas y productos ilimitados</li>
          </ul>
          {currentPlan !== "RESTRO_IA" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              fullWidth
              loading={loadingPlan === "RESTRO_IA"}
              onClick={() => handleSelectPlan("RESTRO_IA")}
              style={{ marginTop: "12px" }}
            >
              Seleccionar Plan
            </Button>
          )}
        </div>

        {/* Plan Business */}
        <div className={`${styles.planCard} ${currentPlan === "BUSINESS" ? styles["planCard--active"] : ""}`}>
          {currentPlan === "BUSINESS" && <span className={styles.activeBadge}>PLAN ACTUAL</span>}
          <h3 className={styles.planName}>Business</h3>
          <p className={styles.planPrice}>
            $99.900 <small>/mes</small>
          </p>
          <ul className={styles.planFeatures}>
            <li>Todo lo de Restro IA</li>
            <li>Mesas y cuentas staff ilimitadas</li>
            <li>Canal WhatsApp Business integrado</li>
            <li>Exportar reportes Excel &amp; PDF</li>
          </ul>
          {currentPlan !== "BUSINESS" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              loading={loadingPlan === "BUSINESS"}
              onClick={() => handleSelectPlan("BUSINESS")}
              style={{ marginTop: "12px" }}
            >
              Seleccionar Plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
