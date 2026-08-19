"use server";

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import type { FormState, StaffRole, PlanKey } from "@/lib/types";

// Simple hash for dev — use bcrypt in production
function hashPassword(p: string) {
  return createHash("sha256").update(p).digest("hex");
}

export type AuthActionResult = ({ errors?: Record<string, string[]>; message?: string; success?: boolean; redirectUrl?: string }) | undefined;

export async function loginAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { errors: { email: ["Email y contraseña requeridos"] } };
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { tenant: { include: { subscription: true } } },
  });

  if (!user || user.passwordHash !== hashPassword(password)) {
    return { errors: { email: ["Credenciales incorrectas. Verifica tu email y contraseña."] } };
  }

  await createSession({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role as StaffRole,
    plan: (user.tenant.plan as PlanKey),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { success: true, redirectUrl: "/overview" };
}

export async function registerAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const restaurantName = formData.get("restaurantName") as string;
  const slug = formData.get("slug") as string;

  // Validate
  const errors: Record<string, string[]> = {};
  if (!name?.trim()) errors.name = ["Nombre requerido"];
  if (!email?.includes("@")) errors.email = ["Email inválido"];
  if (!password || password.length < 6) errors.password = ["Mínimo 6 caracteres"];
  if (!restaurantName?.trim()) errors.restaurantName = ["Nombre del restaurante requerido"];
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) errors.slug = ["Solo letras minúsculas, números y guiones"];

  if (Object.keys(errors).length > 0) return { errors };

  // Check slug
  const slugAvailable = await tenantRepository.isSlugAvailable(slug);
  if (!slugAvailable) {
    return { errors: { slug: ["Este slug ya está en uso. Prueba otro."] } };
  }

  // Check email
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return { errors: { email: ["Ya existe una cuenta con este email"] } };
  }

  const { v4: uuidv4 } = await import("uuid");
  const userId = uuidv4();

  await tenantRepository.create({
    userId,
    userEmail: email.toLowerCase().trim(),
    userName: name.trim(),
    passwordHash: hashPassword(password),
    name: restaurantName.trim(),
    slug: slug.toLowerCase().trim(),
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
  });

  if (!user) return { message: "Error creando la cuenta. Intenta de nuevo." };

  await createSession({
    userId: user.id,
    tenantId: user.tenantId,
    role: "OWNER",
    plan: "STARTER",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { success: true, redirectUrl: "/onboarding" };
}
