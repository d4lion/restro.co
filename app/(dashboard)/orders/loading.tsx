import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

export default function OrdersLoading() {
  const columns = [
    { title: "NUEVOS", headerStyle: styles["col--pending"] },
    { title: "EN COCINA", headerStyle: styles["col--preparing"] },
    { title: "LISTOS PARA SERVIR", headerStyle: styles["col--ready"] },
    { title: "HISTORIAL RECIENTE", headerStyle: styles["col--delivered"] },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Skeleton variant="text" width={280} height={32} style={{ marginBottom: 6 }} />
          <Skeleton variant="text" width={380} height={16} />
        </div>
      </div>

      {/* Kanban Columns */}
      <div className={styles.kanban}>
        {columns.map((col, index) => (
          <div key={index} className={styles.column}>
            <div className={`${styles.columnHeader} ${col.headerStyle}`}>
              <Skeleton variant="text" width={110} height={16} />
            </div>
            <div className={styles.cardsList}>
              {[1, 2].map((cardIndex) => (
                <div key={cardIndex} className={styles.card}>
                  <div className={styles.cardTop}>
                    <Skeleton variant="text" width={60} height={18} />
                    <Skeleton variant="rounded" width={70} height={18} />
                  </div>
                  <Skeleton variant="text" width="60%" height={14} />
                  <div className={styles.itemsList}>
                    <Skeleton variant="text" width="90%" height={14} style={{ marginBottom: 4 }} />
                    <Skeleton variant="text" width="70%" height={14} />
                  </div>
                  <div className={styles.cardBottom}>
                    <Skeleton variant="text" width={60} height={16} />
                    <Skeleton variant="rounded" width={90} height={28} />
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
