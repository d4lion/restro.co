"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Check, Eye, EyeOff, Sparkles } from "lucide-react";
import styles from "./page.module.css";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (state?.success && state?.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Split Card */}
        <div className={styles.card}>
          
          {/* ── Left Column: Form ────────────────────────────────────────── */}
          <div className={styles.leftCol}>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>Bienvenido de nuevo</h1>
              <p className={styles.subtitle}>
                Ingresa a tu panel de control de <span className={styles.subtitleHighlight}>Restro</span> para gestionar tu negocio.
              </p>
            </div>

            {/* Google Sign In Option */}
            <button 
              type="button" 
              className={styles.googleBtn}
              onClick={() => alert("Autenticación con Google activada en tu dominio en producción.")}
            >
              <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continuar con Google</span>
            </button>

            <div className={styles.divider}>
              <span>o</span>
            </div>

            <form action={action} className={styles.form}>
              <Input
                label="Correo electrónico"
                type="email"
                name="email"
                id="login-email"
                placeholder="tu@restaurante.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={state?.errors?.email?.[0]}
              />

              <Input
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                name="password"
                id="login-password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={state?.errors?.password?.[0]}
                iconRight={
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                className={styles.submitBtn}
              >
                {state?.success ? "Ingresando..." : "Iniciar sesión"}
              </Button>
            </form>

            <div className={styles.footerRow}>
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className={styles.registerLink}>
                Registra tu restaurante gratis
              </Link>
            </div>
          </div>

          {/* ── Right Column: Masterpiece Artwork Panel ─────────────────── */}
          <div className={styles.rightCol}>
            <div className={styles.artOverlay} />
            <div className={styles.artContent}>
              <div className={styles.artBadge}>
                <Sparkles size={14} /> Ecosistema Restro
              </div>
              <ul className={styles.artFeatureList}>
                <li className={styles.artFeatureItem}>
                  <span className={styles.artCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                  <span>Gestiona tu carta digital en tiempo real</span>
                </li>
                <li className={styles.artFeatureItem}>
                  <span className={styles.artCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                  <span>Recibe pedidos directo por WhatsApp y KDS</span>
                </li>
                <li className={styles.artFeatureItem}>
                  <span className={styles.artCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                  <span>Métricas y reportes de ventas al instante</span>
                </li>
                <li className={styles.artFeatureItem}>
                  <span className={styles.artCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                  <span>Automatiza tu atención con Restro IA</span>
                </li>
                <li className={styles.artFeatureItem}>
                  <span className={styles.artCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                  <span>Control de mesas e inventario sin complicaciones</span>
                </li>
              </ul>
            </div>
          </div>

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
