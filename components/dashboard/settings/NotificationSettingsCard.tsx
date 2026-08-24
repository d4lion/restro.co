"use client";

import React, { useState, useEffect } from "react";
import { Bell, Volume2, VolumeX, CheckCircle, Sparkles } from "lucide-react";
import styles from "@/app/(dashboard)/settings/page.module.css";
import { toast } from "sonner";

export function NotificationSettingsCard() {
  const [enabled, setEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const storedEnabled = localStorage.getItem("restro_notifications_enabled");
    const storedSound = localStorage.getItem("restro_notifications_sound");
    if (storedEnabled !== null) setEnabled(storedEnabled === "true");
    if (storedSound !== null) setSoundEnabled(storedSound === "true");
  }, []);

  const handleToggleEnabled = (val: boolean) => {
    setEnabled(val);
    localStorage.setItem("restro_notifications_enabled", String(val));
    window.dispatchEvent(new CustomEvent("restro-notification-settings-updated"));
    toast.success(val ? "Notificaciones visuales activadas" : "Notificaciones visuales silenciadas");
  };

  const handleToggleSound = (val: boolean) => {
    setSoundEnabled(val);
    localStorage.setItem("restro_notifications_sound", String(val));
    window.dispatchEvent(new CustomEvent("restro-notification-settings-updated"));
    toast.success(val ? "Sonido de campana activado" : "Sonido de campana silenciado");
  };

  const playTestChime = () => {
    try {
      const audio = new Audio("/sounds/kds-notification.mp3");
      audio.volume = 0.85;
      audio.play().then(() => {
        toast.info("🔔 Sonido de campana probado con éxito");
      }).catch((e) => {
        toast.error("El navegador bloqueó la reproducción automática de audio. Haz clic de nuevo.");
      });
    } catch (err) {
      toast.error("No se pudo reproducir el sonido en este navegador");
    }
  };

  return (
    <div className={styles.card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={20} color="#2563EB" />
          <h2 className={styles.cardTitle} style={{ margin: 0 }}>
            Notificaciones y Alertas de Comandas
          </h2>
        </div>
        <button
          type="button"
          onClick={playTestChime}
          style={{
            background: "#EFF6FF",
            color: "#2563EB",
            border: "1px solid #BFDBFE",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Volume2 size={14} /> Probar Campana
        </button>
      </div>

      <p className={styles.cardSub}>
        Configura cómo deseas recibir los avisos sonoros y visuales cuando un cliente o mesero envíe una comanda nueva.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
        {/* Toggle 1: Visual Toasts */}
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: "#F8FAFC", padding: "12px 14px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0F172A" }}>
              Alertas emergentes en pantalla (Toasts)
            </div>
            <div style={{ fontSize: "0.775rem", color: "#64748B" }}>
              Muestra un aviso deslizable en la parte superior derecha de la pantalla al recibir un pedido.
            </div>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggleEnabled(e.target.checked)}
            style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#2563EB" }}
          />
        </label>

        {/* Toggle 2: Sound Chime */}
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: "#F8FAFC", padding: "12px 14px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
              {soundEnabled ? <Volume2 size={16} color="#16A34A" /> : <VolumeX size={16} color="#DC2626" />}
              Sonido de campana sonoro
            </div>
            <div style={{ fontSize: "0.775rem", color: "#64748B" }}>
              Reproduce un tono de campana de dos tonos cuando ingresa una comanda.
            </div>
          </div>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => handleToggleSound(e.target.checked)}
            style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#2563EB" }}
          />
        </label>
      </div>
    </div>
  );
}
