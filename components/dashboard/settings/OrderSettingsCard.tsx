"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOrderSettingsAction } from "@/app/actions/settings";
import { Check, Loader2, Utensils, ShoppingBag, Bike } from "lucide-react";
import styles from "./OrderSettingsCard.module.css";

interface OrderSettingsCardProps {
  allowDineIn: boolean;
  allowTakeout: boolean;
  allowDelivery: boolean;
}

export function OrderSettingsCard({
  allowDineIn: initialDineIn,
  allowTakeout: initialTakeout,
  allowDelivery: initialDelivery,
}: OrderSettingsCardProps) {
  const [allowDineIn, setAllowDineIn] = useState(initialDineIn);
  const [allowTakeout, setAllowTakeout] = useState(initialTakeout);
  const [allowDelivery, setAllowDelivery] = useState(initialDelivery);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderSettingsAction(
        allowDineIn,
        allowTakeout,
        allowDelivery
      );
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  const hasChanges =
    allowDineIn !== initialDineIn ||
    allowTakeout !== initialTakeout ||
    allowDelivery !== initialDelivery;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Canales de Venta (Pedidos)</h2>
          <p className={styles.cardHint}>
            Configura qué opciones están habilitadas para tus clientes al momento
            de hacer un pedido desde tu menú digital.
          </p>
        </div>
      </div>

      <div className={styles.optionsGrid}>
        {/* Dine In */}
        <div
          className={`${styles.optionCard} ${
            allowDineIn ? styles.optionCardActive : ""
          }`}
          onClick={() => setAllowDineIn(!allowDineIn)}
        >
          <Utensils className={styles.optionIcon} size={20} />
          <div className={styles.optionContent}>
            <span className={styles.optionTitle}>
              En Mesa (Dine-In)
              <div
                className={`${styles.checkbox} ${
                  allowDineIn ? styles.checkboxActive : ""
                }`}
              >
                {allowDineIn && <Check size={12} strokeWidth={3} />}
              </div>
            </span>
            <span className={styles.optionDesc}>
              El cliente escanea el QR en la mesa y pide para consumir en el
              local.
            </span>
          </div>
        </div>

        {/* Takeout */}
        <div
          className={`${styles.optionCard} ${
            allowTakeout ? styles.optionCardActive : ""
          }`}
          onClick={() => setAllowTakeout(!allowTakeout)}
        >
          <ShoppingBag className={styles.optionIcon} size={20} />
          <div className={styles.optionContent}>
            <span className={styles.optionTitle}>
              Para Llevar (Takeout)
              <div
                className={`${styles.checkbox} ${
                  allowTakeout ? styles.checkboxActive : ""
                }`}
              >
                {allowTakeout && <Check size={12} strokeWidth={3} />}
              </div>
            </span>
            <span className={styles.optionDesc}>
              El cliente puede armar su pedido para recogerlo físicamente en el
              local.
            </span>
          </div>
        </div>

        {/* Delivery */}
        <div
          className={`${styles.optionCard} ${
            allowDelivery ? styles.optionCardActive : ""
          }`}
          onClick={() => setAllowDelivery(!allowDelivery)}
        >
          <Bike className={styles.optionIcon} size={20} />
          <div className={styles.optionContent}>
            <span className={styles.optionTitle}>
              Domicilio (Delivery)
              <div
                className={`${styles.checkbox} ${
                  allowDelivery ? styles.checkboxActive : ""
                }`}
              >
                {allowDelivery && <Check size={12} strokeWidth={3} />}
              </div>
            </span>
            <span className={styles.optionDesc}>
              El cliente ingresa su dirección y pide que se le envíe a casa.
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!hasChanges || isPending}
        >
          {isPending ? (
            <>
              <Loader2 size={16} className={styles.spin} /> Guardando...
            </>
          ) : (
            <>Guardar Ajustes</>
          )}
        </button>
      </div>
    </div>
  );
}
