import React from "react";
import styles from "./Card.module.css";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  glass = false,
  padding = "md",
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={[
        styles.card,
        glass ? styles["card--glass"] : "",
        styles[`card--pad-${padding}`],
        hover ? styles["card--hover"] : "",
        onClick ? styles["card--clickable"] : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${styles.header} ${className}`}>{children}</div>;
}

export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h3 className={`${styles.title} ${className}`}>{children}</h3>;
}

export function CardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${styles.content} ${className}`}>{children}</div>;
}
