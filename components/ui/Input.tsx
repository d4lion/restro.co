import React from "react";
import styles from "./Input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  icon,
  iconRight,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {props.required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={`${styles.inputWrapper} ${error ? styles["inputWrapper--error"] : ""}`}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          id={inputId}
          className={[styles.input, icon ? styles["input--withIcon"] : "", iconRight ? styles["input--withIconRight"] : "", className].filter(Boolean).join(" ")}
          {...props}
        />
        {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {props.required && <span className={styles.required}>*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        className={`${styles.textarea} ${error ? styles["textarea--error"] : ""}`}
        {...props}
      />
      {error && <p className={styles.error}>{error}</p>}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
