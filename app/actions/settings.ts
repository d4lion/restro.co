"use server";

import { getSession, deleteSession } from "@/lib/session";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SettingsActionResult = {
  success: boolean;
  message: string;
};

export async function updateRestaurantAction(
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
    name,
    description,
    phone,
    address,
    city,
  });

  revalidatePath("/settings");
  return { success: true, message: "¡Perfil actualizado correctamente!" };
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
