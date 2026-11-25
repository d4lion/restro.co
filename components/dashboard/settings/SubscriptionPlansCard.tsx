"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { PlanKey } from "@/lib/types";
import styles from "@/app/(dashboard)/settings/page.module.css";

const RESTRO_WHATSAPP_NUMBER =
  (process.env.NEXT_PUBLIC_RESTRO_WHATSAPP_NUMBER || "573193035676").replace(/\D/g, "");

interface Props {
  currentPlan: PlanKey;
  restaurantName?: string;
  tenantSlug?: string;
}

export function SubscriptionPlansCard({ currentPlan, restaurantName, tenantSlug }: Props) {
  const getWhatsAppPlanUrl = (targetPlanLabel: string) => {
    const restaurantInfo = restaurantName
      ? `${restaurantName}${tenantSlug ? ` (${tenantSlug})` : ""}`
      : "mi restaurante";
    const text = `Hola equipo de Restro, tengo ${restaurantInfo} (plan actual: ${currentPlan}) y quiero solicitar el cambio al plan ${targetPlanLabel}.`;
    return `https://wa.me/${RESTRO_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  const renderWhatsAppButton = (
    planLabel: string,
    variant: "primary" | "outline" = "primary"
  ) => (
    <a
      href={getWhatsAppPlanUrl(planLabel)}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "block", marginTop: "12px", textDecoration: "none" }}
    >
      <Button
        type="button"
        variant={variant}
        size="sm"
        fullWidth
        icon={<MessageCircle size={15} />}
      >
        Solicitar por WhatsApp
      </Button>
    </a>
  );

  return (
    <div className={styles.card} id="planes">
      <h2 className={styles.cardTitle}>Elige el plan según la etapa de tu restaurante</h2>
      <p className={styles.cardSub}>
        Precios en pesos colombianos (COP). Para activar o cambiar de plan, escríbenos por WhatsApp y nuestro equipo lo habilita para tu negocio.
      </p>

      <div className={styles.plansGrid}>
        {/* Plan 1: Starter */}
        <div className={`${styles.planCard} ${currentPlan === "STARTER" ? styles["planCard--active"] : ""}`}>
          {currentPlan === "STARTER" && <span className={styles.activeBadge}>PLAN ACTUAL</span>}
          <span className={styles.popularTag} style={{ background: "#475569" }}>ESTOY COMENZANDO</span>
          <h3 className={styles.planName}>Starter</h3>
          <p className={styles.planPrice}>Gratis</p>
          <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "12px" }}>
            Ideal si recién abres o quieres probar dejar el menú en papel sin invertir aún.
          </p>
          <ul className={styles.planFeatures}>
            <li>Tu carta digital con QR lista en minutos</li>
            <li>Hasta 5 productos y 5 mesas con QR</li>
            <li>Pedidos simples por WhatsApp (opcional)</li>
          </ul>
          {currentPlan !== "STARTER" && renderWhatsAppButton("Starter", "outline")}
        </div>

        {/* Plan 2: Carta Digital */}
        <div className={`${styles.planCard} ${currentPlan === "CARTA_DIGITAL" ? styles["planCard--active"] : ""}`}>
          {currentPlan === "CARTA_DIGITAL" && <span className={styles.activeBadge}>PLAN ACTUAL</span>}
          <span className={styles.popularTag} style={{ background: "#15803D" }}>YA TENGO CLIENTES</span>
          <h3 className={styles.planName}>Carta Digital</h3>
          <p className={styles.planPrice}>
            $9.900 <small>/mes</small>
          </p>
          <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "12px" }}>
            Para negocios con carta amplia que quieren verse profesionales sin límites de platos ni mesas.
          </p>
          <ul className={styles.planFeatures}>
            <li>Productos, categorías y mesas QR ilimitadas</li>
            <li>Tu marca propia (logo, portada y enlace)</li>
            <li>Pedido en mesa para mostrar al mesero o enviar por WhatsApp</li>
          </ul>
          {currentPlan !== "CARTA_DIGITAL" && renderWhatsAppButton("Carta Digital", "primary")}
        </div>

        {/* Plan 3: Restro IA */}
        <div className={`${styles.planCard} ${styles["planCard--featured"]} ${currentPlan === "RESTRO_IA" ? styles["planCard--active"] : ""}`}>
          {currentPlan === "RESTRO_IA" && <span className={styles.activeBadge}>PLAN ACTUAL</span>}
          <span className={styles.popularTag}>NEGOCIO MEDIANO · RECOMENDADO</span>
          <h3 className={styles.planName}>Restro IA</h3>
          <p className={styles.planPrice}>
            $49.900 <small>/mes</small>
          </p>
          <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5, marginBottom: "12px" }}>
            Para negocios en crecimiento que quieren agilizar su cocina y aprender más sobre sus ventas y clientes.
          </p>
          <ul className={styles.planFeatures}>
            <li>Todo lo de Carta Digital sin límites</li>
            <li>Pantalla de cocina en vivo (KDS) y alertas de comandas</li>
            <li>Analítica real: qué platos miran más, qué buscan y dónde pierdes pedidos</li>
          </ul>
          {currentPlan !== "RESTRO_IA" && renderWhatsAppButton("Restro IA", "primary")}
        </div>

        {/* Plan 4: Business (Coming Soon) */}
        <div
          className={`${styles.planCard} ${currentPlan === "BUSINESS" ? styles["planCard--active"] : ""}`}
          style={{ opacity: currentPlan === "BUSINESS" ? 1 : 0.85, background: currentPlan === "BUSINESS" ? undefined : "#F8FAFC" }}
        >
          {currentPlan === "BUSINESS" && <span className={styles.activeBadge}>PLAN ACTUAL</span>}
          <span className={styles.popularTag} style={{ background: "#0F172A" }}>PRÓXIMAMENTE</span>
          <h3 className={styles.planName}>Business</h3>
          <p className={styles.planPrice} style={{ fontSize: "18px", color: "#475569" }}>
            Coming Soon
          </p>
          <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.5, marginBottom: "12px" }}>
            Para operaciones grandes o multi-sede que buscan control total de inventario, reservas y automatización.
          </p>
          <ul className={styles.planFeatures}>
            <li>Control de inventario y recetas</li>
            <li>Gestión de reservas de mesas</li>
            <li>Canal WhatsApp Business automatizado y exportación Excel/PDF</li>
          </ul>
          {currentPlan !== "BUSINESS" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              disabled
              style={{ marginTop: "12px" }}
            >
              Próximamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
