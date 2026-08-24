"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { orderRepository } from "@/lib/repositories/order.repository";
import { revalidatePath, unstable_cache } from "next/cache";
import type { CreateOrderDto, OrderStatus, OrderWithItems } from "@/lib/types";

export type OrderActionResult = {
  success: boolean;
  message: string;
  orderId?: string;
  previousStatus?: OrderStatus;
};

export async function createPublicOrderAction(
  data: CreateOrderDto
): Promise<OrderActionResult> {
  try {
    if (!data.tenantId || !data.items || data.items.length === 0) {
      return { success: false, message: "Datos de orden inválidos" };
    }

    const order = await orderRepository.create(data);

    revalidatePath("/orders");
    revalidatePath("/overview");

    return {
      success: true,
      message: "Orden enviada a cocina",
      orderId: order.id,
    };
  } catch (error) {
    console.error("Error creating public order:", error);
    return { success: false, message: "Hubo un error procesando la orden" };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  nextStatus: OrderStatus
): Promise<OrderActionResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Sesión expirada" };

    if (!orderId || !nextStatus) {
      return { success: false, message: "Datos de actualización inválidos" };
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, orderNumber: true },
    });
    const previousStatus = currentOrder?.status as OrderStatus | undefined;

    await orderRepository.updateStatus(orderId, nextStatus, session.userId);

    revalidatePath("/orders");
    revalidatePath("/overview");

    return {
      success: true,
      message: `Comanda #${currentOrder?.orderNumber || ""} cambiada a ${nextStatus}`,
      previousStatus,
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, message: "Error actualizando el estado de la comanda" };
  }
}

export async function batchUpdateOrderStatusesAction(
  items: Array<{ orderId: string; nextStatus: OrderStatus }>
): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Sesión expirada", count: 0 };

    if (!items || items.length === 0) {
      return { success: true, message: "Sin cambios pendientes", count: 0 };
    }

    const payload = items.map((i) => ({ orderId: i.orderId, status: i.nextStatus }));
    await orderRepository.batchUpdateStatus(payload, session.userId);

    revalidatePath("/orders");
    revalidatePath("/overview");

    return {
      success: true,
      message: `${items.length} comanda(s) actualizadas en lote`,
      count: items.length,
    };
  } catch (error) {
    console.error("Error in batchUpdateOrderStatusesAction:", error);
    return { success: false, message: "Error procesando lote de comandas", count: 0 };
  }
}

export async function toggleOrderPriorityAction(
  orderId: string,
  isPriority?: boolean
): Promise<OrderActionResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Sesión expirada" };

    await orderRepository.togglePriority(orderId, isPriority);

    revalidatePath("/orders");
    return {
      success: true,
      message: "Prioridad de comanda actualizada",
    };
  } catch (error) {
    console.error("Error toggling order priority:", error);
    return { success: false, message: "No se pudo cambiar la prioridad" };
  }
}

export async function reportOrderIncidentAction(
  orderId: string,
  incidentNote: string
): Promise<OrderActionResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Sesión expirada" };

    if (!orderId || !incidentNote?.trim()) {
      return { success: false, message: "Descripción de incidencia requerida" };
    }

    await orderRepository.reportIncident(orderId, incidentNote.trim());

    revalidatePath("/orders");
    return {
      success: true,
      message: "Incidencia registrada correctamente",
    };
  } catch (error) {
    console.error("Error reporting incident:", error);
    return { success: false, message: "Error al registrar la incidencia" };
  }
}

export async function updateOrderItemStatusAction(
  itemId: string,
  status: string
): Promise<OrderActionResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Sesión expirada" };

    await orderRepository.updateItemStatus(itemId, status);

    revalidatePath("/orders");
    return {
      success: true,
      message: "Estado del producto actualizado",
    };
  } catch (error) {
    console.error("Error updating item status:", error);
    return { success: false, message: "Error actualizando producto" };
  }
}

export async function fetchKdsOrdersAction(): Promise<{
  success: boolean;
  orders: OrderWithItems[];
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!session) return { success: false, orders: [], message: "Sesión expirada" };

    const orders = await orderRepository.findByTenant(session.tenantId, 100);
    return { success: true, orders };
  } catch (error) {
    console.error("Error fetching KDS orders:", error);
    return { success: false, orders: [], message: "Error al consultar comandas" };
  }
}

export async function validateTableAction(
  tenantId: string,
  rawTableId: string
): Promise<{ valid: boolean; table: { id: string; name: string } | null }> {
  try {
    if (!tenantId || !rawTableId?.trim()) {
      return { valid: false, table: null };
    }

    const cleanParam = rawTableId.trim();

    const table = await unstable_cache(
      async () => {
        return prisma.table.findFirst({
          where: {
            tenantId,
            OR: [
              { id: cleanParam },
              { qrToken: cleanParam },
            ],
          },
          select: { id: true, name: true },
        });
      },
      [`table-val-${tenantId}-${cleanParam}`],
      { revalidate: 300 }
    )();

    if (!table) return { valid: false, table: null };
    return { valid: true, table };
  } catch (error) {
    console.error("Error validating table:", error);
    return { valid: false, table: null };
  }
}
