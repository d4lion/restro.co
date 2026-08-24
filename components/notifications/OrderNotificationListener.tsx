"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeToKdsOrders } from "@/hooks/useKdsRealtime";
import { Bell, ArrowRight, X } from "lucide-react";
import styles from "./OrderNotificationListener.module.css";

interface NotificationItem {
  id: string;
  orderNumber: number;
  customerName?: string | null;
  type?: string;
  createdAt: string;
}

interface OrderNotificationListenerProps {
  tenantId: string;
}

export function OrderNotificationListener({ tenantId }: OrderNotificationListenerProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [enabled, setEnabled] = useState(true);

  // Load notification preferences from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const storedEnabled = localStorage.getItem("restro_notifications_enabled");
      if (storedEnabled !== null) setEnabled(storedEnabled === "true");
    };

    loadSettings();

    // Listen for custom settings update events dispatched by Settings Page
    const handleSettingsUpdate = () => loadSettings();
    window.addEventListener("restro-notification-settings-updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("restro-notification-settings-updated", handleSettingsUpdate);
    };
  }, []);

  // Play audio sound using official /sounds/kds-notification.mp3
  const playKdsSound = () => {
    try {
      const audio = new Audio("/sounds/kds-notification.mp3");
      audio.volume = 0.85;
      audio.play().catch((e) => {
        console.log("Audio playback prevented by browser:", e);
      });
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  // Subscribe to Supabase Realtime Orders Channel globally across all dashboard pages
  useEffect(() => {
    if (!tenantId) return;

    const unsubscribe = subscribeToKdsOrders(
      tenantId,
      (msg) => {
        if (!msg) return;

        console.log("[OrderNotificationListener] Realtime order payload received:", msg);

        // Robust check for NEW orders (INSERT event on Order table or missing old_record)
        const isOrderTable = !msg.table || msg.table === "Order";
        const isInsert =
          msg.event === "INSERT" ||
          msg.type === "INSERT" ||
          msg.operation === "INSERT" ||
          (msg.record?.id && !msg.old_record);

        if (isOrderTable && isInsert) {
          const record = msg.record || msg;
          if (!record) return;

          // Check if visual notifications and sound are enabled in settings
          const isEnabled = localStorage.getItem("restro_notifications_enabled") !== "false";
          const isSoundOn = localStorage.getItem("restro_notifications_sound") !== "false";

          if (!isEnabled) return;

          // Play KDS Notification MP3 Sound
          if (isSoundOn) {
            playKdsSound();
          }

          // Add to notification stack (keep latest 5)
          const newNotif: NotificationItem = {
            id: record.id || String(Date.now()),
            orderNumber: record.orderNumber || 0,
            customerName: record.customerName || null,
            type: record.type || "DINE_IN",
            createdAt: record.createdAt || new Date().toISOString(),
          };

          setNotifications((prev) => {
            // Avoid duplicate toast for same order ID
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev.slice(0, 4)];
          });
        }
      },
      (status) => {
        console.log(`[OrderNotificationListener] Channel status for tenant ${tenantId}:`, status);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [tenantId]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNavigateToOrders = (id: string) => {
    dismissNotification(id);
    router.push("/orders");
  };

  if (!enabled || notifications.length === 0) {
    return <div className={styles.toastContainer} style={{ display: "none" }} />;
  }

  return (
    <div className={styles.toastContainer}>
      {notifications.map((notif) => (
        <div key={notif.id} className={styles.toastCard}>
          {/* Header */}
          <div className={styles.toastHeader}>
            <div className={styles.toastTitleGroup}>
              <Bell size={16} color="#38BDF8" />
              <span className={styles.toastTitle}>¡Nueva Orden Recibida!</span>
              <span className={styles.toastBadge}>NUEVO</span>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => dismissNotification(notif.id)}
              aria-label="Cerrar notificación"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className={styles.toastBody}>
            <div className={styles.orderMeta}>
              <span>Comanda #{notif.orderNumber}</span>
            </div>
            {notif.customerName && (
              <div className={styles.customerSub}>
                Cliente: {notif.customerName}
              </div>
            )}
          </div>

          {/* Call To Action Button */}
          <button
            className={styles.ctaBtn}
            onClick={() => handleNavigateToOrders(notif.id)}
          >
            <span>Ver Comanda en Cocina</span>
            <ArrowRight size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
