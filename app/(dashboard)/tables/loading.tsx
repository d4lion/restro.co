import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

export default function TablesLoading() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Skeleton variant="text" width={260} height={32} style={{ marginBottom: 6 }} />
          <Skeleton variant="text" width={420} height={16} />
        </div>
      </div>

      {/* Agregar Nueva Mesa Inline Card */}
      <div className={styles.card}>
        <Skeleton variant="text" width={160} height={20} style={{ marginBottom: 16 }} />
        <div className={styles.inlineForm}>
          <Skeleton variant="rounded" width="40%" height={40} />
          <Skeleton variant="rounded" width="30%" height={40} />
          <Skeleton variant="rounded" width="20%" height={40} />
        </div>
      </div>

      {/* Tables Grid Section */}
      <div className={styles.tablesSection}>
        <Skeleton variant="text" width={180} height={22} style={{ marginBottom: 12 }} />
        <div className={styles.tablesGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <Skeleton variant="text" width={80} height={18} />
                <Skeleton variant="rounded" width={50} height={20} />
              </div>
              <Skeleton variant="text" width={60} height={14} />
              <div className={styles.qrFooter}>
                <Skeleton variant="rounded" width="100%" height={32} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
