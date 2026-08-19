"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import styles from "../login/page.module.css";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const [slug, setSlug] = useState("");
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    if (state?.success && state?.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state]);

  const handleRestaurantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRestaurantName(val);
    const autoSlug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    setSlug(autoSlug);
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden="true" />

      <div className={styles.container}>
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

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Registra tu Restaurante</h1>
            <p className={styles.cardSub}>Empieza gratis en menos de 2 minutos</p>
          </div>

          <form action={action} className={styles.form}>
            <Input
              label="Tu Nombre"
              type="text"
              name="name"
              id="register-name"
              placeholder="Ej. Carlos Gómez"
              required
              error={state?.errors?.name?.[0]}
            />

            <Input
              label="Email de acceso"
              type="email"
              name="email"
              id="register-email"
              placeholder="carlos@doncarlos.com"
              required
              error={state?.errors?.email?.[0]}
            />

            <Input
              label="Contraseña"
              type="password"
              name="password"
              id="register-password"
              placeholder="Mínimo 6 caracteres"
              required
              error={state?.errors?.password?.[0]}
            />

            <Input
              label="Nombre del Restaurante"
              type="text"
              name="restaurantName"
              id="register-restaurant-name"
              value={restaurantName}
              onChange={handleRestaurantNameChange}
              placeholder="Ej. La Parrilla de Don Carlos"
              required
              error={state?.errors?.restaurantName?.[0]}
            />

            <Input
              label="Enlace de tu carta QR"
              type="text"
              name="slug"
              id="register-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="don-carlos"
              hint={`URL: restro.adamind.cloud/${slug || "tu-restaurante"}`}
              required
              error={state?.errors?.slug?.[0]}
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
              id="register-submit-btn"
            >
              {state?.success ? "Creando tu cuenta..." : "Crear mi Restaurante Gratis"}
            </Button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className={styles.footerLink}>
                Inicia sesión aquí
              </Link>
            </p>
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
