"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Users, MailCheck } from "lucide-react";
import styles from "./register.module.css";

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
      <div className={styles.container}>
        <div className={styles.card}>
          
          {/* ── Left Column ─────────────────────────────────── */}
          <div className={styles.leftCol}>
            {state?.success && !state?.redirectUrl ? (
              /* Success / Confirmation Email Screen */
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "center", padding: "20px 0" }}>
                <div style={{ margin: "0 auto", width: "64px", height: "64px", borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MailCheck size={36} strokeWidth={1.8} />
                </div>
                <h1 className={styles.title} style={{ fontSize: "26px" }}>¡Revisa tu correo!</h1>
                <p className={styles.subtitle} style={{ fontSize: "15px", lineHeight: "1.6" }}>
                  {state.message || "Te hemos enviado un correo de confirmación. Por favor revisa tu bandeja de entrada y haz clic en el botón para verificar tu cuenta y comenzar el onboarding."}
                </p>
                <div style={{ marginTop: "16px" }}>
                  <Link href="/login" style={{ width: "100%" }}>
                    <Button variant="primary" size="lg" fullWidth>
                      Ir a Iniciar Sesión
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <>
                <div className={styles.cardHeader}>
                  <h1 className={styles.title}>Crea tu cuenta en Restro</h1>
                  <p className={styles.subtitle}>
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/login" className={styles.link}>
                      Iniciar sesión
                    </Link>
                  </p>
                </div>

                <form action={action} className={styles.form}>
                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    id="register-email"
                    placeholder="ingresa_tu_email@ejemplo.com"
                    required
                    error={state?.errors?.email?.[0]}
                  />

                  <div className={styles.gridRow}>
                    <Input
                      label="Tu Nombre"
                      type="text"
                      name="name"
                      id="register-name"
                      placeholder="Carlos Gómez"
                      required
                      error={state?.errors?.name?.[0]}
                    />

                    <Input
                      label="Restaurante"
                      type="text"
                      name="restaurantName"
                      id="register-restaurant-name"
                      value={restaurantName}
                      onChange={handleRestaurantNameChange}
                      placeholder="Don Carlos"
                      required
                      error={state?.errors?.restaurantName?.[0]}
                    />
                  </div>

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
                    label="Enlace de tu carta QR (Slug)"
                    type="text"
                    name="slug"
                    id="register-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="don-carlos"
                    hint={`restro.adamind.cloud/${slug || "tu-restaurante"}`}
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
                    className={styles.submitBtn}
                  >
                    {state?.success ? "Creando tu cuenta..." : "Crear mi cuenta"}
                  </Button>
                </form>

                <p className={styles.termsText}>
                  Al registrarte, aceptas nuestros Términos de Servicio y Política de Privacidad.
                </p>

                <div className={styles.divider}>
                  <span>¿Necesitas ayuda?</span>
                </div>

                <a
                  href="https://wa.me/573000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.supportBtn}
                >
                  <Users size={16} /> Soporte en vivo
                </a>
              </>
            )}
          </div>

          {/* ── Right Column: Dark Testimonial Panel ───────── */}
          <div className={styles.rightCol}>
            <div className={styles.quoteContent}>
              <p className={styles.quoteText}>
                ¡Desplegamos Restro en producción para atender más de <span className={styles.quoteHighlight}>+5.000 pedidos al mes</span>! En minutos, la cocina y los meseros trabajan 100% sincronizados.
              </p>

              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>CM</div>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>Carlos Mendoza</span>
                  <span className={styles.authorTitle}>Restaurante El Leñador · Cliente Restro desde 2024</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
