"use client";

import React, { useState, useTransition } from "react";
import { LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logoutAction } from "@/app/actions/settings";
import styles from "./LogoutCard.module.css";

export function LogoutCard() {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      toast.loading("Cerrando sesión…", { id: "logout" });
      await logoutAction();
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          <LogOut size={18} strokeWidth={2} />
        </div>
        <div>
          <h2 className={styles.cardTitle}>Cerrar Sesión</h2>
          <p className={styles.cardSub}>
            Se cerrará tu sesión en este dispositivo.
          </p>
        </div>
      </div>

      {!confirming ? (
        <button
          type="button"
          className={styles.triggerBtn}
          onClick={() => setConfirming(true)}
        >
          <LogOut size={15} strokeWidth={2} />
          Cerrar Sesión
        </button>
      ) : (
        <div className={styles.confirmBox}>
          <div className={styles.confirmHeader}>
            <AlertTriangle size={16} strokeWidth={2} className={styles.warnIcon} />
            <p className={styles.confirmText}>
              ¿Estás seguro que deseas cerrar sesión?
            </p>
          </div>
          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.keepBtn}
              onClick={() => setConfirming(false)}
              disabled={isPending}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 size={14} strokeWidth={2.5} className={styles.spin} />
                  Saliendo…
                </>
              ) : (
                <>
                  <LogOut size={14} strokeWidth={2} />
                  Sí, cerrar sesión
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
