"use server";

import { getSession, deleteSession } from "@/lib/session";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SettingsActionResult = {
  success: boolean;
  message: string;
};

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
    description: description ? description.trim() : undefined,
    phone: phone ? phone.trim() : undefined,
    address: address ? address.trim() : undefined,
    city: city ? city.trim() : undefined,
  });

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
    logoUrl: logoUrl ? logoUrl.trim() : undefined,
    coverUrl: coverUrl ? coverUrl.trim() : undefined,
    brandColor: brandColor ? brandColor.trim() : undefined,
    instagramUrl: instagramUrl ? instagramUrl.trim() : undefined,
    facebookUrl: facebookUrl ? facebookUrl.trim() : undefined,
    tiktokUrl: tiktokUrl ? tiktokUrl.trim() : undefined,
    websiteUrl: websiteUrl ? websiteUrl.trim() : undefined,
  });

  revalidatePath("/settings");
  revalidatePath("/overview");
  revalidatePath("/restaurant/[slug]", "page");

  return { success: true, message: "¡Perfil comercial actualizado correctamente!" };
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

export async function updateOrderSettingsAction(
  allowDineIn: boolean,
  allowTakeout: boolean,
  allowDelivery: boolean
): Promise<SettingsActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };

  await tenantRepository.updateSettings(session.tenantId, {
    allowDineIn,
    allowTakeout,
    allowDelivery,
  });

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
    revalidatePath("/settings");
    revalidatePath("/overview");
    return { success: true, message: "Horarios de atención actualizados" };
  } catch (error) {
    console.error("Failed to update business hours:", error);
    return { success: false, message: "No se pudieron actualizar los horarios" };
  }
}
