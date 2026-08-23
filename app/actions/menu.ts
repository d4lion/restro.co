"use server";

import { getSession } from "@/lib/session";
import { menuRepository, RepoModifierGroup } from "@/lib/repositories/menu.repository";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { revalidateMenuCache } from "@/lib/cache";
import { revalidatePath } from "next/cache";

export type MenuActionResult = {
  success: boolean;
  message: string;
};

async function triggerMenuRevalidation(tenantId: string) {
  try {
    const tenant = await tenantRepository.findById(tenantId);
    if (tenant?.slug) {
      revalidateMenuCache(tenantId, tenant.slug);
    } else {
      revalidateMenuCache(tenantId);
    }
  } catch (error) {
    console.error("Error triggering menu revalidation", error);
  }
}

export async function toggleAvailabilityAction(
  itemId: string
): Promise<MenuActionResult> {
  if (!itemId) return { success: false, message: "Item inválido" };
  const session = await getSession();
  await menuRepository.toggleItemAvailability(itemId);
  if (session?.tenantId) {
    await triggerMenuRevalidation(session.tenantId);
  }
  revalidatePath("/menu");
  return { success: true, message: "Disponibilidad actualizada" };
}

export async function addCategoryAction(
  name: string
): Promise<MenuActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };
  if (!name?.trim()) return { success: false, message: "Nombre de categoría requerido" };

  const menu = await menuRepository.getFullMenu(session.tenantId);
  if (!menu) return { success: false, message: "Menú no encontrado" };

  await menuRepository.createCategory(session.tenantId, menu.id, { name: name.trim() });
  await triggerMenuRevalidation(session.tenantId);
  revalidatePath("/menu");
  return { success: true, message: `Categoría "${name}" creada` };
}

export async function updateCategoryAction(
  categoryId: string,
  name: string
): Promise<MenuActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };
  if (!categoryId || !name?.trim()) return { success: false, message: "Datos de categoría inválidos" };

  await menuRepository.updateCategory(categoryId, { name: name.trim() });
  await triggerMenuRevalidation(session.tenantId);
  revalidatePath("/menu");
  return { success: true, message: `Categoría actualizada a "${name}"` };
}

export async function deleteCategoryAction(
  categoryId: string
): Promise<MenuActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Sesión expirada" };
  if (!categoryId) return { success: false, message: "Categoría inválida" };

  await menuRepository.deleteCategory(categoryId);
  await triggerMenuRevalidation(session.tenantId);
  revalidatePath("/menu");
  return { success: true, message: "Categoría eliminada correctamente" };
}

export async function addItemAction(data: {
  categoryId: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  modifierGroups?: RepoModifierGroup[];
}): Promise<MenuActionResult> {
  const session = await getSession();
  if (!data.categoryId || !data.name || isNaN(data.price)) {
    return { success: false, message: "Categoría, nombre y precio son obligatorios" };
  }
  await menuRepository.createMenuItem(data.categoryId, {
    name: data.name.trim(),
    price: data.price,
    description: data.description?.trim() || "",
    imageUrl: data.imageUrl?.trim() || "",
    modifierGroups: data.modifierGroups,
  });
  if (session?.tenantId) {
    await triggerMenuRevalidation(session.tenantId);
  }
  revalidatePath("/menu");
  return { success: true, message: `Plato "${data.name}" creado` };
}

export async function updateItemAction(data: {
  itemId: string;
  categoryId?: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  modifierGroups?: RepoModifierGroup[];
}): Promise<MenuActionResult> {
  const session = await getSession();
  if (!data.itemId || !data.name || isNaN(data.price)) {
    return { success: false, message: "ID, nombre y precio son obligatorios" };
  }
  await menuRepository.updateMenuItem(data.itemId, {
    categoryId: data.categoryId,
    name: data.name.trim(),
    price: data.price,
    description: data.description?.trim() || "",
    imageUrl: data.imageUrl?.trim() || "",
    modifierGroups: data.modifierGroups,
    ...(typeof data.isAvailable === "boolean" ? { isAvailable: data.isAvailable } : {}),
  });
  if (session?.tenantId) {
    await triggerMenuRevalidation(session.tenantId);
  }
  revalidatePath("/menu");
  return { success: true, message: `Plato "${data.name}" actualizado` };
}

