"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  saveFeatureOverrideAction,
  removeFeatureOverrideAction,
  toggleTenantStatusAction,
  updateTenantCapabilitiesAction,
} from "@/app/actions/admin-subscriptions";
import { toast } from "sonner";
import styles from "./TenantPermissionsModal.module.css";
import {
  Shield,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Settings2,
  Power,
  Sliders,
} from "lucide-react";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";

interface Props {
  tenant: TenantAdminSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FeatureDef {
  key: string;
  label: string;
  description: string;
  type: "boolean" | "number";
}

const FEATURE_DEFINITIONS: FeatureDef[] = [
  {
    key: "hasOrders",
    label: "Módulo de Pedidos & Pantalla de Cocina (KDS)",
    description: "Recepción de comandas en tiempo real desde QR y panel interactivo para cocina/barra",
    type: "boolean",
  },
  {
    key: "hasReservations",
    label: "Módulo de Reservas de Mesas",
    description: "Agenda interactiva, asignación de mesas y control de reservas para comensales",
    type: "boolean",
  },
  {
    key: "hasAI",
    label: "Analítica e Inteligencia Artificial",
    description: "Predicción de horas pico, combos IA y recomendaciones automáticas",
    type: "boolean",
  },
  {
    key: "hasWhatsApp",
    label: "Canal de Pedidos WhatsApp",
    description: "Recepción de pedidos por chat de WhatsApp con chatbot",
    type: "boolean",
  },
  {
    key: "hasInventory",
    label: "Módulo de Control de Inventario",
    description: "Control de stock, alertas de agotados e insumos",
    type: "boolean",
  },
  {
    key: "hasExportExcel",
    label: "Exportación de Reportes a Excel",
    description: "Descarga de métricas de ventas y pedidos en formato .xlsx",
    type: "boolean",
  },
  {
    key: "hasExportPDF",
    label: "Exportación de Carta a PDF",
    description: "Generación e impresión de carta en formato PDF de alta calidad",
    type: "boolean",
  },
  {
    key: "hasCustomBranding",
    label: "Personalización de Marca y Colores",
    description: "Colores corporativos y eliminación de mención de Restro",
    type: "boolean",
  },
  {
    key: "hasMultiLanguage",
    label: "Multilenguaje en Carta Digital",
    description: "Carta traducida automáticamente a inglés y otros idiomas",
    type: "boolean",
  },
  {
    key: "hasPrioritySupport",
    label: "Soporte Prioritario VIP",
    description: "Atención prioritaria por canal directo de soporte",
    type: "boolean",
  },
  {
    key: "maxTables",
    label: "Límite Máximo de Mesas",
    description: "Número de mesas con QR (-1 = ilimitadas)",
    type: "number",
  },
  {
    key: "maxMenuItems",
    label: "Límite Máximo de Productos en Carta",
    description: "Número de platos y bebidas permitidos (-1 = ilimitados)",
    type: "number",
  },
  {
    key: "maxStaff",
    label: "Límite de Cuentas de Personal",
    description: "Usuarios meseros/cocina que pueden ingresar al sistema (-1 = ilimitados)",
    type: "number",
  },
];

export function TenantPermissionsModal({ tenant, isOpen, onClose, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<"features" | "capabilities" | "status">("features");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Status & Capabilities state
  const [isActive, setIsActive] = useState<boolean>(tenant?.isActive ?? true);
  const [allowDineIn, setAllowDineIn] = useState<boolean>(tenant?.allowDineIn ?? true);
  const [allowTakeout, setAllowTakeout] = useState<boolean>(tenant?.allowTakeout ?? false);
  const [allowDelivery, setAllowDelivery] = useState<boolean>(tenant?.allowDelivery ?? false);
  const [isMenuOnly, setIsMenuOnly] = useState<boolean>(tenant?.isMenuOnly ?? false);
  const [allowWhatsAppOrdering, setAllowWhatsAppOrdering] = useState<boolean>(
    tenant?.allowWhatsAppOrdering ?? false
  );
  const [whatsappNumber, setWhatsappNumber] = useState<string>(tenant?.whatsappNumber ?? "");

  // Numerical override inputs state
  const [numericValues, setNumericValues] = useState<Record<string, string>>({});

  if (!tenant || !tenant.subscription) return null;

  const plan = tenant.subscription.plan;
  const overrides = tenant.featureOverrides;

  // Helper to get effective value and override info
  const getFeatureStatus = (feat: FeatureDef) => {
    const override = overrides.find((o) => o.feature === feat.key);
    const planDefault = (plan as unknown as Record<string, unknown>)[feat.key];

    if (override) {
      return {
        hasOverride: true,
        effectiveValue: feat.type === "boolean" ? override.value === "true" : override.value,
        planDefault,
        reason: override.reason,
        expiresAt: override.expiresAt,
      };
    }

    return {
      hasOverride: false,
      effectiveValue: planDefault,
      planDefault,
      reason: null,
      expiresAt: null,
    };
  };

  const handleToggleBooleanFeature = async (featKey: string, currentValue: boolean) => {
    setLoadingAction(featKey);
    const newValue = !currentValue;

    const res = await saveFeatureOverrideAction({
      tenantId: tenant.id,
      feature: featKey,
      value: String(newValue),
      reason: "Permiso otorgado manualmente desde panel de gestión",
    });

    setLoadingAction(null);
    if (res.success) {
      toast.success(res.message);
      onSuccess();
    } else {
      toast.error(res.message);
    }
  };

  const handleSaveNumericFeature = async (featKey: string) => {
    const val = numericValues[featKey];
    if (val === undefined || val === "") return;

    setLoadingAction(featKey);
    const res = await saveFeatureOverrideAction({
      tenantId: tenant.id,
      feature: featKey,
      value: val,
      reason: "Límite numérico modificado manualmente",
    });

    setLoadingAction(null);
    if (res.success) {
      toast.success(res.message);
      onSuccess();
    } else {
      toast.error(res.message);
    }
  };

  const handleResetOverride = async (featKey: string) => {
    setLoadingAction(`reset-${featKey}`);
    const res = await removeFeatureOverrideAction({
      tenantId: tenant.id,
      feature: featKey,
    });
    setLoadingAction(null);

    if (res.success) {
      toast.success(res.message);
      onSuccess();
    } else {
      toast.error(res.message);
    }
  };

  const handleSaveCapabilities = async () => {
    setLoadingAction("capabilities");
    const res = await updateTenantCapabilitiesAction({
      tenantId: tenant.id,
      allowDineIn,
      allowTakeout,
      allowDelivery,
      isMenuOnly,
      allowWhatsAppOrdering,
      whatsappNumber: whatsappNumber.trim() || null,
    });
    setLoadingAction(null);

    if (res.success) {
      toast.success(res.message);
      onSuccess();
    } else {
      toast.error(res.message);
    }
  };

  const handleToggleStatus = async () => {
    setLoadingAction("status");
    const nextStatus = !isActive;
    const res = await toggleTenantStatusAction({
      tenantId: tenant.id,
      isActive: nextStatus,
      reason: nextStatus ? "Restaurante reactivado por admin" : "Suspensión administrativa",
    });
    setLoadingAction(null);

    if (res.success) {
      setIsActive(nextStatus);
      toast.success(res.message);
      onSuccess();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión Integral del Restaurante & Permisos"
      size="lg"
      isLoading={loadingAction !== null}
    >
      <div className={styles.modalContent}>
        <div className={styles.tenantBanner}>
          <div className={styles.bannerLeft}>
            <span className={styles.bannerName}>{tenant.name}</span>
            <span className={styles.bannerMeta}>
              Slug: <code>{tenant.slug}</code> • Plan Base: <strong>{plan.label}</strong>
            </span>
          </div>
          <div className={styles.bannerRight}>
            <span className={`${styles.statusPill} ${isActive ? styles["statusPill--active"] : styles["statusPill--inactive"]}`}>
              {isActive ? "● Activo" : "● Suspendido"}
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className={styles.tabsHeader}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "features" ? styles["tabBtn--active"] : ""}`}
            onClick={() => setActiveTab("features")}
          >
            <Shield size={16} /> Permisos y Overrides Especiales ({overrides.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "capabilities" ? styles["tabBtn--active"] : ""}`}
            onClick={() => setActiveTab("capabilities")}
          >
            <Settings2 size={16} /> Capacidades de Pedidos
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "status" ? styles["tabBtn--active"] : ""}`}
            onClick={() => setActiveTab("status")}
          >
            <Power size={16} /> Estado del Tenant
          </button>
        </div>

        {/* TAB 1: FEATURES & OVERRIDES */}
        {activeTab === "features" && (
          <div className={styles.tabBody}>
            <div className={styles.infoAlert}>
              <Sparkles size={16} />
              <span>
                Los permisos especiales anulan los límites por defecto del plan (<strong>{plan.label}</strong>).
                Puedes conceder módulos premium a cualquier tenant sin cambiar su plan base.
              </span>
            </div>

            <div className={styles.featuresList}>
              {FEATURE_DEFINITIONS.map((feat) => {
                const stat = getFeatureStatus(feat);
                const isBool = feat.type === "boolean";
                const isNum = feat.type === "number";

                return (
                  <div
                    key={feat.key}
                    className={`${styles.featureCard} ${
                      stat.hasOverride ? styles["featureCard--overridden"] : ""
                    }`}
                  >
                    <div className={styles.featureInfo}>
                      <div className={styles.featureTitleRow}>
                        <span className={styles.featureTitle}>{feat.label}</span>
                        {stat.hasOverride ? (
                          <span className={styles.overrideTag}>PERMISO PERSONALIZADO</span>
                        ) : (
                          <span className={styles.planDefaultTag}>PLAN ({String(stat.planDefault)})</span>
                        )}
                      </div>
                      <p className={styles.featureDesc}>{feat.description}</p>
                      {stat.hasOverride && stat.reason && (
                        <p className={styles.overrideReason}>Motivo: {stat.reason}</p>
                      )}
                    </div>

                    <div className={styles.featureActions}>
                      {isBool && (
                        <Button
                          size="sm"
                          variant={stat.effectiveValue ? "primary" : "outline"}
                          loading={loadingAction === feat.key}
                          onClick={() =>
                            handleToggleBooleanFeature(feat.key, Boolean(stat.effectiveValue))
                          }
                        >
                          {stat.effectiveValue ? "Habilitado" : "Deshabilitado"}
                        </Button>
                      )}

                      {isNum && (
                        <div className={styles.numInputGroup}>
                          <input
                            type="number"
                            className={styles.numInput}
                            placeholder={String(stat.effectiveValue)}
                            value={
                              numericValues[feat.key] !== undefined
                                ? numericValues[feat.key]
                                : String(stat.effectiveValue)
                            }
                            onChange={(e) =>
                              setNumericValues({
                                ...numericValues,
                                [feat.key]: e.target.value,
                              })
                            }
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={loadingAction === feat.key}
                            onClick={() => handleSaveNumericFeature(feat.key)}
                          >
                            Guardar
                          </Button>
                        </div>
                      )}

                      {stat.hasOverride && (
                        <button
                          type="button"
                          className={styles.resetBtn}
                          title="Restablecer al plan base"
                          disabled={loadingAction === `reset-${feat.key}`}
                          onClick={() => handleResetOverride(feat.key)}
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CAPABILITIES */}
        {activeTab === "capabilities" && (
          <div className={styles.tabBody}>
            <p className={styles.tabDesc}>
              Ajusta cómo pueden los clientes ordenar comida en este restaurante:
            </p>

            <div className={styles.toggleRow}>
              <div>
                <strong>Comer en el local (Dine in)</strong>
                <p>Permite a los comensales pedir en mesa con código QR</p>
              </div>
              <input
                type="checkbox"
                checked={allowDineIn}
                onChange={(e) => setAllowDineIn(e.target.checked)}
                className={styles.checkbox}
              />
            </div>

            <div className={styles.toggleRow}>
              <div>
                <strong>Para recoger (Takeout)</strong>
                <p>Permite pedidos para recoger en el establecimiento</p>
              </div>
              <input
                type="checkbox"
                checked={allowTakeout}
                onChange={(e) => setAllowTakeout(e.target.checked)}
                className={styles.checkbox}
              />
            </div>

            <div className={styles.toggleRow}>
              <div>
                <strong>Domicilio (Delivery)</strong>
                <p>Permite entregas directas a domicilio</p>
              </div>
              <input
                type="checkbox"
                checked={allowDelivery}
                onChange={(e) => setAllowDelivery(e.target.checked)}
                className={styles.checkbox}
              />
            </div>

            <div className={styles.toggleRow}>
              <div>
                <strong>Modo solo carta digital (isMenuOnly)</strong>
                <p>Oculta el carrito y los pedidos; sirve únicamente como visor de la carta</p>
              </div>
              <input
                type="checkbox"
                checked={isMenuOnly}
                onChange={(e) => setIsMenuOnly(e.target.checked)}
                className={styles.checkbox}
              />
            </div>

            <div className={styles.toggleRow}>
              <div>
                <strong>Pedidos por WhatsApp (allowWhatsAppOrdering)</strong>
                <p>Envía la comanda formateada al WhatsApp del restaurante</p>
              </div>
              <input
                type="checkbox"
                checked={allowWhatsAppOrdering}
                onChange={(e) => setAllowWhatsAppOrdering(e.target.checked)}
                className={styles.checkbox}
              />
            </div>

            {allowWhatsAppOrdering && (
              <div style={{ marginTop: "12px" }}>
                <Input
                  label="Número de WhatsApp para pedidos"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+573001234567"
                />
              </div>
            )}

            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="primary"
                loading={loadingAction === "capabilities"}
                onClick={handleSaveCapabilities}
              >
                Guardar Capacidades
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: TENANT STATUS */}
        {activeTab === "status" && (
          <div className={styles.tabBody}>
            <div className={styles.statusBox}>
              <div className={styles.statusText}>
                <strong>Estado actual: {isActive ? "Activo" : "Suspendido"}</strong>
                <p>
                  Si suspendes este restaurante, su carta pública mostrará un mensaje de no disponible
                  y no se podrán recibir nuevos pedidos.
                </p>
              </div>
              <Button
                variant={isActive ? "danger" : "primary"}
                loading={loadingAction === "status"}
                onClick={handleToggleStatus}
              >
                {isActive ? "Suspender Restaurante" : "Reactivar Restaurante"}
              </Button>
            </div>
          </div>
        )}

        <div className={styles.footerClose}>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
