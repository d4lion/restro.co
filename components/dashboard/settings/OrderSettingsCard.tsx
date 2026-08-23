"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOrderSettingsAction } from "@/app/actions/settings";
import { Check, Loader2, Utensils, ShoppingBag, Bike, Eye, QrCode, MessageSquare } from "lucide-react";
import styles from "./OrderSettingsCard.module.css";

interface OrderSettingsCardProps {
  allowDineIn: boolean;
  allowTakeout: boolean;
  allowDelivery: boolean;
  isMenuOnly?: boolean;
  requireTableQrForDineIn?: boolean;
  allowWhatsAppOrdering?: boolean;
  whatsappNumber?: string | null;
}

export function OrderSettingsCard({
  allowDineIn: initialDineIn,
  allowTakeout: initialTakeout,
  allowDelivery: initialDelivery,
  isMenuOnly: initialMenuOnly = false,
  requireTableQrForDineIn: initialRequireQr = true,
  allowWhatsAppOrdering: initialWhatsApp = false,
  whatsappNumber: initialWhatsAppNum = "",
}: OrderSettingsCardProps) {
  const [allowDineIn, setAllowDineIn] = useState(initialDineIn);
  const [allowTakeout, setAllowTakeout] = useState(initialTakeout);
  const [allowDelivery, setAllowDelivery] = useState(initialDelivery);
  const [isMenuOnly, setIsMenuOnly] = useState(initialMenuOnly);
  const [requireTableQrForDineIn, setRequireTableQrForDineIn] = useState(initialRequireQr);
  const [allowWhatsAppOrdering, setAllowWhatsAppOrdering] = useState(initialWhatsApp);
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsAppNum || "");

  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderSettingsAction(
        allowDineIn,
        allowTakeout,
        allowDelivery,
        isMenuOnly,
        requireTableQrForDineIn,
        allowWhatsAppOrdering,
        whatsappNumber
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
    allowDelivery !== initialDelivery ||
    isMenuOnly !== initialMenuOnly ||
    requireTableQrForDineIn !== initialRequireQr ||
    allowWhatsAppOrdering !== initialWhatsApp ||
    whatsappNumber !== (initialWhatsAppNum || "");

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Canales y Modos de Pedido</h2>
          <p className={styles.cardHint}>
            Configura las reglas de tu carta digital: solo lectura, pedidos estrictos por QR de mesa, para llevar, domicilio o pedidos por WhatsApp.
          </p>
        </div>
      </div>

      {/* Mode 1: Solo Carta Digital (Read Only) */}
      <div className={styles.specialSection}>
        <div
          className={`${styles.optionCard} ${isMenuOnly ? styles.optionCardActive : ""}`}
          onClick={() => setIsMenuOnly(!isMenuOnly)}
        >
          <Eye className={styles.optionIcon} size={22} />
          <div className={styles.optionContent}>
            <span className={styles.optionTitle}>
              Solo Carta Visual (Deshabilitar Carrito)
              <div className={`${styles.checkbox} ${isMenuOnly ? styles.checkboxActive : ""}`}>
                {isMenuOnly && <Check size={12} strokeWidth={3} />}
              </div>
            </span>
            <span className={styles.optionDesc}>
              Tu menú funcionará estrictamente como una carta digital informativa. Se ocultan los botones de compra y el carrito.
            </span>
          </div>
        </div>
      </div>

      {/* Ordering Options Grid (Disabled if isMenuOnly is active) */}
      <div className={styles.optionsGrid} style={{ opacity: isMenuOnly ? 0.4 : 1, pointerEvents: isMenuOnly ? "none" : "auto" }}>
        {/* Dine In */}
        <div
          className={`${styles.optionCard} ${allowDineIn ? styles.optionCardActive : ""}`}
          onClick={() => setAllowDineIn(!allowDineIn)}
        >
          <Utensils className={styles.optionIcon} size={20} />
          <div className={styles.optionContent}>
            <span className={styles.optionTitle}>
              En Mesa (Dine-In)
              <div className={`${styles.checkbox} ${allowDineIn ? styles.checkboxActive : ""}`}>
                {allowDineIn && <Check size={12} strokeWidth={3} />}
              </div>
            </span>
            <span className={styles.optionDesc}>
              Permite a los clientes pedir para consumir dentro de tu establecimiento.
            </span>
          </div>
        </div>

        {/* Takeout */}
        <div
          className={`${styles.optionCard} ${allowTakeout ? styles.optionCardActive : ""}`}
          onClick={() => setAllowTakeout(!allowTakeout)}
        >
          <ShoppingBag className={styles.optionIcon} size={20} />
          <div className={styles.optionContent}>
            <span className={styles.optionTitle}>
              Para Recoger (Takeout)
              <div className={`${styles.checkbox} ${allowTakeout ? styles.checkboxActive : ""}`}>
                {allowTakeout && <Check size={12} strokeWidth={3} />}
              </div>
            </span>
            <span className={styles.optionDesc}>
              El cliente puede armar su pedido para recogerlo físicamente en el local.
            </span>
          </div>
        </div>

        {/* Delivery */}
        <div
          className={`${styles.optionCard} ${allowDelivery ? styles.optionCardActive : ""}`}
          onClick={() => setAllowDelivery(!allowDelivery)}
        >
          <Bike className={styles.optionIcon} size={20} />
          <div className={styles.optionContent}>
            <span className={styles.optionTitle}>
              Domicilio (Delivery)
              <div className={`${styles.checkbox} ${allowDelivery ? styles.checkboxActive : ""}`}>
                {allowDelivery && <Check size={12} strokeWidth={3} />}
              </div>
            </span>
            <span className={styles.optionDesc}>
              El cliente ingresa su dirección de entrega para pedir domicilio a casa.
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Rules: Require Table QR for Dine-In & WhatsApp Ordering */}
      <div className={styles.advancedGrid} style={{ opacity: isMenuOnly ? 0.4 : 1, pointerEvents: isMenuOnly ? "none" : "auto" }}>
        {/* Strict Table QR Requirement */}
        <div
          className={`${styles.subRuleCard} ${requireTableQrForDineIn ? styles.subRuleCardActive : ""}`}
          onClick={() => setRequireTableQrForDineIn(!requireTableQrForDineIn)}
        >
          <QrCode size={18} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Exigir QR de Mesa para Pedir en Local</span>
              <input type="checkbox" checked={requireTableQrForDineIn} onChange={() => {}} />
            </div>
            <p style={{ fontSize: "0.775rem", color: "#64748B", marginTop: 2 }}>
              Solo se podrá hacer pedidos en mesa si el cliente escaneó el QR físico de una mesa.
            </p>
          </div>
        </div>

        {/* WhatsApp Ordering Redirect */}
        <div
          className={`${styles.subRuleCard} ${allowWhatsAppOrdering ? styles.subRuleCardActive : ""}`}
        >
          <MessageSquare size={18} style={{ color: "#25D366" }} />
          <div style={{ flex: 1 }}>
            <div
              style={{ fontWeight: 600, fontSize: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => setAllowWhatsAppOrdering(!allowWhatsAppOrdering)}
            >
              <span>Enviar Pedidos a WhatsApp</span>
              <input type="checkbox" checked={allowWhatsAppOrdering} onChange={() => {}} />
            </div>
            <p style={{ fontSize: "0.775rem", color: "#64748B", marginTop: 2 }}>
              El botón de confirmación formateará el pedido y abrirá WhatsApp directamente.
            </p>

            {allowWhatsAppOrdering && (
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                  Número de WhatsApp del Restaurante (con código de país):
                </label>
                <input
                  type="text"
                  placeholder="Ej. +573001234567"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    fontSize: "0.825rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    marginTop: 4,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
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
            <>Guardar Ajustes de Canales</>
          )}
        </button>
      </div>
    </div>
  );
}
