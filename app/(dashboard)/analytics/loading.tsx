import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

export default function AnalyticsLoading() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <Skeleton variant="text" width={260} height={32} />
            <Skeleton variant="rounded" width={120} height={24} />
          </div>
          <Skeleton variant="text" width={420} height={16} style={{ marginTop: 6 }} />
        </div>
      </div>

      {/* Grid: Rendimiento Operativo & Recomendaciones IA */}
      <div className={styles.grid}>
        {/* Card 1: Rendimiento Operativo */}
        <div className={styles.card}>
          <Skeleton variant="text" width={180} height={22} style={{ marginBottom: 16 }} />
          <div className={styles.statsList}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.statRow}>
                <Skeleton variant="text" width={160} height={16} />
                <Skeleton variant="text" width={90} height={18} />
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Recomendaciones IA */}
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <Skeleton variant="text" width={180} height={22} />
            <Skeleton variant="rounded" width={110} height={22} />
          </div>
          <div className={styles.aiInsights}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.insightItem}>
                <div style={{ width: "100%" }}>
                  <Skeleton variant="text" width={180} height={16} style={{ marginBottom: 6 }} />
                  <Skeleton variant="text" width="90%" height={14} style={{ marginBottom: 4 }} />
                  <Skeleton variant="text" width="70%" height={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
