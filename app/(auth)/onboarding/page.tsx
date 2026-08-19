"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { uploadImageAction } from "@/app/actions/storage";
import { saveOnboardingAction } from "@/app/actions/onboarding";
import { Check, Upload, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import styles from "./page.module.css";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);

  // Step 1: Restaurant info
  const [restaurantName, setRestaurantName] = useState("Mi Restaurante");
  const [slogan, setSlogan] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2: Branding & Logo
  const [brandColor, setBrandColor] = useState("#2563EB");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: First Menu Item
  const [categoryName, setCategoryName] = useState("Entradas");
  const [itemName, setItemName] = useState("Empanada Criolla");
  const [itemPrice, setItemPrice] = useState("4500");

  // Step 4: Final save state
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  /* ── Logo Upload Handler ─────────────────────────────────── */
  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El logo no debe superar los 5MB");
      return;
    }

    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadImageAction(formData, "logos");
    setIsUploadingLogo(false);

    if (res.publicUrl) {
      setLogoUrl(res.publicUrl);
      toast.success("Logo subido correctamente");
    } else {
      toast.error(res.error || "Error al subir el logo");
    }
  }

  /* ── Final Step Saver ────────────────────────────────────── */
  async function handleFinalizeOnboarding() {
    setIsSaving(true);
    const priceNum = parseFloat(itemPrice) || 0;

    const res = await saveOnboardingAction({
      restaurantName,
      slogan,
      phone,
      logoUrl: logoUrl || undefined,
      brandColor,
      categoryName,
      itemName,
      itemPrice: priceNum,
    });

    setIsSaving(false);

    if (res.success) {
      setIsSaved(true);
      setStep(4);
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Progress Header */}
        <div className={styles.progressHeader}>
          <span className={styles.stepBadge}>PASO {step} DE 4</span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* ── STEP 1: Datos del Local y Representante ───────────── */}
        {step === 1 && (
          <div className={styles.card}>
            <h1 className={styles.title}>Datos del Restaurante</h1>
            <p className={styles.subtitle}>
              Ingresa la información principal del establecimiento y teléfono del representante.
            </p>

            <div className={styles.formGroup}>
              <Input
                label="Nombre del Restaurante / Local *"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Ej. El Leñador Gourmet"
                required
              />

              <Input
                label="Eslogan o Descripción Corta"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ej. Tradición a la parrilla desde 1998"
              />

              <Input
                label="Teléfono del Representante *"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 3001234567"
                required
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!restaurantName.trim() || !phone.trim()}
              onClick={() => setStep(2)}
            >
              Continuar a Marca & Logo
            </Button>
          </div>
        )}

        {/* ── STEP 2: Marca y Carga de Logo ──────────────────────── */}
        {step === 2 && (
          <div className={styles.card}>
            <h2 className={styles.title}>Identidad & Logo del Local</h2>
            <p className={styles.subtitle}>
              Carga el logo del restaurante (máx 5MB) y elige el color principal para tu carta digital.
            </p>

            {/* Logo Upload Section */}
            <div className={styles.logoUploadSection}>
              <label className={styles.uploadLabel}>Logo del Restaurante (Opcional, máx 5MB)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={handleLogoFileChange}
              />

              {logoUrl ? (
                <div className={styles.logoPreviewWrapper}>
                  <img src={logoUrl} alt="Logo restaurante" className={styles.logoPreview} />
                  <div className={styles.logoInfo}>
                    <strong>Logo Cargado</strong>
                    <span>✓ Almacenado en Supabase</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Cambiar
                  </Button>
                </div>
              ) : (
                <div
                  className={styles.logoDropzone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploadingLogo ? (
                    <span className={styles.uploadingSpin}>
                      <Loader2 size={24} className="spin" /> Subiendo logo...
                    </span>
                  ) : (
                    <>
                      <Upload size={24} color="#64748B" />
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "#334155" }}>
                        Haz clic para seleccionar tu logo
                      </span>
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                        Formatos recomendados: PNG, JPG, WEBP (Máx. 5MB)
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Color Swatches */}
            <div className={styles.colorPickerSection}>
              <label className={styles.uploadLabel}>Color Principal de Marca</label>
              <div className={styles.colorOptions}>
                {["#2563EB", "#0F766E", "#16A34A", "#F97316", "#9333EA", "#DC2626"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`${styles.colorSwatch} ${brandColor === color ? styles.colorSwatchActive : ""}`}
                    style={{ background: color }}
                    onClick={() => setBrandColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
              <Button variant="primary" size="lg" onClick={() => setStep(3)}>Continuar</Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Primer Plato & Categoría ───────────────────── */}
        {step === 3 && (
          <div className={styles.card}>
            <h2 className={styles.title}>Crea tu Primer Plato</h2>
            <p className={styles.subtitle}>
              Agrega una categoría y tu primer producto para estructurar tu menú interactivo.
            </p>

            <div className={styles.formGroup}>
              <Input
                label="Categoría *"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Ej. Entradas, Fuertes, Bebidas"
                required
              />

              <Input
                label="Nombre del Producto *"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ej. Bandeja Paisa, Limonada de Coco"
                required
              />

              <Input
                label="Precio en COP ($) *"
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="15000"
                required
              />
            </div>

            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => setStep(2)}>Atrás</Button>
              <Button
                variant="primary"
                size="lg"
                loading={isSaving}
                onClick={handleFinalizeOnboarding}
              >
                Guardar y Activar Restaurante
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Finalizado & Resumen ───────────────────────── */}
        {step === 4 && (
          <div className={styles.card}>
            <div className={styles.iconCircle}>
              <Check size={28} strokeWidth={2.5} />
            </div>
            <h1 className={styles.title}>¡Tu Restaurante está Configurado!</h1>
            <p className={styles.subtitle}>
              {restaurantName} ya tiene su carta digital activa e integrada con tu panel de control.
            </p>

            <div className={styles.qrBox}>
              <div className={styles.qrPlaceholder}>
                <QrCode size={96} strokeWidth={1.5} />
              </div>
              <p className={styles.qrHint}>
                Tus códigos QR de mesa están listos para imprimir desde el dashboard.
              </p>
            </div>

            <Link href="/overview" style={{ width: "100%" }}>
              <Button variant="primary" size="lg" fullWidth>
                Ir a mi Dashboard de Gestión
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
