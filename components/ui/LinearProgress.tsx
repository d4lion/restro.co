"use client";

import React from "react";
import styles from "./LinearProgress.module.css";

export interface LinearProgressProps {
  indeterminate?: boolean;
  value?: number; // 0 to 100 for determinate mode
  variant?: "brand" | "teal" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}

export function LinearProgress({
  indeterminate = true,
  value = 0,
  variant = "brand",
  size = "md",
  className = "",
  style,
}: LinearProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : clampedValue}
      className={[
        styles.container,
        styles[`container--${size}`],
        styles[`container--${variant}`],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {indeterminate ? (
        <div className={styles.indeterminateTrack} />
      ) : (
        <div
          className={styles.determinateFill}
          style={{ width: `${clampedValue}%` }}
        />
      )}
    </div>
  );
}
