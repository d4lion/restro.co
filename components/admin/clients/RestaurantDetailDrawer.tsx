"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  ExternalLink,
  Store,
  Clock,
  Shield,
  ArrowUpRight,
  History,
  TrendingUp,
  ShoppingBag,
  Utensils,
  Layers,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  LifeBuoy,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SubscriptionTimeBadge } from "../subscriptions/SubscriptionTimeBadge";
import {
  formatDateShort,
  formatDateTime,
  formatCurrencyCOP,
  calculateSubscriptionTime,
} from "@/lib/subscription-utils";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";
import type { TenantMarketBenchmark } from "@/lib/repositories/market-research.repository";
import {
  createSupportTicketAction,
  updateSupportTicketStatusAction,
} from "@/app/actions/support-tickets";
import { toast } from "sonner";
import styles from "./RestaurantDetailDrawer.module.css";

interface Props {
  tenant: TenantAdminSummary | null;
  benchmark?: TenantMarketBenchmark | null;
  isOpen: boolean;
  onClose: () => void;
  onExtend: (tenant: TenantAdminSummary) => void;
  onEditDates: (tenant: TenantAdminSummary) => void;
  onPermissions: (tenant: TenantAdminSummary) => void;
  onChangePlan: (tenant: TenantAdminSummary) => void;
  onViewHistory: (tenant: TenantAdminSummary) => void;
}

