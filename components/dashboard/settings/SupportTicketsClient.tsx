"use client";

import React, { useState } from "react";
import {
  LifeBuoy,
  Plus,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/subscription-utils";
import type { SupportTicketRecord } from "@/lib/repositories/support-ticket.repository";
import { createTenantSupportTicketAction } from "@/app/actions/support-tickets";
import { toast } from "sonner";
import styles from "./SupportTicketsClient.module.css";

interface Props {
  initialTickets: SupportTicketRecord[];
  restaurantName: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "General",
  TECHNICAL: "Soporte Técnico",
  BILLING: "Facturación & Pagos",
  FEATURE_REQUEST: "Solicitud de Función",
  ONBOARDING: "Configuración & Ayuda",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierto (En espera)",
  IN_PROGRESS: "En Atención",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

export function SupportTicketsClient({ initialTickets, restaurantName }: Props) {
  const [tickets, setTickets] = useState<SupportTicketRecord[]>(initialTickets);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<
    "TECHNICAL" | "BILLING" | "FEATURE_REQUEST" | "ONBOARDING" | "GENERAL"
  >("TECHNICAL");
  const [priority, setPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  >("MEDIUM");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Por favor completa el título y la descripción del ticket");
      return;
    }

    setIsSubmitting(true);
    const res = await createTenantSupportTicketAction({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
    });
    setIsSubmitting(false);

    if (res.success && res.data) {
      toast.success(res.message);
      setTickets([res.data, ...tickets]);
      setIsCreating(false);
      setTitle("");
      setDescription("");
      setCategory("TECHNICAL");
      setPriority("MEDIUM");
    } else {
      toast.error(res.message || "Error al enviar el ticket");
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h2 className={styles.title}>Centro de Soporte & Reporte de Novedades</h2>
          <p className={styles.subtitle}>
            Canal directo para resolver dudas técnicas, consultar sobre tu facturación o reportar incidencias de {restaurantName}.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button
            size="sm"
            variant={isCreating ? "ghost" : "primary"}
            icon={isCreating ? <X size={14} /> : <Plus size={14} />}
            onClick={() => setIsCreating(!isCreating)}
          >
            {isCreating ? "Cancelar" : "Nuevo Ticket / Novedad"}
          </Button>
        </div>
      </div>

      {/* Ticket Creation Form */}
      {isCreating && (
        <form onSubmit={handleSubmit} className={styles.formCard}>
          <h3 className={styles.formTitle}>Registrar Solicitud o Incidencia</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>Título del Caso o Novedad</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ej: Duda con impresora de comandas / Solicitud de factura"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Categoría</label>
              <select
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                <option value="TECHNICAL">Soporte Técnico / Comandas / QR</option>
                <option value="BILLING">Facturación / Suscripción / Pagos</option>
                <option value="FEATURE_REQUEST">Solicitud de Nueva Función</option>
                <option value="ONBOARDING">Configuración Inicial / Ayuda</option>
                <option value="GENERAL">Consulta General</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Urgencia Operativa</label>
              <select
                className={styles.select}
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="LOW">Baja — Consulta general sin impacto operativo</option>
                <option value="MEDIUM">Media — Requiere atención en el transcurso del día</option>
                <option value="HIGH">Alta — Afecta la toma de pedidos</option>
                <option value="URGENT">Urgente — Restaurante detenido / Bloqueo crítico</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Descripción Detallada</label>
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder="Describe lo ocurrido con el mayor detalle posible (dispositivo, qué intentabas hacer, mensaje de error)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsCreating(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              icon={<Send size={13} />}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar a Soporte"}
            </Button>
          </div>
        </form>
      )}

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className={styles.emptyCard}>
          <LifeBuoy size={32} color="#94A3B8" />
          <h4 className={styles.emptyTitle}>No tienes tickets o novedades registradas</h4>
          <p className={styles.emptyText}>
            Si presentas cualquier novedad con tu menú, mesas, pedidos o suscripción, crea un ticket con el botón superior para que nuestro equipo lo revise de inmediato.
          </p>
          <Button
            size="sm"
            variant="outline"
            icon={<Plus size={14} />}
            onClick={() => setIsCreating(true)}
          >
            Registrar Primer Ticket
          </Button>
        </div>
      ) : (
        <div className={styles.ticketsList}>
          {tickets.map((t) => (
            <div key={t.id} className={styles.ticketCard}>
              <div className={styles.ticketHeader}>
                <div className={styles.ticketTitleGroup}>
                  <h4 className={styles.ticketTitle}>{t.title}</h4>
                  <div className={styles.ticketMeta}>
                    <span>Radicado el {formatDateTime(t.createdAt)}</span>
                    {t.authorName && <span>• Por: {t.authorName}</span>}
                  </div>
                </div>

                <div className={styles.badgesGroup}>
                  <span className={`${styles.badge} ${styles["badge--category"]}`}>
                    {CATEGORY_LABELS[t.category] || t.category}
                  </span>
                  <span className={`${styles.badge} ${styles[`badge--${t.priority}`]}`}>
                    {t.priority}
                  </span>
                  <span className={`${styles.badge} ${styles[`badge--${t.status}`]}`}>
                    {STATUS_LABELS[t.status] || t.status}
                  </span>
                </div>
              </div>

              <p className={styles.descriptionText}>{t.description}</p>

              {t.notes && (
                <div className={styles.adminNoteBox}>
                  <span className={styles.adminNoteHeader}>
                    <ShieldCheck size={12} /> Respuesta del Equipo de Soporte Restro:
                  </span>
                  <span>{t.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
