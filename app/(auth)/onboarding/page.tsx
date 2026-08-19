"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "./page.module.css";

const IconCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [categoryName, setCategoryName] = useState("Entradas");
  const [itemName, setItemName] = useState("Empanada Criolla");
  const [itemPrice, setItemPrice] = useState("4500");

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden="true" />

      <div className={styles.container}>
        {/* Progress Bar */}
        <div className={styles.progressHeader}>
          <span className={styles.stepBadge}>PASO {step} DE 4</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        {/* Step 1: Bienvenida */}
        {step === 1 && (
          <div className={styles.card}>
            <div className={styles.iconCircle}>
              <IconCheck />
            </div>
            <h1 className={styles.title}>Bienvenido a Restro</h1>
            <p className={styles.subtitle}>
              Estás a solo un par de pasos de tener tu carta digital interactiva lista para recibir pedidos en tu restaurante.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div>
                  <strong>Carta Digital QR Mobile-First</strong>
                  <p>Optimizada para escaneo instantáneo sin descargas.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div>
                  <strong>Pedidos a Cocina en Tiempo Real</strong>
                  <p>Recibe comandas directo en tu KDS o pantalla de gestión.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div>
                  <strong>Inteligencia Artificial Incorporada</strong>
                  <p>Recomendaciones y analítica inteligente para aumentar tu ticket promedio.</p>
                </div>
              </div>
            </div>

            <Button variant="primary" size="lg" fullWidth onClick={() => setStep(2)}>
              Comenzar Configuración
            </Button>
          </div>
        )}

        {/* Step 2: Identidad y Marca */}
        {step === 2 && (
          <div className={styles.card}>
            <h2 className={styles.title}>Personaliza tu Marca</h2>
            <p className={styles.subtitle}>
              Elige el color distintivo de tu restaurante para la carta digital.
            </p>

            <div className={styles.colorPickerSection}>
              <label className={styles.fieldLabel}>Color Principal de Marca</label>
              <div className={styles.colorOptions}>
                {["#2563EB", "#E11D48", "#16A34A", "#F97316", "#9333EA", "#D97706"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={styles.colorSwatch}
                    style={{ background: color }}
                    onClick={() => {}}
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

        {/* Step 3: Primer Producto */}
        {step === 3 && (
          <div className={styles.card}>
            <h2 className={styles.title}>Crea tu Primer Plato</h2>
            <p className={styles.subtitle}>
              Agrega una categoría y tu primer producto para que tu carta no arranque vacía.
            </p>

            <div className={styles.formGroup}>
              <Input
                label="Categoría"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Ej. Entradas, Fuertes, Bebidas"
              />

              <Input
                label="Nombre del Producto"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ej. Bandeja Paisa, Limonada de Cerveza"
              />

              <Input
                label="Precio en COP ($)"
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="15000"
              />
            </div>

            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => setStep(2)}>Atrás</Button>
              <Button variant="primary" size="lg" onClick={() => setStep(4)}>Guardar y Ver mi QR</Button>
            </div>
          </div>
        )}

        {/* Step 4: Finalizado / QR */}
        {step === 4 && (
          <div className={styles.card}>
            <div className={styles.iconCircle}>
              <IconCheck />
            </div>
            <h1 className={styles.title}>¡Tu Carta Digital está Lista!</h1>
            <p className={styles.subtitle}>
              Ya puedes empezar a recibir pedidos e imprimir tu código QR para tus mesas.
            </p>

            <div className={styles.qrBox}>
              <div className={styles.qrPlaceholder}>
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <p className={styles.qrHint}>Escanea o imprime desde tu dashboard</p>
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
