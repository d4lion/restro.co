import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

export default function SettingsLoading() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Skeleton variant="text" width={260} height={32} style={{ marginBottom: 6 }} />
          <Skeleton variant="text" width={440} height={16} />
        </div>
      </div>

      {/* Restaurant Profile Card Skeleton */}
      <div className={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Skeleton variant="text" width={180} height={22} />
          <Skeleton variant="rounded" width={90} height={36} />
        </div>

        <div className={styles.form}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <Skeleton variant="circular" width={64} height={64} />
            <div>
              <Skeleton variant="text" width={140} height={16} style={{ marginBottom: 4 }} />
              <Skeleton variant="text" width={180} height={12} />
            </div>
          </div>

          <div className={styles.formRow}>
            <Skeleton variant="rounded" width="100%" height={40} />
            <Skeleton variant="rounded" width="100%" height={40} />
          </div>
          <div className={styles.formRow}>
            <Skeleton variant="rounded" width="100%" height={40} />
            <Skeleton variant="rounded" width="100%" height={40} />
          </div>
          <Skeleton variant="rounded" width="100%" height={80} />
        </div>
      </div>

      {/* Subscription Plans Card Skeleton */}
      <div className={styles.card}>
        <Skeleton variant="text" width={220} height={22} style={{ marginBottom: 6 }} />
        <Skeleton variant="text" width={320} height={14} style={{ marginBottom: 20 }} />

        <div className={styles.plansGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.planCard}>
              <Skeleton variant="text" width={80} height={20} />
              <Skeleton variant="text" width={110} height={28} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0", flex: 1 }}>
                <Skeleton variant="text" width="90%" height={14} />
                <Skeleton variant="text" width="80%" height={14} />
                <Skeleton variant="text" width="85%" height={14} />
                <Skeleton variant="text" width="70%" height={14} />
              </div>
              <Skeleton variant="rounded" width="100%" height={36} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
