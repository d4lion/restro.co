"use server";

import { getSession } from "@/lib/session";
import { menuRepository } from "@/lib/repositories/menu.repository";
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
}): Promise<MenuActionResult> {
  if (!data.categoryId || !data.name || isNaN(data.price)) {
    return { success: false, message: "Nombre y precio son obligatorios" };
  }
  await menuRepository.createMenuItem(data.categoryId, {
    name: data.name,
    price: data.price,
    description: data.description,
    imageUrl: data.imageUrl,
  });
  revalidatePath("/menu");
  return { success: true, message: `Plato "${data.name}" agregado` };
}

export async function updateItemAction(data: {
  itemId: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
}): Promise<MenuActionResult> {
  if (!data.itemId || !data.name || isNaN(data.price)) {
    return { success: false, message: "ID, nombre y precio son obligatorios" };
  }
  await menuRepository.updateMenuItem(data.itemId, {
    name: data.name.trim(),
    price: data.price,
    description: data.description?.trim() || "",
    imageUrl: data.imageUrl?.trim() || "",
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
