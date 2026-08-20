"use server";

import { getSession } from "@/lib/session";
import { menuRepository, RepoModifierGroup } from "@/lib/repositories/menu.repository";
import { revalidatePath } from "next/cache";

export type MenuActionResult = {
  success: boolean;
  message: string;
};

export async function toggleAvailabilityAction(
  itemId: string
): Promise<MenuActionResult> {
  if (!itemId) return { success: false, message: "Item inválido" };
  await menuRepository.toggleItemAvailability(itemId);
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
  revalidatePath("/menu");
  return { success: true, message: `Plato "${data.name}" actualizado` };
}

export async function deleteItemAction(
  itemId: string
): Promise<MenuActionResult> {
  if (!itemId) return { success: false, message: "Plato inválido" };
  await menuRepository.deleteMenuItem(itemId);
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
  await menuRepository.createModifierGroup(data.menuItemId, {
    name: data.name.trim(),
    isRequired: data.isRequired,
    minSelections: data.minSelections,
    maxSelections: data.maxSelections,
  });
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
  await menuRepository.updateModifierGroup(data.groupId, {
    name: data.name.trim(),
    isRequired: data.isRequired,
    minSelections: data.minSelections,
    maxSelections: data.maxSelections,
  });
  revalidatePath("/menu");
  return { success: true, message: `Grupo actualizado` };
}

export async function deleteModifierGroupAction(
  groupId: string
): Promise<MenuActionResult> {
  if (!groupId) return { success: false, message: "Grupo inválido" };
  await menuRepository.deleteModifierGroup(groupId);
  revalidatePath("/menu");
  return { success: true, message: "Grupo eliminado" };
}

export async function createModifierOptionAction(data: {
  groupId: string;
  name: string;
  priceExtra?: number;
}): Promise<MenuActionResult> {
  if (!data.groupId || !data.name?.trim()) return { success: false, message: "Nombre de opción requerido" };
  await menuRepository.createModifierOption(data.groupId, {
    name: data.name.trim(),
    priceExtra: data.priceExtra,
  });
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
  await menuRepository.updateModifierOption(data.optionId, {
    name: data.name.trim(),
    priceExtra: data.priceExtra,
    isAvailable: data.isAvailable,
  });
  revalidatePath("/menu");
  return { success: true, message: `Opción actualizada` };
}

export async function deleteModifierOptionAction(
  optionId: string
): Promise<MenuActionResult> {
  if (!optionId) return { success: false, message: "Opción inválida" };
  await menuRepository.deleteModifierOption(optionId);
  revalidatePath("/menu");
  return { success: true, message: "Opción eliminada" };
}
