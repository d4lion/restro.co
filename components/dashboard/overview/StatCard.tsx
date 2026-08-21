import React from "react";
import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  colorKey?: "blue" | "teal" | "orange" | "slate";
  icon: React.ReactNode;
  sparklineData?: number[];
  bottomMetric?: React.ReactNode;
}

const STAT_COLORS = {
  blue:   { bg: "#EFF6FF", color: "#2563EB" },
  teal:   { bg: "#F0FDFA", color: "#0F766E" },
  orange: { bg: "#FFFBEB", color: "#D97706" },
  slate:  { bg: "#F1F5F9", color: "#475569" },
};

export function StatCard({ label, value, sub, colorKey = "blue", icon, sparklineData, bottomMetric }: StatCardProps) {
  const { bg, color } = STAT_COLORS[colorKey];

  return (
    <div className={styles.statCard}>
      <div className={styles.header}>
        <div className={styles.statIconBox} style={{ background: bg, color }}>
          {icon}
        </div>
        {sparklineData && (
          <div className={styles.sparkline}>
            <svg viewBox="0 0 100 30" width="80" height="24">
              <path
                d={`M0,${30 - sparklineData[0]} ${sparklineData.map((d, i) => `L${i * (100 / (sparklineData.length - 1))},${30 - d}`).join(" ")}`}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
      <div className={styles.content}>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
        {sub && <p className={styles.statSub}>{sub}</p>}
      </div>
      {bottomMetric && <div className={styles.bottomMetric}>{bottomMetric}</div>}
    </div>
  );
}