export function RestaurantDetailDrawer({
  tenant,
  benchmark,
  isOpen,
  onClose,
  onExtend,
  onEditDates,
  onPermissions,
  onChangePlan,
  onViewHistory,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "subscription" | "sales" | "catalog" | "tickets" | "history"
  >("overview");

  // Local tickets state
  const [tickets, setTickets] = useState(tenant?.supportTickets || []);
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketCategory, setTicketCategory] = useState<
    "TECHNICAL" | "BILLING" | "FEATURE_REQUEST" | "ONBOARDING" | "GENERAL"
  >("GENERAL");
  const [ticketPriority, setTicketPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  >("MEDIUM");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketNotes, setTicketNotes] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  useEffect(() => {
    if (tenant?.supportTickets) {
      setTickets(tenant.supportTickets);
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const openTicketsCount = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
  ).length;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDescription.trim()) {
      toast.error("El título y la descripción son requeridos");
      return;
    }

    setIsSubmittingTicket(true);
    const res = await createSupportTicketAction({
      tenantId: tenant.id,
      title: ticketTitle.trim(),
      description: ticketDescription.trim(),
      category: ticketCategory,
      priority: ticketPriority,
      notes: ticketNotes.trim() || undefined,
    });
    setIsSubmittingTicket(false);

    if (res.success && res.data) {
      toast.success("Novedad registrada exitosamente.");
      setTickets([res.data, ...tickets]);
      setIsAddingTicket(false);
      setTicketTitle("");
      setTicketDescription("");
      setTicketNotes("");
    } else {
      toast.error(res.message || "Error al crear novedad");
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    const res = await updateSupportTicketStatusAction({
      id: ticketId,
      status: newStatus as any,
    });
    if (res.success) {
      toast.success(`Estado actualizado a: ${newStatus}`);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
    } else {
      toast.error(res.message || "Error al cambiar estado");
    }
  };

  const sub = tenant.subscription;
  const plan = sub?.plan;

  const subTime = sub
    ? calculateSubscriptionTime({
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        trialEndsAt: sub.trialEndsAt,
        status: sub.status,
        planKey: plan?.key,
      })
    : null;

  return (
    <div className={styles.drawerOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.drawerPanel}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.topRow}>
            <div className={styles.titleGroup}>
              <h2 className={styles.restaurantName}>{tenant.name}</h2>
              <div className={styles.metaRow}>
                <Link
                  href={`/restaurant/${tenant.slug}`}
                  target="_blank"
                  className={styles.slugLink}
                >
                  /{tenant.slug} <ExternalLink size={11} />
                </Link>
                {tenant.city && (
                  <span>
                    • <MapPin size={11} style={{ display: "inline" }} /> {tenant.city}
                  </span>
                )}
                {tenant.ownerUser && (
                  <span>
                    • <Mail size={11} style={{ display: "inline" }} /> {tenant.ownerUser.email}
                  </span>
                )}
              </div>
            </div>

            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar Ficha">
              <X size={16} />
            </button>
          </div>

          {/* Status Strip: Operational Status distinct from Subscription Status */}
          <div className={styles.statusStrip}>
            <span
              className={`${styles.statusPill} ${
                tenant.isActive ? styles["statusPill--active"] : styles["statusPill--suspended"]
              }`}
            >
              {tenant.isActive ? "Operativo (Activo)" : "Operativo (Suspendido)"}
            </span>

            {plan && (
              <span className={styles.planPill}>
                Plan {plan.label} ({plan.priceMonthly === 0 ? "Gratis" : `${formatCurrencyCOP(plan.priceMonthly)}/m`})
              </span>
            )}

            {sub && (
              <SubscriptionTimeBadge
                start={sub.currentPeriodStart}
                end={sub.currentPeriodEnd}
                trialEndsAt={sub.trialEndsAt}
                status={sub.status}
                planKey={plan?.key}
                showProgress={false}
              />
            )}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className={styles.tabsBar}>
          {[
            { id: "overview", label: "Resumen", icon: <Store size={14} />, badge: null },
            { id: "subscription", label: "Suscripción & Permisos", icon: <Clock size={14} />, badge: null },
            { id: "sales", label: "Pedidos & Ventas", icon: <TrendingUp size={14} />, badge: null },
            { id: "catalog", label: "Catálogo & Mesas", icon: <Utensils size={14} />, badge: null },
            {
              id: "tickets",
              label: "Tickets & Novedades",
              icon: <LifeBuoy size={14} />,
              badge: openTicketsCount > 0 ? openTicketsCount : null,
            },
            { id: "history", label: "Historial", icon: <History size={14} />, badge: null },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles["tabBtn--active"] : ""}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "9999px",
                    backgroundColor: "#FEE2E2",
                    color: "#DC2626",
                    border: "1px solid #FCA5A5",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className={styles.drawerBody}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <>
              {/* Quick action bar */}
              <div className={styles.quickActionsBar}>
                <Button size="sm" variant="primary" onClick={() => onExtend(tenant)}>
                  Extender Suscripción
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEditDates(tenant)}>
                  Configurar Fechas
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onPermissions(tenant)}>
                  Permisos / Overrides
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onChangePlan(tenant)}>
                  Cambiar Plan
                </Button>
              </div>

              {/* Health Grid */}
              <div className={styles.grid2}>
                <div className={styles.statBox}>
                  <span className={styles.statBoxLabel}>Vigencia de Cuenta</span>
                  <span className={styles.statBoxValue}>{subTime?.statusLabel || "Sin suscripción"}</span>
                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                    Fin: {formatDateShort(sub?.currentPeriodEnd) || (plan?.key === "STARTER" ? "Ilimitado" : "Sin configurar")}
                  </span>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statBoxLabel}>Facturación Acumulada</span>
                  <span className={styles.statBoxValue} style={{ color: "#2563EB" }}>
                    {benchmark ? formatCurrencyCOP(benchmark.totalSalesCop) : formatCurrencyCOP(0)}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                    {benchmark?.totalOrders || tenant.counts.orders} pedidos registrados
                  </span>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statBoxLabel}>Capacidad de Mesas</span>
                  <span className={styles.statBoxValue}>{tenant.counts.tables} mesas</span>
                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Códigos QR activos</span>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statBoxLabel}>Platos en Menú</span>
                  <span className={styles.statBoxValue}>{benchmark?.totalMenuItems || "—"}</span>
                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Ítems en cartas activas</span>
                </div>
              </div>

              {/* Owner and contact card */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionTitle}>
                    <Mail size={14} /> Información de Contacto del Propietario
                  </h4>
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#334155", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div>
                    <strong>Nombre del Dueño:</strong> {tenant.ownerUser?.name || "Sin usuario asignado"}
                  </div>
                  <div>
                    <strong>Correo Electrónico:</strong> {tenant.ownerUser?.email || "—"}
                  </div>
                  <div>
                    <strong>Último Acceso al Sistema:</strong>{" "}
                    {tenant.ownerUser?.lastLoginAt ? formatDateTime(tenant.ownerUser.lastLoginAt) : "Nunca registrado"}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: SUBSCRIPTION & PERMISSIONS */}
          {activeTab === "subscription" && (
            <>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionTitle}>
                    <Clock size={14} /> Ciclo y Vigencia de Suscripción
                  </h4>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.statBox}>
                    <span className={styles.statBoxLabel}>Fecha Inicio</span>
                    <span className={styles.statBoxValue}>{formatDateShort(sub?.currentPeriodStart) || "Sin fecha"}</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.statBoxLabel}>Fecha Vencimiento</span>
                    <span className={styles.statBoxValue}>{formatDateShort(sub?.currentPeriodEnd) || (plan?.key === "STARTER" ? "Ilimitado" : "Sin fecha")}</span>
                  </div>
                </div>

                <div className={styles.quickActionsBar}>
                  <Button size="sm" variant="primary" onClick={() => onExtend(tenant)}>
                    Extender Vigencia
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onEditDates(tenant)}>
                    Modificar Fechas
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onChangePlan(tenant)}>
                    Cambiar Plan
                  </Button>
                </div>
              </div>

              {/* Feature Overrides */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionTitle}>
                    <Shield size={14} /> Permisos Especiales & Overrides Activos
                  </h4>
                  <Button size="sm" variant="secondary" onClick={() => onPermissions(tenant)}>
                    Gestionar Permisos
                  </Button>
                </div>

                {tenant.featureOverrides.length === 0 ? (
                  <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
                    Este restaurante utiliza los límites estándar correspondientes a su plan {plan?.label}.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {tenant.featureOverrides.map((o) => (
                      <div
                        key={o.id}
                        style={{
                          background: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          fontSize: "0.8125rem",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <strong>{o.feature}:</strong> <code>{o.value}</code>
                          {o.reason && <div style={{ fontSize: "0.75rem", color: "#64748B" }}>Motivo: {o.reason}</div>}
                        </div>
                        {o.expiresAt && (
                          <span style={{ fontSize: "0.75rem", color: "#D97706" }}>
                            Expira: {formatDateShort(o.expiresAt)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 3: SALES & ORDERS */}
          {activeTab === "sales" && (
            <>
              {benchmark ? (
                <>
                  <div className={styles.grid2}>
                    <div className={styles.statBox}>
                      <span className={styles.statBoxLabel}>Ventas Totales (GMV)</span>
                      <span className={styles.statBoxValue} style={{ color: "#16A34A" }}>
                        {formatCurrencyCOP(benchmark.totalSalesCop)}
                      </span>
                    </div>

                    <div className={styles.statBox}>
                      <span className={styles.statBoxLabel}>Ticket Promedio</span>
                      <span className={styles.statBoxValue}>
                        {benchmark.totalOrders > 0 ? formatCurrencyCOP(benchmark.averageTicketCop) : "—"}
                      </span>
                    </div>

                    <div className={styles.statBox}>
                      <span className={styles.statBoxLabel}>Comandas Entregadas</span>
                      <span className={styles.statBoxValue}>{benchmark.completedOrders}</span>
                      <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        {benchmark.cancelledOrders} canceladas ({benchmark.completionRatePct}% cumplimiento)
                      </span>
                    </div>

                    <div className={styles.statBox}>
                      <span className={styles.statBoxLabel}>Clasificación</span>
                      <span className={styles.statBoxValue}>{benchmark.performanceTier}</span>
                    </div>
                  </div>

                  {/* Channel Breakdown */}
                  <div className={styles.sectionCard}>
                    <h4 className={styles.sectionTitle}>
                      <ShoppingBag size={14} /> Desglose de Canales
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8125rem" }}>
                      <div>Consumo en Mesa: <strong>{benchmark.channelBreakdown.dineIn}</strong> pedidos ({benchmark.channelBreakdown.dineInPct}%)</div>
                      <div>Para Llevar: <strong>{benchmark.channelBreakdown.takeout}</strong> pedidos ({benchmark.channelBreakdown.takeoutPct}%)</div>
                      <div>Domicilio / Delivery: <strong>{benchmark.channelBreakdown.delivery}</strong> pedidos ({benchmark.channelBreakdown.deliveryPct}%)</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: "30px 10px", textAlign: "center", color: "#64748B" }}>
                  <ShoppingBag size={32} style={{ margin: "0 auto 8px" }} />
                  <p>Aún no hay comandas registradas en este restaurante.</p>
                </div>
              )}
            </>
          )}

          {/* TAB 4: CATALOG & TABLES */}
          {activeTab === "catalog" && (
            <div className={styles.sectionCard}>
              <h4 className={styles.sectionTitle}>
                <Utensils size={14} /> Infraestructura y Servicios Habilitados
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8125rem" }}>
                <div>Mesas físicas con QR: <strong>{tenant.counts.tables} mesas</strong></div>
                <div>Platos activos en menú: <strong>{benchmark?.totalMenuItems || 0} platos</strong></div>
                <div>Modalidad Consumo en Mesa: <strong>{tenant.allowDineIn ? "Habilitado" : "Deshabilitado"}</strong></div>
                <div>Modalidad Para Llevar: <strong>{tenant.allowTakeout ? "Habilitado" : "Deshabilitado"}</strong></div>
                <div>Modalidad Domicilio: <strong>{tenant.allowDelivery ? "Habilitado" : "Deshabilitado"}</strong></div>
                <div>Solo Carta (Sin pedidos online): <strong>{tenant.isMenuOnly ? "Sí" : "No"}</strong></div>
                <div>Pedidos por WhatsApp: <strong>{tenant.allowWhatsAppOrdering ? "Sí" : "No"}</strong></div>
              </div>
            </div>
          )}

          {/* TAB 5: TICKETS & NOVEDADES */}
          {activeTab === "tickets" && (
            <div className={styles.sectionCard}>
              <div className={styles.ticketHeaderRow}>
                <div>
                  <h4 className={styles.sectionTitle}>
                    <LifeBuoy size={14} /> Novedades y Tickets de Soporte
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "2px 0 0 0" }}>
                    Registro de incidencias, solicitudes y seguimiento operativo para {tenant.name}.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isAddingTicket ? "ghost" : "primary"}
                  icon={isAddingTicket ? <X size={13} /> : <Plus size={13} />}
                  onClick={() => setIsAddingTicket(!isAddingTicket)}
                >
                  {isAddingTicket ? "Cancelar" : "Registrar Novedad"}
                </Button>
              </div>

              {/* Create Ticket Form */}
              {isAddingTicket && (
                <form onSubmit={handleCreateTicket} className={styles.ticketFormCard}>
                  <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "#0F172A" }}>
                    Registrar Nueva Novedad / Ticket
                  </div>

                  <input
                    type="text"
                    className={styles.ticketInput}
                    placeholder="Título de la novedad (ej: Problema con comanda / Consulta de facturación)"
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    required
                  />

                  <div className={styles.ticketFormGrid}>
                    <select
                      className={styles.ticketInput}
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value as any)}
                    >
                      <option value="GENERAL">Categoría: General</option>
                      <option value="TECHNICAL">Categoría: Soporte Técnico</option>
                      <option value="BILLING">Categoría: Facturación & Pagos</option>
                      <option value="FEATURE_REQUEST">Categoría: Solicitud de Función</option>
                      <option value="ONBOARDING">Categoría: Onboarding / Capacitación</option>
                    </select>

                    <select
                      className={styles.ticketInput}
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as any)}
                    >
                      <option value="LOW">Prioridad: Baja</option>
                      <option value="MEDIUM">Prioridad: Media</option>
                      <option value="HIGH">Prioridad: Alta</option>
                      <option value="URGENT">Prioridad: URGENTE</option>
                    </select>
                  </div>

                  <textarea
                    className={styles.ticketInput}
                    rows={3}
                    placeholder="Descripción detallada de la novedad, error reportado o solicitud..."
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    required
                  />

                  <input
                    type="text"
                    className={styles.ticketInput}
                    placeholder="Notas internas / seguimiento de superadmin (opcional)"
                    value={ticketNotes}
                    onChange={(e) => setTicketNotes(e.target.value)}
                  />

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingTicket(false)}
                      disabled={isSubmittingTicket}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      disabled={isSubmittingTicket}
                    >
                      {isSubmittingTicket ? "Guardando..." : "Guardar Novedad"}
                    </Button>
                  </div>
                </form>
              )}

              {/* Tickets List */}
              {tickets.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 0", color: "#64748B", fontSize: "0.8125rem" }}>
                  <CheckCircle2 size={24} style={{ margin: "0 auto 8px auto", color: "#22C55E", display: "block" }} />
                  No hay novedades registradas para este restaurante.
                </div>
              ) : (
                <div className={styles.ticketList}>
                  {tickets.map((t) => (
                    <div key={t.id} className={styles.ticketCard}>
                      <div className={styles.ticketTop}>
                        <div className={styles.ticketTitleGroup}>
                          <h5 className={styles.ticketTitle}>{t.title}</h5>
                          <div className={styles.ticketMeta}>
                            <span>{formatDateTime(t.createdAt)}</span>
                            {t.authorName && <span>• Por: {t.authorName}</span>}
                          </div>
                        </div>

                        <div className={styles.ticketBadges}>
                          <span className={styles.categoryTag}>{t.category}</span>
                          <span className={`${styles.priorityBadge} ${styles[`priority--${t.priority}`]}`}>
                            {t.priority}
                          </span>
                          <select
                            className={`${styles.statusSelect} ${styles[`statusSelect--${t.status}`]}`}
                            value={t.status}
                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          >
                            <option value="OPEN">Abierto</option>
                            <option value="IN_PROGRESS">En Progreso</option>
                            <option value="RESOLVED">Resuelto</option>
                            <option value="CLOSED">Cerrado</option>
                          </select>
                        </div>
                      </div>

                      <p className={styles.ticketDesc}>{t.description}</p>

                      {t.notes && (
                        <div className={styles.ticketNotes}>
                          <strong>Seguimiento interno:</strong> {t.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AUDIT HISTORY */}
          {activeTab === "history" && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>
                  <History size={14} /> Trazabilidad de Suscripción & Pagos
                </h4>
                <Button size="sm" variant="outline" onClick={() => onViewHistory(tenant)}>
                  Ver Auditoría Completa
                </Button>
              </div>

              {!sub?.billingEvents || sub.billingEvents.length === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
                  No hay movimientos registrados aún para esta suscripción.
                </p>
              ) : (
                <div className={styles.timeline}>
                  {sub.billingEvents.slice(0, 5).map((ev) => (
                    <div key={ev.id} className={styles.timelineItem}>
                      <span className={styles.timelineDate}>{formatDateShort(ev.createdAt)}</span>
                      <div className={styles.timelineContent}>
                        <strong>{ev.type}</strong>
                        {ev.note && <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{ev.note}</div>}
                        {ev.amount && (
                          <div style={{ fontSize: "0.75rem", color: "#16A34A" }}>
                            {formatCurrencyCOP(ev.amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
