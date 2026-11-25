"use server";

import { getSession } from "@/lib/session";
import { assertSuperAdmin } from "@/lib/admin-auth";
import { platformAdminRepository } from "@/lib/repositories/platform-admin.repository";
import { revalidatePath } from "next/cache";
import type { StaffRole } from "@/lib/types";

export type AdminActionResult<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

async function verifySuperAdmin() {
  const session = await getSession();
  assertSuperAdmin(session);
  return session!;
}

export async function updateUserRoleAction(params: {
  userId: string;
  newRole: StaffRole;
}): Promise<AdminActionResult> {
  try {
    const session = await verifySuperAdmin();

    await platformAdminRepository.updateUserRole({
      userId: params.userId,
      newRole: params.newRole,
      actor: session.email || session.userId,
    });

    revalidatePath("/a/g/s");
    return { success: true, message: `Rol actualizado a ${params.newRole} correctamente` };
  } catch (err) {
    console.error("updateUserRoleAction error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Error al actualizar rol" };
  }
}

export async function updateUserDetailsAction(params: {
  userId: string;
  name: string;
  email: string;
}): Promise<AdminActionResult> {
  try {
    const session = await verifySuperAdmin();

    await platformAdminRepository.updateUserDetails({
      userId: params.userId,
      name: params.name,
      email: params.email,
      actor: session.email || session.userId,
    });

    revalidatePath("/a/g/s");
    return { success: true, message: "Datos de usuario actualizados correctamente" };
  } catch (err) {
    console.error("updateUserDetailsAction error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Error al actualizar datos" };
  }
}

export async function changeUserPasswordAction(params: {
  userId: string;
  newPassword: string;
}): Promise<AdminActionResult> {
  try {
    const session = await verifySuperAdmin();

    await platformAdminRepository.changeUserPassword({
      userId: params.userId,
      newPassword: params.newPassword,
      actor: session.email || session.userId,
    });

    revalidatePath("/a/g/s");
    return { success: true, message: "Contraseña actualizada exitosamente" };
  } catch (err) {
    console.error("changeUserPasswordAction error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Error al cambiar contraseña" };
  }
}

export async function createAccountForTenantAction(params: {
  tenantId: string;
  email: string;
  password: string;
  name: string;
  role: StaffRole;
}): Promise<AdminActionResult> {
  try {
    const session = await verifySuperAdmin();

    await platformAdminRepository.createAccountForTenant({
      tenantId: params.tenantId,
      email: params.email,
      password: params.password,
      name: params.name,
      role: params.role,
      actor: session.email || session.userId,
    });

    revalidatePath("/a/g/s");
    return { success: true, message: "Cuenta de usuario creada exitosamente" };
  } catch (err) {
    console.error("createAccountForTenantAction error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Error al crear cuenta" };
  }
}

export async function deleteUserAction(params: {
  userId: string;
}): Promise<AdminActionResult> {
  try {
    const session = await verifySuperAdmin();

    await platformAdminRepository.deleteUser({
      userId: params.userId,
      actor: session.email || session.userId,
    });

    revalidatePath("/a/g/s");
    return { success: true, message: "Cuenta de usuario eliminada correctamente" };
  } catch (err) {
    console.error("deleteUserAction error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Error al eliminar usuario" };
  }
}
