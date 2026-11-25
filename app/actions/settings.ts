"use server";

import { getSession, deleteSession, revalidateUserSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { planRepository } from "@/lib/repositories/plan.repository";
import { PLAN_LIMITS, type PlanKey } from "@/lib/types";
import { revalidateTenantCache, revalidateMenuCache } from "@/lib/cache";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SettingsActionResult = {
  success: boolean;
  message: string;
};

export async function changePlanAction(_planKey: PlanKey): Promise<SettingsActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };

  // Self-service plan changes are disabled: plans can only be modified by SuperAdmin
  // or a verified payment gateway webhook.
  return {
    success: false,
    message: "El cambio de plan se gestiona directamente por WhatsApp con nuestro equipo.",
  };
}

export async function updateLocalDataAction(
  formData: FormData
): Promise<SettingsActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;

  if (!name?.trim()) {
    return { success: false, message: "El nombre del restaurante es requerido" };
  }

  await tenantRepository.updateSettings(session.tenantId, {
    name: name.trim(),
    description: description?.trim() || null,
    phone: phone?.trim() || null,
    address: address?.trim() || null,
    city: city?.trim() || null,
  });

  const tenant = await tenantRepository.findById(session.tenantId);
  if (tenant?.slug) {
    revalidateTenantCache(tenant.slug);
    revalidateMenuCache(session.tenantId, tenant.slug);
  }

  revalidatePath("/settings");
  revalidatePath("/overview");

  return { success: true, message: "¡Datos del local actualizados correctamente!" };
}

export async function updateCommercialProfileAction(
  formData: FormData
): Promise<SettingsActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };

  const logoUrl = formData.get("logoUrl") as string;
  const coverUrl = formData.get("coverUrl") as string;
  const brandColor = formData.get("brandColor") as string;
  const instagramUrl = formData.get("instagramUrl") as string;
  const facebookUrl = formData.get("facebookUrl") as string;
  const tiktokUrl = formData.get("tiktokUrl") as string;
  const websiteUrl = formData.get("websiteUrl") as string;

  await tenantRepository.updateSettings(session.tenantId, {
    logoUrl: logoUrl?.trim() || null,
    coverUrl: coverUrl?.trim() || null,
    brandColor: brandColor?.trim() || "#FF6B35",
    instagramUrl: instagramUrl?.trim() || null,
    facebookUrl: facebookUrl?.trim() || null,
    tiktokUrl: tiktokUrl?.trim() || null,
    websiteUrl: websiteUrl?.trim() || null,
  });

  const tenant = await tenantRepository.findById(session.tenantId);
  if (tenant?.slug) {
    revalidateTenantCache(tenant.slug);
    revalidateMenuCache(session.tenantId, tenant.slug);
  }

  revalidatePath("/settings");
  revalidatePath("/overview");

  return { success: true, message: "¡Perfil comercial actualizado correctamente!" };
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

export async function updateOrderSettingsAction(
  allowDineIn: boolean,
  allowTakeout: boolean,
  allowDelivery: boolean,
  isMenuOnly: boolean = false,
  requireTableQrForDineIn: boolean = true,
  allowWhatsAppOrdering: boolean = false,
  whatsappNumber: string | null = null
): Promise<SettingsActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };

  await tenantRepository.updateSettings(session.tenantId, {
    allowDineIn,
    allowTakeout,
    allowDelivery,
    isMenuOnly,
    requireTableQrForDineIn,
    allowWhatsAppOrdering,
    whatsappNumber: whatsappNumber?.trim() || null,
  });

  const tenant = await tenantRepository.findById(session.tenantId);
  if (tenant?.slug) {
    revalidateTenantCache(tenant.slug);
    revalidateMenuCache(session.tenantId, tenant.slug);
  }

  revalidatePath("/settings");
  revalidatePath("/overview");

  return { success: true, message: "Ajustes de pedidos actualizados correctamente" };
}

export async function updateBusinessHoursAction(
  hours: Array<{ dayOfWeek: number; openTime: string; closeTime: string }>
): Promise<SettingsActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };

  try {
    await tenantRepository.updateBusinessHours(session.tenantId, hours);

    const tenant = await tenantRepository.findById(session.tenantId);
    if (tenant?.slug) {
      revalidateTenantCache(tenant.slug);
      revalidateMenuCache(session.tenantId, tenant.slug);
    }

    revalidatePath("/settings");
    revalidatePath("/overview");
    return { success: true, message: "Horarios de atención actualizados" };
  } catch (error) {
    console.error("Failed to update business hours:", error);
    return { success: false, message: "No se pudieron actualizar los horarios" };
  }
}
