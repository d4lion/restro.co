"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { saveOnboardingAction } from "@/app/actions/onboarding";
import { Check, QrCode, Palette, Store, Utensils } from "lucide-react";
import { toast } from "sonner";
import styles from "./page.module.css";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);

  // Step 1: Restaurant info
  const [restaurantName, setRestaurantName] = useState("Mi Restaurante");
  const [slogan, setSlogan] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2: Brand Color
  const [brandColor, setBrandColor] = useState("#2563EB");

  // Step 3: First Menu Item
  const [categoryName, setCategoryName] = useState("Entradas");
  const [itemName, setItemName] = useState("Empanada Criolla");
  const [itemPrice, setItemPrice] = useState("4500");

  // Final save state
  const [isSaving, setIsSaving] = useState(false);

  /* ── Final Step Saver ────────────────────────────────────── */
  async function handleFinalizeOnboarding() {
    setIsSaving(true);
    const priceNum = parseFloat(itemPrice) || 0;

    const res = await saveOnboardingAction({
      restaurantName,
      slogan,
      phone,
      brandColor,
      categoryName,
      itemName,
      itemPrice: priceNum,
    });

    setIsSaving(false);

    if (res.success) {
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
            <div className={styles.stepIconBox}>
              <Store size={28} />
            </div>
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
              Continuar a Color de Marca
            </Button>
          </div>
        )}

        {/* ── STEP 2: Color de Marca (Sin carga de archivos) ─────── */}
        {step === 2 && (
          <div className={styles.card}>
            <div className={styles.stepIconBox}>
              <Palette size={28} />
            </div>
            <h2 className={styles.title}>Color de Marca</h2>
            <p className={styles.subtitle}>
              Elige el color distintivo para la interfaz de tu carta digital.
            </p>

            <div className={styles.colorPickerSection}>
              <label className={styles.uploadLabel}>Selecciona tu Color Principal</label>
              <div className={styles.colorOptions}>
                {[
                  { name: "Azul Restro", hex: "#2563EB" },
                  { name: "Verde Teal", hex: "#0F766E" },
                  { name: "Verde Esmeralda", hex: "#16A34A" },
                  { name: "Naranja Cálido", hex: "#F97316" },
                  { name: "Púrpura", hex: "#9333EA" },
                  { name: "Rojo Carmín", hex: "#DC2626" },
                ].map((item) => (
                  <button
                    key={item.hex}
                    type="button"
                    title={item.name}
                    className={`${styles.colorSwatch} ${brandColor === item.hex ? styles.colorSwatchActive : ""}`}
                    style={{ background: item.hex }}
                    onClick={() => setBrandColor(item.hex)}
                  />
                ))}
              </div>
            </div>

            <div className={styles.securityNote}>
              💡 <strong>Nota sobre el Logo:</strong> Podrás subir y personalizar el logo oficial de tu restaurante en cualquier momento de forma segura desde la sección <em>Configuración</em> de tu Dashboard.
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
            <div className={styles.stepIconBox}>
              <Utensils size={28} />
            </div>
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
            <h1 className={styles.title}>¡Tu Restaurante está Listo!</h1>
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
