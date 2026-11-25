"use client";

import React, { useState, useMemo } from "react";
import {
  LifeBuoy,
  Plus,
  Search,
  RotateCcw,
  Store,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Send,
  Edit2,
  Check,
  X,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatDateShort } from "@/lib/subscription-utils";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";
import type { SupportTicketRecord } from "@/lib/repositories/support-ticket.repository";
import {
  createSupportTicketAction,
  updateSupportTicketStatusAction,
  updateSupportTicketNoteAction,
} from "@/app/actions/support-tickets";
import { toast } from "sonner";
import styles from "./TicketsManager.module.css";

interface Props {
  tenants: TenantAdminSummary[];
  onOpenDetail?: (tenant: TenantAdminSummary) => void;
}

interface TicketWithTenant extends SupportTicketRecord {
  tenantRef: TenantAdminSummary;
}

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "General",
  TECHNICAL: "Soporte Técnico",
  BILLING: "Facturación & Pagos",
  FEATURE_REQUEST: "Solicitud de Función",
  ONBOARDING: "Configuración & Ayuda",
};

export function TicketsManager({ tenants, onOpenDetail }: Props) {
  // Aggregate all tickets from all tenants
  const initialTickets = useMemo(() => {
    const list: TicketWithTenant[] = [];
    tenants.forEach((t) => {
      t.supportTickets?.forEach((st) => {
        list.push({
          ...st,
          tenantRef: t,
        });
      });
    });
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [tenants]);

  const [ticketsList, setTicketsList] = useState<TicketWithTenant[]>(initialTickets);

  // Sync if tenants prop updates
  React.useEffect(() => {
    setTicketsList(initialTickets);
  }, [initialTickets]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tenantFilter, setTenantFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Create Ticket Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [targetTenantId, setTargetTenantId] = useState(tenants[0]?.id || "");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("TECHNICAL");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newDescription, setNewDescription] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Note Edit State
  const [editingNoteTicketId, setEditingNoteTicketId] = useState<string | null>(null);
  const [currentNoteText, setCurrentNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // KPIs
  const stats = useMemo(() => {
    const total = ticketsList.length;
    const open = ticketsList.filter((t) => t.status === "OPEN").length;
    const inProgress = ticketsList.filter((t) => t.status === "IN_PROGRESS").length;
    const urgent = ticketsList.filter(
      (t) => t.priority === "URGENT" && t.status !== "RESOLVED" && t.status !== "CLOSED"
    ).length;
    const resolved = ticketsList.filter((t) => t.status === "RESOLVED").length;
    return { total, open, inProgress, urgent, resolved };
  }, [ticketsList]);

  // Filtered List
  const filteredTickets = useMemo(() => {
    return ticketsList.filter((ticket) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ticket.title.toLowerCase().includes(q);
        const matchDesc = ticket.description.toLowerCase().includes(q);
        const matchTenant = ticket.tenantRef.name.toLowerCase().includes(q);
        const matchAuthor = ticket.authorName?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchDesc && !matchTenant && !matchAuthor) return false;
      }

      // Tenant
      if (tenantFilter !== "ALL" && ticket.tenantRef.id !== tenantFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== "ALL" && ticket.category !== categoryFilter) {
        return false;
      }

      // Priority
      if (priorityFilter !== "ALL" && ticket.priority !== priorityFilter) {
        return false;
      }

      // Status
      if (statusFilter !== "ALL") {
        if (statusFilter === "URGENT") {
          return ticket.priority === "URGENT" && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED";
        }
        if (ticket.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [ticketsList, searchQuery, tenantFilter, categoryFilter, priorityFilter, statusFilter]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    const res = await updateSupportTicketStatusAction({
      id: ticketId,
      status: newStatus as any,
    });

    if (res.success) {
      toast.success(`Estado actualizado a ${newStatus}`);
      setTicketsList((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
    } else {
      toast.error(res.message || "Error al actualizar estado");
    }
  };

  const handleSaveNote = async (ticketId: string) => {
    setIsSavingNote(true);
    const res = await updateSupportTicketNoteAction({
      id: ticketId,
      notes: currentNoteText.trim(),
    });
    setIsSavingNote(false);

    if (res.success) {
      toast.success("Nota de seguimiento guardada.");
      setTicketsList((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, notes: currentNoteText.trim() } : t
        )
      );
      setEditingNoteTicketId(null);
    } else {
      toast.error(res.message || "Error al guardar nota");
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTenantId || !newTitle.trim() || !newDescription.trim()) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setIsSubmitting(true);
    const res = await createSupportTicketAction({
      tenantId: targetTenantId,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory as any,
      priority: newPriority as any,
      notes: newNotes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (res.success && res.data) {
      toast.success("Ticket registrado correctamente.");
      const tenantObj = tenants.find((t) => t.id === targetTenantId)!;
      const createdItem: TicketWithTenant = {
        ...res.data,
        tenantRef: tenantObj,
      };
      setTicketsList([createdItem, ...ticketsList]);
      setIsCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewNotes("");
    } else {
      toast.error(res.message || "Error al registrar ticket");
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Gestor de Novedades & Tickets de Soporte</h2>
          <p className={styles.subtitle}>
            Seguimiento centralizado de incidencias operativas, solicitudes de clientes y soporte de todos los restaurantes.
          </p>
        </div>

        <Button
          size="sm"
          variant={isCreateOpen ? "ghost" : "primary"}
          icon={isCreateOpen ? <X size={14} /> : <Plus size={14} />}
          onClick={() => setIsCreateOpen(!isCreateOpen)}
        >
          {isCreateOpen ? "Cancelar" : "Registrar Novedad / Ticket"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Total Tickets</span>
            <LifeBuoy size={16} color="#64748B" />
          </div>
          <div className={styles.kpiValue}>{stats.total}</div>
          <div className={styles.kpiSub}>Histórico registrado</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>En Espera (Abiertos)</span>
            <Clock size={16} color="#2563EB" />
          </div>
          <div className={styles.kpiValue} style={{ color: stats.open > 0 ? "#2563EB" : undefined }}>
            {stats.open}
          </div>
          <div className={styles.kpiSub}>Pendientes de primera respuesta</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>En Atención</span>
            <MessageSquare size={16} color="#D97706" />
          </div>
          <div className={styles.kpiValue} style={{ color: stats.inProgress > 0 ? "#D97706" : undefined }}>
            {stats.inProgress}
          </div>
          <div className={styles.kpiSub}>En proceso de resolución</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Urgentes Activos</span>
            <AlertTriangle size={16} color="#DC2626" />
          </div>
          <div className={styles.kpiValue} style={{ color: stats.urgent > 0 ? "#DC2626" : "#16A34A" }}>
            {stats.urgent}
          </div>
          <div className={styles.kpiSub}>
            {stats.urgent > 0 ? "¡Requieren atención inmediata!" : "Sin bloqueos críticos"}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Resueltos</span>
            <CheckCircle2 size={16} color="#16A34A" />
          </div>
          <div className={styles.kpiValue} style={{ color: "#16A34A" }}>
            {stats.resolved}
          </div>
          <div className={styles.kpiSub}>Casos cerrados con éxito</div>
        </div>
      </div>

      {/* Modal / Form Create Ticket */}
      {isCreateOpen && (
        <form onSubmit={handleCreateTicket} className={styles.ticketCard} style={{ border: "1px solid #93C5FD", background: "#EFF6FF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#1E3A8A", margin: 0 }}>
              Registrar Nueva Novedad para Restaurante
            </h3>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                Restaurante / Tenant
              </label>
              <select
                className={styles.selectFilter}
                value={targetTenantId}
                onChange={(e) => setTargetTenantId(e.target.value)}
                required
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (/{t.slug})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                Título de la Novedad
              </label>
              <input
                type="text"
                className={styles.searchInput}
                style={{ paddingLeft: "12px", height: "38px" }}
                placeholder="Ej: Problema con comanda en cocina"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                Categoría
              </label>
              <select
                className={styles.selectFilter}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="TECHNICAL">Soporte Técnico</option>
                <option value="BILLING">Facturación & Pagos</option>
                <option value="FEATURE_REQUEST">Solicitud de Función</option>
                <option value="ONBOARDING">Configuración & Ayuda</option>
                <option value="GENERAL">General</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                Prioridad
              </label>
              <select
                className={styles.selectFilter}
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">URGENTE</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
              Descripción del caso
            </label>
            <textarea
              className={styles.searchInput}
              style={{ padding: "8px 12px", height: "auto" }}
              rows={3}
              placeholder="Detalle de la incidencia o solicitud reportada..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
              Notas Internas de Superadmin (Opcional)
            </label>
            <input
              type="text"
              className={styles.searchInput}
              style={{ paddingLeft: "12px", height: "38px" }}
              placeholder="Seguimiento interno o respuesta que verá el restaurante..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Ticket"}
            </Button>
          </div>
        </form>
      )}

      {/* Search and Filters Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por restaurante, título, caso o autor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filtersGroup}>
          {/* Restaurant Filter */}
          <select
            className={styles.selectFilter}
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
          >
            <option value="ALL">Todos los Restaurantes</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            className={styles.selectFilter}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="TECHNICAL">Soporte Técnico</option>
            <option value="BILLING">Facturación & Pagos</option>
            <option value="FEATURE_REQUEST">Solicitudes</option>
            <option value="ONBOARDING">Onboarding</option>
            <option value="GENERAL">General</option>
          </select>

          {/* Priority Filter */}
          <select
            className={styles.selectFilter}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">Todas las Prioridades</option>
            <option value="URGENT">Urgente</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Media</option>
            <option value="LOW">Baja</option>
          </select>

          {(searchQuery || statusFilter !== "ALL" || tenantFilter !== "ALL" || categoryFilter !== "ALL" || priorityFilter !== "ALL") && (
            <Button
              size="sm"
              variant="outline"
              icon={<RotateCcw size={13} />}
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setTenantFilter("ALL");
                setCategoryFilter("ALL");
                setPriorityFilter("ALL");
              }}
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className={styles.tabsBar}>
        {[
          { id: "ALL", label: `Todos (${ticketsList.length})` },
          { id: "OPEN", label: `Abiertos (${stats.open})` },
          { id: "IN_PROGRESS", label: `En Atención (${stats.inProgress})` },
          { id: "URGENT", label: `Urgentes (${stats.urgent})` },
          { id: "RESOLVED", label: `Resueltos (${stats.resolved})` },
          { id: "CLOSED", label: "Cerrados" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tabPill} ${statusFilter === tab.id ? styles["tabPill--active"] : ""}`}
            onClick={() => setStatusFilter(tab.id)}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckCircle2 size={32} color="#22C55E" />
          <p style={{ margin: 0, fontWeight: 600, color: "#0F172A" }}>
            No se encontraron tickets con los filtros aplicados.
          </p>
          <span>Todos los restaurantes se encuentran al día y sin incidencias pendientes en este criterio.</span>
        </div>
      ) : (
        <div className={styles.ticketsList}>
          {filteredTickets.map((ticket) => {
            const isEditingNote = editingNoteTicketId === ticket.id;

            return (
              <div key={ticket.id} className={styles.ticketCard}>
                <div className={styles.cardTopRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div className={styles.tenantInfoGroup}>
                      <button
                        type="button"
                        className={styles.tenantNameBtn}
                        onClick={() => onOpenDetail && onOpenDetail(ticket.tenantRef)}
                        title="Ver Ficha Integral de este restaurante"
                      >
                        <Store size={14} />
                        <span>{ticket.tenantRef.name}</span>
                        <Eye size={12} style={{ opacity: 0.7 }} />
                      </button>

                      <span className={`${styles.badge} ${styles["badge--category"]}`}>
                        {CATEGORY_LABELS[ticket.category] || ticket.category}
                      </span>

                      <span className={`${styles.badge} ${styles[`badge--${ticket.priority}`]}`}>
                        {ticket.priority}
                      </span>
                    </div>

                    <h3 className={styles.ticketTitle}>{ticket.title}</h3>

                    <div className={styles.ticketMetaRow}>
                      <span>Reportado el {formatDateTime(ticket.createdAt)}</span>
                      {ticket.authorName && <span>• Por: {ticket.authorName}</span>}
                    </div>
                  </div>

                  <div className={styles.badgesGroup}>
                    <select
                      className={`${styles.statusSelect} ${styles[`statusSelect--${ticket.status}`]}`}
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                    >
                      <option value="OPEN">Abierto</option>
                      <option value="IN_PROGRESS">En Progreso</option>
                      <option value="RESOLVED">Resuelto</option>
                      <option value="CLOSED">Cerrado</option>
                    </select>
                  </div>
                </div>

                <div className={styles.descriptionBox}>
                  {ticket.description}
                </div>

                {/* Super Admin Follow-up Note Section */}
                <div className={styles.notesSection}>
                  <div className={styles.notesHeader}>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <ShieldCheck size={13} color="#2563EB" />
                      <strong>Respuesta / Seguimiento de Super Admin:</strong>
                    </span>

                    {!isEditingNote && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteTicketId(ticket.id);
                          setCurrentNoteText(ticket.notes || "");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#2563EB",
                          fontSize: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Edit2 size={12} />
                        {ticket.notes ? "Editar nota" : "+ Agregar respuesta"}
                      </button>
                    )}
                  </div>

                  {isEditingNote ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <textarea
                        className={styles.notesInput}
                        rows={2}
                        placeholder="Escribe la respuesta o nota de seguimiento que verá el restaurante..."
                        value={currentNoteText}
                        onChange={(e) => setCurrentNoteText(e.target.value)}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingNoteTicketId(null)}
                          disabled={isSavingNote}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<Check size={12} />}
                          onClick={() => handleSaveNote(ticket.id)}
                          disabled={isSavingNote}
                        >
                          {isSavingNote ? "Guardando..." : "Guardar"}
                        </Button>
                      </div>
                    </div>
                  ) : ticket.notes ? (
                    <div className={styles.notesBox}>
                      <span>{ticket.notes}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontStyle: "italic" }}>
                      Sin respuesta aún. Haz clic en "+ Agregar respuesta" para responder al restaurante.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
