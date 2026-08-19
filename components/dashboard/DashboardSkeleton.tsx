import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./DashboardSkeleton.module.css";

export function DashboardSkeleton() {
  return (
    <div className={styles.page}>
      {/* Header Skeleton */}
      <div className={styles.header}>
        <div>
          <Skeleton variant="text" width={220} height={28} style={{ marginBottom: 8 }} />
          <Skeleton variant="text" width={160} height={16} />
        </div>
        <Skeleton variant="rounded" width={140} height={40} />
      </div>

      {/* Metrics / Stats Cards Grid */}
      <div className={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.statCard}>
            <Skeleton variant="circular" width={48} height={48} />
            <div style={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton variant="text" width="40%" height={24} style={{ marginBottom: 4 }} />
              <Skeleton variant="text" width="75%" height={12} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className={styles.section}>
        <Skeleton variant="text" width={180} height={22} style={{ marginBottom: 8 }} />
        <div className={styles.cardsGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.statCard} style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: 12 }}>
                <Skeleton variant="text" width={100} height={18} />
                <Skeleton variant="rounded" width={60} height={20} />
              </div>
              <Skeleton variant="text" width="80%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton variant="text" width="50%" height={14} style={{ marginBottom: 12 }} />
              <Skeleton variant="text" width="30%" height={20} />
            </div>
          ))}
        </div>
      </div>

      {/* Table List Skeleton */}
      <div className={styles.section}>
        <div className={styles.tableList}>
          <Skeleton variant="text" width={150} height={20} style={{ marginBottom: 12 }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.tableRow}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Skeleton variant="circular" width={28} height={28} />
                <Skeleton variant="text" width={120} height={16} />
              </div>
              <Skeleton variant="text" width={80} height={16} />
              <Skeleton variant="rounded" width={90} height={28} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
