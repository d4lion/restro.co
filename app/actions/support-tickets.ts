"use server";

import { getSession } from "@/lib/session";
import { assertSuperAdmin } from "@/lib/admin-auth";
import {
  supportTicketRepository,
  type SupportTicketRecord,
  type TicketStatus,
  type TicketPriority,
  type TicketCategory,
} from "@/lib/repositories/support-ticket.repository";
import { revalidatePath } from "next/cache";

export type TicketActionResult<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

async function verifyAdminAuth() {
  const session = await getSession();
  assertSuperAdmin(session);
  return session!;
}

export async function getTenantTicketsAction(
  tenantId: string
): Promise<TicketActionResult<SupportTicketRecord[]>> {
  try {
    await verifyAdminAuth();
    const tickets = await supportTicketRepository.findByTenantId(tenantId);
    return { success: true, message: "Tickets obtenidos con éxito", data: tickets };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener tickets";
    return { success: false, message: msg };
  }
}

export async function getRecentTicketsAction(
  limit = 10
): Promise<TicketActionResult<SupportTicketRecord[]>> {
  try {
    await verifyAdminAuth();
    const tickets = await supportTicketRepository.findRecent(limit);
    return { success: true, message: "Tickets recientes obtenidos", data: tickets };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener tickets";
    return { success: false, message: msg };
  }
}

export async function getTicketStatsAction(): Promise<
  TicketActionResult<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    urgent: number;
  }>
> {
  try {
    await verifyAdminAuth();
    const stats = await supportTicketRepository.getStats();
    return { success: true, message: "Estadísticas obtenidas", data: stats };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener estadísticas";
    return { success: false, message: msg };
  }
}

export async function createSupportTicketAction(params: {
  tenantId: string;
  title: string;
  description: string;
  priority?: TicketPriority;
  category?: TicketCategory;
  authorName?: string;
  notes?: string;
}): Promise<TicketActionResult<SupportTicketRecord>> {
  try {
    const session = await verifyAdminAuth();

    if (!params.tenantId || !params.title?.trim() || !params.description?.trim()) {
      return {
        success: false,
        message: "El tenant, título y descripción son requeridos.",
      };
    }

    const ticket = await supportTicketRepository.create({
      tenantId: params.tenantId,
      title: params.title,
      description: params.description,
      priority: params.priority || "MEDIUM",
      category: params.category || "GENERAL",
      authorName: params.authorName || session.email || "Super Admin",
      notes: params.notes,
    });

    revalidatePath("/a/g/s");
    return {
      success: true,
      message: "Ticket registrado correctamente.",
      data: ticket,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al crear ticket";
    return { success: false, message: msg };
  }
}

export async function updateSupportTicketStatusAction(params: {
  id: string;
  status: TicketStatus;
  notes?: string;
}): Promise<TicketActionResult<SupportTicketRecord>> {
  try {
    await verifyAdminAuth();

    if (!params.id || !params.status) {
      return { success: false, message: "ID y estado requeridos." };
    }

    const ticket = await supportTicketRepository.update(params.id, {
      status: params.status,
      notes: params.notes,
    });

    revalidatePath("/a/g/s");
    return {
      success: true,
      message: `Ticket actualizado a estado: ${params.status}`,
      data: ticket,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al actualizar ticket";
    return { success: false, message: msg };
  }
}

export async function updateSupportTicketNoteAction(params: {
  id: string;
  notes: string;
}): Promise<TicketActionResult<SupportTicketRecord>> {
  try {
    await verifyAdminAuth();

    if (!params.id) {
      return { success: false, message: "ID requerido." };
    }

    const ticket = await supportTicketRepository.update(params.id, {
      notes: params.notes,
    });

    revalidatePath("/a/g/s");
    revalidatePath("/settings/support");

    return {
      success: true,
      message: "Nota de seguimiento guardada.",
      data: ticket,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al guardar nota";
    return { success: false, message: msg };
  }
}

/**
 * Tenant-facing action: allows store owner / manager to report an issue or create a ticket.
 */
export async function createTenantSupportTicketAction(params: {
  title: string;
  description: string;
  priority?: TicketPriority;
  category?: TicketCategory;
}): Promise<TicketActionResult<SupportTicketRecord>> {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return {
        success: false,
        message: "Debes iniciar sesión para registrar una novedad.",
      };
    }

    if (!params.title?.trim() || !params.description?.trim()) {
      return {
        success: false,
        message: "El título y la descripción son requeridos.",
      };
    }

    const ticket = await supportTicketRepository.create({
      tenantId: session.tenantId,
      title: params.title,
      description: params.description,
      priority: params.priority || "MEDIUM",
      category: params.category || "GENERAL",
      authorName: session.email || "Restaurante",
    });

    revalidatePath("/settings/support");
    revalidatePath("/a/g/s");

    return {
      success: true,
      message: "Tu ticket ha sido registrado correctamente. El equipo de soporte lo atenderá a la brevedad.",
      data: ticket,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al crear ticket de soporte";
    return { success: false, message: msg };
  }
}

/**
 * Tenant-facing query: fetch tickets for the currently logged in tenant.
 */
export async function getTenantSelfTicketsAction(): Promise<
  TicketActionResult<SupportTicketRecord[]>
> {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return { success: false, message: "No autenticado" };
    }

    const tickets = await supportTicketRepository.findByTenantId(session.tenantId);
    return { success: true, message: "Tickets obtenidos", data: tickets };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener tickets";
    return { success: false, message: msg };
  }
}

