import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

export default function OverviewLoading() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Skeleton variant="text" width={240} height={32} style={{ marginBottom: 6 }} />
          <Skeleton variant="text" width={180} height={18} />
        </div>
        <Skeleton variant="rounded" width={140} height={40} />
      </div>

      {/* Stats Grid (4 Cards) */}
      <div className={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.statCard}>
            <Skeleton variant="rounded" width={40} height={40} style={{ borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={12} style={{ marginBottom: 6 }} />
              <Skeleton variant="text" width="45%" height={26} style={{ marginBottom: 4 }} />
              <Skeleton variant="text" width="80%" height={12} />
            </div>
          </div>
        ))}
      </div>

      {/* Comandas Recientes Section */}
      <section className={styles.section}>
        <Skeleton variant="text" width={180} height={22} />
        <div className={styles.ordersList}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <Skeleton variant="text" width={70} height={18} />
                <Skeleton variant="rounded" width={80} height={22} />
              </div>
              <Skeleton variant="text" width="60%" height={14} />
              <Skeleton variant="text" width="90%" height={16} style={{ margin: "4px 0" }} />
              <Skeleton variant="text" width={100} height={20} />
            </div>
          ))}
        </div>
      </section>

      {/* Estado de Mesas Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Skeleton variant="text" width={160} height={22} />
          <Skeleton variant="text" width={80} height={16} />
        </div>
        <div className={styles.tablesGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className={styles.tableCard}>
              <Skeleton variant="circular" width={10} height={10} />
              <Skeleton variant="text" width={60} height={16} />
              <Skeleton variant="text" width={40} height={12} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
