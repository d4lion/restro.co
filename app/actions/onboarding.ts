"use server";

import { getSession } from "@/lib/session";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { menuRepository } from "@/lib/repositories/menu.repository";
import { revalidatePath } from "next/cache";

export async function saveOnboardingAction(data: {
  restaurantName?: string;
  slogan?: string;
  phone?: string;
  logoUrl?: string;
  brandColor?: string;
  categoryName?: string;
  itemName?: string;
  itemPrice?: number;
}) {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión no encontrada" };

  try {
    // 1. Update Tenant Settings
    await tenantRepository.updateSettings(session.tenantId, {
      onboarding: true,
      ...(data.restaurantName ? { name: data.restaurantName } : {}),
      ...(data.slogan ? { description: data.slogan } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
      ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
      ...(data.brandColor ? { brandColor: data.brandColor } : {}),
    });

    // 2. Create Category & Initial Item if provided
    if (data.categoryName?.trim() && data.itemName?.trim() && data.itemPrice && data.itemPrice > 0) {
      const menu = await menuRepository.getFullMenu(session.tenantId);
      if (menu) {
        const category = await menuRepository.createCategory(session.tenantId, menu.id, {
          name: data.categoryName.trim(),
        });
        await menuRepository.createMenuItem(category.id, {
          name: data.itemName.trim(),
          price: data.itemPrice,
        });
      }
    }

    revalidatePath("/overview");
    revalidatePath("/menu");
    revalidatePath("/settings");

    return { success: true, message: "Configuración guardada correctamente" };
  } catch (error: any) {
    console.error("Error saving onboarding:", error);
    return { success: false, message: "No se pudo guardar la configuración" };
  }
}
