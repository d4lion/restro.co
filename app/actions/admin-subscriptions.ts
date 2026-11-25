"use server";

import { getSession, revalidateUserSession } from "@/lib/session";
import { subscriptionAdminRepository } from "@/lib/repositories/subscription-admin.repository";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { revalidateTenantCache, revalidateMenuCache } from "@/lib/cache";
import { revalidatePath } from "next/cache";
import type { PlanKey } from "@/lib/types";

import { assertSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export type AdminActionResult<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

async function verifyAdminAuth() {
  const session = await getSession();
  assertSuperAdmin(session);
  return session!;
}

async function revalidateTenantUsersAndPaths(tenantId: string, slug?: string) {
  try {
    if (slug) {
      revalidateTenantCache(slug);
      revalidateMenuCache(tenantId, slug);
    }
    const tenantUsers = await prisma.user.findMany({
      where: { tenantId },
      select: { id: true },
    });
    for (const u of tenantUsers) {
      revalidateUserSession(u.id);
    }
    revalidatePath("/a/g/s");
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("Failed to revalidate tenant users cache:", err);
  }
}

/**
 * Extend a subscription by a number of days or custom end date.
 */
export async function extendSubscriptionAction(params: {
  subscriptionId: string;
  tenantId: string;
  daysToAdd: number;
  newEndDate?: string;
  note?: string;
  amount?: number;
}): Promise<AdminActionResult> {
  try {
    const session = await verifyAdminAuth();

    await subscriptionAdminRepository.extendSubscription({
      subscriptionId: params.subscriptionId,
      daysToAdd: params.daysToAdd,
      newEndDate: params.newEndDate ? new Date(params.newEndDate) : undefined,
      note: params.note,
      amount: params.amount,
      actor: session.userId,
    });

    const tenant = await tenantRepository.findById(params.tenantId);
    await revalidateTenantUsersAndPaths(params.tenantId, tenant?.slug);

    return {
      success: true,
      message: `Suscripción extendida exitosamente (+${params.daysToAdd} días)`,
    };
  } catch (error) {
    console.error("Failed to extend subscription:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al extender suscripción",
    };
  }
}

/**
 * Explicitly edit subscription start date, expiration date, and lifecycle status.
 */
export async function updateSubscriptionDatesAction(params: {
  subscriptionId: string;
  tenantId: string;
  startDate: string | null;
  endDate: string | null;
  trialEndsAt?: string | null;
  status: string;
  note?: string;
}): Promise<AdminActionResult> {
  try {
    const session = await verifyAdminAuth();

    await subscriptionAdminRepository.updateSubscriptionDates({
      subscriptionId: params.subscriptionId,
      startDate: params.startDate ? new Date(params.startDate) : null,
      endDate: params.endDate ? new Date(params.endDate) : null,
      trialEndsAt: params.trialEndsAt ? new Date(params.trialEndsAt) : null,
      status: params.status,
      note: params.note,
      actor: session.userId,
    });

    const tenant = await tenantRepository.findById(params.tenantId);
    await revalidateTenantUsersAndPaths(params.tenantId, tenant?.slug);

    return {
      success: true,
      message: "Fechas y estado de la suscripción actualizados correctamente",
    };
  } catch (error) {
    console.error("Failed to update subscription dates:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al actualizar fechas",
    };
  }
}

/**
 * Upgrade or change a tenant's plan from the admin management panel.
 */
export async function changeTenantPlanAdminAction(params: {
  tenantId: string;
  newPlanKey: PlanKey;
  resetCycle: boolean;
  cycleDays?: number;
  note?: string;
}): Promise<AdminActionResult> {
  try {
    const session = await verifyAdminAuth();

    await subscriptionAdminRepository.changeTenantPlanAdmin({
      tenantId: params.tenantId,
      newPlanKey: params.newPlanKey,
      resetCycle: params.resetCycle,
      cycleDays: params.cycleDays,
      note: params.note,
      actor: session.userId,
    });

    const tenant = await tenantRepository.findById(params.tenantId);
    await revalidateTenantUsersAndPaths(params.tenantId, tenant?.slug);

    return {
      success: true,
      message: `Plan actualizado a ${params.newPlanKey} correctamente`,
    };
  } catch (error) {
    console.error("Failed to change plan:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al cambiar de plan",
    };
  }
}

/**
 * Grant or override a specific feature permission for a tenant.
 */
export async function saveFeatureOverrideAction(params: {
  tenantId: string;
  feature: string;
  value: string;
  reason?: string;
  expiresAt?: string | null;
}): Promise<AdminActionResult> {
  try {
    const session = await verifyAdminAuth();

    await subscriptionAdminRepository.setFeatureOverride({
      tenantId: params.tenantId,
      feature: params.feature,
      value: params.value,
      reason: params.reason,
      expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
      actor: session.userId,
    });

    const tenant = await tenantRepository.findById(params.tenantId);
    await revalidateTenantUsersAndPaths(params.tenantId, tenant?.slug);

    return {
      success: true,
      message: `Permiso '${params.feature}' actualizado a: ${params.value}`,
    };
  } catch (error) {
    console.error("Failed to save feature override:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al guardar permiso",
    };
  }
}

/**
 * Remove a specific feature override for a tenant (restores default plan limit).
 */
export async function removeFeatureOverrideAction(params: {
  tenantId: string;
  feature: string;
}): Promise<AdminActionResult> {
  try {
    const session = await verifyAdminAuth();

    await subscriptionAdminRepository.removeFeatureOverride({
      tenantId: params.tenantId,
      feature: params.feature,
      actor: session.userId,
    });

    const tenant = await tenantRepository.findById(params.tenantId);
    await revalidateTenantUsersAndPaths(params.tenantId, tenant?.slug);

    return {
      success: true,
      message: `Permiso '${params.feature}' restablecido al valor por defecto del plan`,
    };
  } catch (error) {
    console.error("Failed to remove feature override:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al restablecer permiso",
    };
  }
}

/**
 * Toggle restaurant active / suspended state.
 */
export async function toggleTenantStatusAction(params: {
  tenantId: string;
  isActive: boolean;
  reason?: string;
}): Promise<AdminActionResult> {
  try {
    const session = await verifyAdminAuth();

    await subscriptionAdminRepository.updateTenantSettings({
      tenantId: params.tenantId,
      isActive: params.isActive,
      reason: params.reason,
      actor: session.userId,
    });

    const tenant = await tenantRepository.findById(params.tenantId);
    await revalidateTenantUsersAndPaths(params.tenantId, tenant?.slug);

    return {
      success: true,
      message: `Restaurante ${params.isActive ? "activado" : "suspendido"} correctamente`,
    };
  } catch (error) {
    console.error("Failed to toggle tenant status:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al cambiar estado",
    };
  }
}

/**
 * Update restaurant ordering capabilities (dine in, takeout, delivery, WhatsApp ordering).
 */
export async function updateTenantCapabilitiesAction(params: {
  tenantId: string;
  allowDineIn?: boolean;
  allowTakeout?: boolean;
  allowDelivery?: boolean;
  isMenuOnly?: boolean;
  allowWhatsAppOrdering?: boolean;
  whatsappNumber?: string | null;
}): Promise<AdminActionResult> {
  try {
    const session = await verifyAdminAuth();

    await subscriptionAdminRepository.updateTenantSettings({
      tenantId: params.tenantId,
      allowDineIn: params.allowDineIn,
      allowTakeout: params.allowTakeout,
      allowDelivery: params.allowDelivery,
      isMenuOnly: params.isMenuOnly,
      allowWhatsAppOrdering: params.allowWhatsAppOrdering,
      whatsappNumber: params.whatsappNumber,
      actor: session.userId,
    });

    const tenant = await tenantRepository.findById(params.tenantId);
    await revalidateTenantUsersAndPaths(params.tenantId, tenant?.slug);

    return {
      success: true,
      message: "Capacidades del restaurante actualizadas correctamente",
    };
  } catch (error) {
    console.error("Failed to update tenant capabilities:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al actualizar capacidades",
    };
  }
}

/**
 * Fetch complete audit events for a subscription.
 */
export async function getSubscriptionAuditHistoryAction(
  subscriptionId: string
): Promise<AdminActionResult<Array<{
  id: string;
  createdAt: string;
  type: string;
  amount: number | null;
  currency: string;
  note: string | null;
  metadata: Record<string, unknown> | null;
}>>> {
  try {
    await verifyAdminAuth();

    const events = await subscriptionAdminRepository.getSubscriptionEvents(subscriptionId);

    const formatted = events.map((e) => {
      let meta: Record<string, unknown> | null = null;
      if (e.metadata) {
        try {
          meta = JSON.parse(e.metadata);
        } catch {
          meta = null;
        }
      }
      return {
        id: e.id,
        createdAt: e.createdAt.toISOString(),
        type: e.type,
        amount: e.amount,
        currency: e.currency,
        note: e.note,
        metadata: meta,
      };
    });

    return {
      success: true,
      message: "Historial cargado",
      data: formatted,
    };
  } catch (error) {
    console.error("Failed to get audit history:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al cargar historial",
    };
  }
}
