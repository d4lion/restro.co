"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Check, MailCheck, Eye, EyeOff, Sparkles } from "lucide-react";
import { CountryPhoneInput } from "@/components/ui/CountryPhoneInput";
import styles from "./register.module.css";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined);
  
  // Form fields
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Field touched states (onBlur tracking)
  const [restaurantNameTouched, setRestaurantNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  // UI Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Client Validation Logic
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const getRestaurantNameError = () => {
    if (!restaurantNameTouched && !state?.errors?.restaurantName) return undefined;
    if (!restaurantName.trim()) return "El nombre de tu negocio es requerido.";
    return state?.errors?.restaurantName?.[0];
  };

  const getEmailError = () => {
    if (!emailTouched && !state?.errors?.email) return undefined;
    if (!email.trim()) return "El correo electrónico es requerido.";
    if (!emailRegex.test(email)) return "Ingresa un correo electrónico válido (ej. tu@restaurante.com).";
    return state?.errors?.email?.[0];
  };

  const getPasswordError = () => {
    if (!passwordTouched && !state?.errors?.password) return undefined;
    if (!password) return "La contraseña es requerida.";
    if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    return state?.errors?.password?.[0];
  };

  const getConfirmPasswordError = () => {
    if (!confirmPasswordTouched) return undefined;
    if (!confirmPassword) return "Confirma tu contraseña.";
    if (confirmPassword !== password) return "Las contraseñas no coinciden.";
    return undefined;
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Touch all fields to show any existing errors
    setRestaurantNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    const hasNameError = !restaurantName.trim();
    const hasEmailError = !email.trim() || !emailRegex.test(email);
    const hasPasswordError = !password || password.length < 6;
    const hasConfirmPasswordError = confirmPassword !== password;

    if (hasNameError || hasEmailError || hasPasswordError || hasConfirmPasswordError || !isPhoneValid) {
      e.preventDefault();
      return;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          
          {/* ── Left Column: Form ────────────────────────────────────────── */}
          <div className={styles.leftCol}>
            {state?.success && !state?.redirectUrl ? (
              /* Success / Email Confirmation Screen */
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "center", padding: "32px 0" }}>
                <div style={{ margin: "0 auto", width: "64px", height: "64px", borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MailCheck size={36} strokeWidth={1.8} />
                </div>
                <h1 className={styles.title} style={{ fontSize: "26px" }}>¡Revisa tu correo!</h1>
                <p className={styles.subtitle} style={{ fontSize: "15px", lineHeight: "1.6" }}>
                  {state.message || "Te hemos enviado un correo de confirmación. Por favor revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta y comenzar."}
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
                  <h1 className={styles.title}>Regístrate en Restro y recibe pedidos en minutos</h1>
                  <p className={styles.subtitle}>
                    Más de <span className={styles.subtitleHighlight}>+120 negocios gastronómicos</span> ya venden con Restro.
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

                <form action={action} onSubmit={handleFormSubmit} className={styles.form}>
                  
                  {/* Hidden field bound to name required by Auth schema */}
                  <input type="hidden" name="name" value={restaurantName || "Administrador"} />
                  <input type="hidden" name="slug" value={slug || "tu-restaurante"} />

                  {/* Nombre de tu negocio */}
                  <Input
                    label="Nombre de tu negocio"
                    type="text"
                    name="restaurantName"
                    id="register-restaurant-name"
                    value={restaurantName}
                    onChange={handleRestaurantNameChange}
                    onBlur={() => setRestaurantNameTouched(true)}
                    placeholder="Ej. Hamburguesas Don Carlos"
                    required
                    error={getRestaurantNameError()}
                  />

                  {/* Correo electrónico */}
                  <Input
                    label="Correo electrónico"
                    type="email"
                    name="email"
                    id="register-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="tu@restaurante.com"
                    required
                    error={getEmailError()}
                  />

                  {/* Número de WhatsApp con Picker de País & Buscador & Validaciones */}
                  <div className={styles.selectWrapper}>
                    <label className={styles.fieldLabel} htmlFor="register-whatsapp">
                      Número de WhatsApp
                    </label>
                    <CountryPhoneInput
                      defaultCountry="CO"
                      required
                      onValidationChange={(valid) => setIsPhoneValid(valid)}
                    />
                  </div>

                  {/* Pedidos al mes (Opcional) */}
                  <div className={styles.selectWrapper}>
                    <label className={styles.fieldLabel} htmlFor="register-monthly-orders">
                      Pedidos al mes <span className={styles.optionalTag}>(Opcional)</span>
                    </label>
                    <select
                      id="register-monthly-orders"
                      name="monthlyOrders"
                      className={styles.selectInput}
                      defaultValue="none"
                    >
                      <option value="none">No tengo pedidos aún</option>
                      <option value="1-100">1 a 100 pedidos al mes</option>
                      <option value="101-500">101 a 500 pedidos al mes</option>
                      <option value="500+">Más de 500 pedidos al mes</option>
                    </select>
                  </div>

                  {/* Contraseña & Confirmar contraseña */}
                  <div className={styles.gridRow}>
                    <Input
                      label="Contraseña nueva"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="register-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setPasswordTouched(true)}
                      placeholder="••••••••"
                      required
                      error={getPasswordError()}
                      iconRight={
                        <button
                          type="button"
                          className={styles.eyeBtn}
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />

                    <Input
                      label="Confirma tu contraseña"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      id="register-confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => setConfirmPasswordTouched(true)}
                      placeholder="••••••••"
                      required
                      error={getConfirmPasswordError()}
                      iconRight={
                        <button
                          type="button"
                          className={styles.eyeBtn}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                  </div>

                  {state?.message && (
                    <div className={styles.errorAlert}>{state.message}</div>
                  )}

                  {/* Checkbox Terms */}
                  <div className={styles.termsRow}>
                    <input
                      type="checkbox"
                      id="register-terms"
                      className={styles.checkbox}
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      required
                    />
                    <label htmlFor="register-terms" className={styles.termsLabel}>
                      Acepto los <a href="/terms" className={styles.termsLink}>términos y condiciones</a> y la <a href="/privacy" className={styles.termsLink}>política de privacidad</a> de Restro.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={pending || (state?.success ?? false)}
                    id="register-submit-btn"
                    className={styles.submitBtn}
                    disabled={!acceptedTerms}
                  >
                    {state?.success ? "Creando cuenta..." : "Crear cuenta"}
                  </Button>
                </form>

                <div className={styles.footerLoginRow}>
                  ¿Ya tienes una cuenta?{" "}
                  <Link href="/login" className={styles.loginLink}>
                    Iniciar sesión
                  </Link>
                </div>
              </>
            )}
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
                  <span>Crea tu menú digital en segundos</span>
                </li>
                <li className={styles.artFeatureItem}>
                  <span className={styles.artCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                  <span>Recibe pedidos directo por WhatsApp</span>
                </li>
                <li className={styles.artFeatureItem}>
                  <span className={styles.artCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                  <span>Herramientas avanzadas de gestión y análisis</span>
                </li>
                <li className={styles.artFeatureItem}>
                  <span className={styles.artCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                  <span>Automatiza tu atención con Restro IA</span>
                </li>
                <li className={styles.artFeatureItem}>
                  <span className={styles.artCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                  <span>Controla tu inventario en tiempo real</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
