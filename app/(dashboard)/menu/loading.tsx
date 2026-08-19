import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

export default function MenuLoading() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Skeleton variant="text" width={220} height={32} style={{ marginBottom: 6 }} />
          <Skeleton variant="text" width={320} height={16} />
        </div>
      </div>

      {/* Nueva Categoría Inline Card */}
      <div className={styles.card}>
        <Skeleton variant="text" width={160} height={20} style={{ marginBottom: 16 }} />
        <div className={styles.inlineForm}>
          <Skeleton variant="rounded" width="60%" height={40} />
          <Skeleton variant="rounded" width={140} height={40} />
        </div>
      </div>

      {/* Categories & Items List */}
      <div className={styles.categoriesList}>
        {[1, 2].map((catIndex) => (
          <div key={catIndex} className={styles.categoryCard}>
            {/* Category Header */}
            <div className={styles.categoryHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Skeleton variant="text" width={140} height={20} />
                <Skeleton variant="rounded" width={60} height={20} />
              </div>
              <Skeleton variant="rounded" width={32} height={32} />
            </div>

            {/* Items Grid */}
            <div className={styles.itemsGrid}>
              {[1, 2, 3].map((itemIndex) => (
                <div key={itemIndex} className={styles.itemRow}>
                  <div className={styles.itemMain}>
                    <Skeleton variant="rounded" width={36} height={36} style={{ borderRadius: 6 }} />
                    <div>
                      <Skeleton variant="text" width={130} height={16} style={{ marginBottom: 4 }} />
                      <Skeleton variant="text" width={200} height={12} />
                    </div>
                  </div>
                  <Skeleton variant="text" width={70} height={18} />
                  <div className={styles.itemActions}>
                    <Skeleton variant="rounded" width={80} height={28} style={{ borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
