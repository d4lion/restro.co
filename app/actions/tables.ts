"use server";

import { getSession } from "@/lib/session";
import { tableRepository } from "@/lib/repositories/table.repository";
import { planRepository } from "@/lib/repositories/plan.repository";
import { PLAN_LIMITS } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function createTableAction(data: { name: string; capacity?: number }) {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };
  if (!data.name?.trim()) return { success: false, message: "Nombre de mesa requerido" };

  const planInfo = await planRepository.getPlanForTenant(session.tenantId);
  const limits = planInfo?.limits ?? PLAN_LIMITS[session.plan ?? "STARTER"];

  if (Number.isFinite(limits.maxTables)) {
    const currentTablesCount = await tableRepository.countByTenant(session.tenantId);
    if (currentTablesCount >= limits.maxTables) {
      return {
        success: false,
        message: `Has alcanzado el límite de ${limits.maxTables} mesas de tu plan ${limits.label}. Mejora tu plan a Carta Digital ($9.900/mes) o superior para crear mesas y códigos QR ilimitados.`,
      };
    }
  }

  await tableRepository.create(session.tenantId, {
    name: data.name.trim(),
    capacity: data.capacity || 4,
  });

  revalidatePath("/tables");
  return { success: true, message: `Mesa "${data.name}" creada` };
}

export async function updateTableAction(
  tableId: string,
  data: { name: string; capacity?: number; isActive?: boolean }
) {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };
  if (!tableId || !data.name?.trim()) return { success: false, message: "Datos de mesa inválidos" };

  await tableRepository.update(tableId, {
    name: data.name.trim(),
    capacity: data.capacity || 4,
    isActive: data.isActive ?? true,
  });

  revalidatePath("/tables");
  return { success: true, message: `Mesa "${data.name}" actualizada` };
}

export async function deleteTableAction(tableId: string) {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };
  if (!tableId) return { success: false, message: "Mesa inválida" };

  await tableRepository.delete(tableId);

  revalidatePath("/tables");
  return { success: true, message: "Mesa eliminada" };
}

export async function bulkDeleteTablesAction(tableIds: string[]) {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };
  if (!tableIds || tableIds.length === 0) {
    return { success: false, message: "No se seleccionaron mesas para eliminar" };
  }

  const result = await tableRepository.deleteMany(tableIds, session.tenantId);

  revalidatePath("/tables");
  return {
    success: true,
    message: `${result.count} mesa(s) eliminada(s) correctamente`,
  };
}
