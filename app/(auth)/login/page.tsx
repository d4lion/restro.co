"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success && state?.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state]);

  return (
    <div className={styles.page}>
      {/* Background gradient */}
      <div className={styles.bg} aria-hidden="true" />

      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="#E11D48" />
              <path d="M10 28L20 12L30 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 22H25" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <span className={styles.logoText}>Restro</span>
        </div>

        {/* Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Bienvenido de nuevo</h1>
            <p className={styles.cardSub}>Ingresa a tu panel de gestión</p>
          </div>

          <form action={action} className={styles.form}>
            <Input
              label="Email"
              type="email"
              name="email"
              id="login-email"
              placeholder="tu@email.com"
              autoComplete="email"
              required
              error={state?.errors?.email?.[0]}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              }
            />

            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              name="password"
              id="login-password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              error={state?.errors?.password?.[0]}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                  aria-label="Mostrar contraseña"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              }
            />

            {state?.message && (
              <div className={styles.errorAlert}>{state.message}</div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={pending || (state?.success ?? false)}
              id="login-submit-btn"
            >
              {state?.success ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              ¿No tienes cuenta?{" "}
              <Link href="/register" className={styles.footerLink}>
                Registra tu restaurante gratis
              </Link>
            </p>
          </div>

          {/* Dev hint */}
          {process.env.NODE_ENV === "development" && (
            <div className={styles.devHint}>
              <span>🔧 Dev:</span> admin@restro.dev · restro123
            </div>
          )}
        </div>

        <p className={styles.poweredBy}>
          Powered by{" "}
          <a href="https://adamind.cloud" target="_blank" rel="noopener noreferrer" className={styles.adamindLink}>
            Adamind
          </a>
        </p>
      </div>
    </div>
  );
}
