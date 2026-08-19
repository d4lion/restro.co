"use server";

import { prisma } from "@/lib/prisma";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { errors: { email: ["Credenciales incorrectas. Verifica tu email y contraseña."] } };
  }

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

  // Check slug in Prisma
  const slugAvailable = await tenantRepository.isSlugAvailable(slug);
  if (!slugAvailable) {
    return { errors: { slug: ["Este slug ya está en uso. Prueba otro."] } };
  }

  // Check email in Prisma
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return { errors: { email: ["Ya existe una cuenta con este email"] } };
  }

  const supabase = await createClient();
  
  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      }
    }
  });

  if (authError || !authData.user) {
    return { message: authError?.message || "Error al crear la cuenta en Supabase. Intenta de nuevo." };
  }

  try {
    // Create Tenant and User mapping in Prisma
    await tenantRepository.create({
      userId: authData.user.id, // We use the Supabase Auth UUID as the Prisma User ID
      userEmail: email.toLowerCase().trim(),
      userName: name.trim(),
      name: restaurantName.trim(),
      slug: slug.toLowerCase().trim(),
    });
  } catch (dbError) {
    console.error("Failed to create tenant in DB after Supabase signup:", dbError);
    return { message: "Error creando el restaurante en la base de datos." };
  }

  return { success: true, redirectUrl: "/onboarding" };
}

