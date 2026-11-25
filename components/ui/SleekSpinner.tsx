"use client";

import React from "react";
import styles from "./SleekSpinner.module.css";

export interface SleekSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | number;
  color?: "primary" | "neutral" | "dark" | "white" | "inherit";
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function SleekSpinner({
  size = "md",
  color = "inherit",
  strokeWidth = 1.75,
  className = "",
  style,
}: SleekSpinnerProps) {
  let pixelSize = 18;
  if (typeof size === "number") {
    pixelSize = size;
  } else {
    switch (size) {
      case "xs":
        pixelSize = 12;
        break;
      case "sm":
        pixelSize = 14;
        break;
      case "md":
        pixelSize = 18;
        break;
      case "lg":
        pixelSize = 24;
        break;
    }
  }

  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  // Arc showing ~28% of circle for a refined look
  const strokeDasharray = `${circumference * 0.72} ${circumference * 0.28}`;

  return (
    <span
      className={[styles.spinnerWrapper, styles[`color--${color}`], className]
        .filter(Boolean)
        .join(" ")}
      style={style}
      aria-hidden="true"
    >
      <svg
        className={styles.spinnerSvg}
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
      >
        {/* Subtle background track */}
        <circle
          className={styles.track}
          cx="12"
          cy="12"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        {/* Spinning indicator arc */}
        <circle
          className={styles.indicator}
          cx="12"
          cy="12"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
        />
      </svg>
    </span>
  );
}