export async function deleteItemAction(
  itemId: string
): Promise<MenuActionResult> {
  if (!itemId) return { success: false, message: "Plato inválido" };
  const session = await getSession();
  await menuRepository.deleteMenuItem(itemId);
  if (session?.tenantId) {
    await triggerMenuRevalidation(session.tenantId);
  }
  revalidatePath("/menu");
  return { success: true, message: "Plato eliminado correctamente" };
}

// --- MODIFIERS ACTIONS ---

export async function createModifierGroupAction(data: {
  menuItemId: string;
  name: string;
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
}): Promise<MenuActionResult> {
  if (!data.menuItemId || !data.name?.trim()) return { success: false, message: "Nombre de grupo requerido" };
  const session = await getSession();
  await menuRepository.createModifierGroup(data.menuItemId, {
    name: data.name.trim(),
    isRequired: data.isRequired,
    minSelections: data.minSelections,
    maxSelections: data.maxSelections,
  });
  if (session?.tenantId) {
    await triggerMenuRevalidation(session.tenantId);
  }
  revalidatePath("/menu");
  return { success: true, message: `Grupo "${data.name}" agregado` };
}

export async function updateModifierGroupAction(data: {
  groupId: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
}): Promise<MenuActionResult> {
  if (!data.groupId || !data.name?.trim()) return { success: false, message: "Nombre requerido" };
  const session = await getSession();
  await menuRepository.updateModifierGroup(data.groupId, {
    name: data.name.trim(),
    isRequired: data.isRequired,
    minSelections: data.minSelections,
    maxSelections: data.maxSelections,
  });
  if (session?.tenantId) {
    await triggerMenuRevalidation(session.tenantId);
  }
  revalidatePath("/menu");
  return { success: true, message: `Grupo actualizado` };
}

export async function deleteModifierGroupAction(
  groupId: string
): Promise<MenuActionResult> {
  if (!groupId) return { success: false, message: "Grupo inválido" };
  const session = await getSession();
  await menuRepository.deleteModifierGroup(groupId);
  if (session?.tenantId) {
    await triggerMenuRevalidation(session.tenantId);
  }
  revalidatePath("/menu");
  return { success: true, message: "Grupo eliminado" };
}

export async function createModifierOptionAction(data: {
  groupId: string;
  name: string;
  priceExtra?: number;
}): Promise<MenuActionResult> {
  if (!data.groupId || !data.name?.trim()) return { success: false, message: "Nombre de opción requerido" };
  const session = await getSession();
  await menuRepository.createModifierOption(data.groupId, {
    name: data.name.trim(),
    priceExtra: data.priceExtra,
  });
  if (session?.tenantId) {
    await triggerMenuRevalidation(session.tenantId);
  }
  revalidatePath("/menu");
  return { success: true, message: `Opción "${data.name}" agregada` };
}

export async function updateModifierOptionAction(data: {
  optionId: string;
  name: string;
  priceExtra: number;
  isAvailable: boolean;
}): Promise<MenuActionResult> {
  if (!data.optionId || !data.name?.trim()) return { success: false, message: "Nombre de opción requerido" };
  const session = await getSession();
  await menuRepository.updateModifierOption(data.optionId, {
    name: data.name.trim(),
    priceExtra: data.priceExtra,
    isAvailable: data.isAvailable,
  });
  if (session?.tenantId) {
    await triggerMenuRevalidation(session.tenantId);
  }
  revalidatePath("/menu");
  return { success: true, message: `Opción actualizada` };
}

export async function deleteModifierOptionAction(
  optionId: string
): Promise<MenuActionResult> {
  if (!optionId) return { success: false, message: "Opción inválida" };
  const session = await getSession();
  await menuRepository.deleteModifierOption(optionId);
  if (session?.tenantId) {
    await triggerMenuRevalidation(session.tenantId);
  }
  revalidatePath("/menu");
  return { success: true, message: "Opción eliminada" };
}
