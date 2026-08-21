import React from "react";
import { AlertTriangle, Clock } from "lucide-react";
import styles from "./UrgentAlerts.module.css";

interface AlertItem {
  id: string;
  title: string;
  description: string;
  type: "warning" | "danger" | "info";
  time: string;
}

export function UrgentAlerts({ alerts }: { alerts: AlertItem[] }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <AlertTriangle size={18} color="#DC2626" /> Notificaciones de Urgencia
      </h3>
      <div className={styles.list}>
        {alerts.map((alert) => (
          <div key={alert.id} className={`${styles.alertCard} ${styles[`alert--${alert.type}`]}`}>
            <div className={styles.alertContent}>
              <span className={styles.alertTitle}>{alert.title}</span>
              <span className={styles.alertDesc}>{alert.description}</span>
            </div>
            <div className={styles.alertTime}>
              <Clock size={12} /> {alert.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
