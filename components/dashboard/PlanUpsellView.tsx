import React from "react";
import Link from "next/link";
import { Lock, Check, Sparkles, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./PlanUpsellView.module.css";

export interface PlanUpsellViewProps {
  moduleName: string;
  currentPlanLabel?: string;
  recommendedPlanLabel?: string;
  recommendedPlanPrice?: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
}

export function PlanUpsellView({
  moduleName,
  currentPlanLabel = "Carta Digital",
  recommendedPlanLabel = "Restro IA",
  recommendedPlanPrice = "$49.900 COP / mes",
  description,
  features,
  icon,
}: PlanUpsellViewProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.topAccent} />

        <div className={styles.iconCircle}>
          {icon}
          <span className={styles.lockBadge} title="Módulo bloqueado">
            <Lock size={13} strokeWidth={2.5} />
          </span>
        </div>

        <span className={styles.planPill}>
          <Lock size={12} strokeWidth={2.5} />
          No incluido en tu plan {currentPlanLabel}
        </span>

        <h1 className={styles.title}>
          Mejora tu plan para activar {moduleName}
        </h1>

        <p className={styles.description}>{description}</p>

        <div className={styles.featuresBox}>
          <div className={styles.featuresHeading}>
            ¿Qué desbloqueas con este módulo?
          </div>
          <ul className={styles.featuresList}>
            {features.map((feature, index) => (
              <li key={index} className={styles.featureItem}>
                <span className={styles.checkIcon}>
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.recommendedBox}>
          <span className={styles.recommendedInfo}>
            <Sparkles size={16} />
            Disponible desde el plan {recommendedPlanLabel}
          </span>
          <span className={styles.recommendedPrice}>{recommendedPlanPrice}</span>
        </div>

        <div className={styles.actions}>
          <Link href="/settings#planes" className={styles.primaryLink}>
            <Button type="button" variant="primary" size="lg" fullWidth>
              Mejorar mi plan <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/menu" className={styles.secondaryLink}>
            <BookOpen size={16} />
            Ir a mi Carta Digital
          </Link>
        </div>
      </div>
    </div>
  );
}
