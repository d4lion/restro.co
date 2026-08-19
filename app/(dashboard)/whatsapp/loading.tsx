import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

export default function WhatsappLoading() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <Skeleton variant="text" width={260} height={32} />
            <Skeleton variant="rounded" width={130} height={24} />
          </div>
          <Skeleton variant="text" width={420} height={16} style={{ marginTop: 6 }} />
        </div>
      </div>

      {/* Banner Skeleton */}
      <div className={styles.banner}>
        <Skeleton variant="text" width={240} height={20} style={{ marginBottom: 8 }} />
        <Skeleton variant="text" width="80%" height={14} />
      </div>

      {/* 2 Column Grid */}
      <div className={styles.grid}>
        {/* Card 1: Steps */}
        <div className={styles.card}>
          <Skeleton variant="text" width={200} height={20} style={{ marginBottom: 20 }} />
          <div className={styles.stepsList}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.step}>
                <Skeleton variant="rounded" width={28} height={28} style={{ borderRadius: 6 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width={160} height={16} style={{ marginBottom: 4 }} />
                  <Skeleton variant="text" width="90%" height={13} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: QR Box & Waitlist */}
        <div className={styles.card}>
          <Skeleton variant="text" width={180} height={20} style={{ marginBottom: 20 }} />
          <div className={styles.qrPlaceholderBox}>
            <Skeleton variant="rounded" width={64} height={64} style={{ borderRadius: 8 }} />
            <Skeleton variant="rounded" width={120} height={22} />
            <Skeleton variant="text" width={180} height={14} />
          </div>
          <div className={styles.waitlistForm}>
            <Skeleton variant="text" width={200} height={16} />
            <Skeleton variant="rounded" width="100%" height={40} />
            <Skeleton variant="rounded" width="100%" height={40} />
          </div>
        </div>
      </div>
    </div>
  );
}
