import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({
  size = "md",
  label,
  fullPage = false,
}: LoadingSpinnerProps) {
  if (fullPage) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.logoMark}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="12" fill="#FF6B35" />
            <path d="M10 28L20 12L30 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 22H25" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        <div className={`${styles.spinner} ${styles["spinner--lg"]}`} role="status">
          <span className="sr-only">{label ?? "Cargando..."}</span>
        </div>
        {label && <p className={styles.label}>{label}</p>}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.spinner} ${styles[`spinner--${size}`]}`}
        role="status"
      >
        <span className="sr-only">{label ?? "Cargando..."}</span>
      </div>
      {label && <span className={styles.inlineLabel}>{label}</span>}
    </div>
  );
}
