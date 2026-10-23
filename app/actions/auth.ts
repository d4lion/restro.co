"use server";

import { prisma } from "@/lib/prisma";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { createClient } from "@/lib/supabase/server";
import { deleteSession, revalidateUserSession } from "@/lib/session";
import { isDatabaseUnavailableError } from "@/lib/db-errors";

const DB_UNAVAILABLE_MESSAGE =
  "No pudimos conectarnos con nuestros servidores. Por favor intenta de nuevo en unos minutos.";

export type AuthActionResult = ({ errors?: Record<string, string[]>; message?: string; success?: boolean; redirectUrl?: string }) | undefined;

export async function loginAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { errors: { email: ["Email y contraseña requeridos"] } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { errors: { email: ["Credenciales incorrectas. Verifica tu email y contraseña."] } };
  }

  revalidateUserSession(data.user.id);

  return { success: true, redirectUrl: "/overview" };
}

export type RestaurantAvailabilityResult = {
  available: boolean;
  isNameTaken: boolean;
  isSlugTaken: boolean;
  slug: string;
  message?: string;
};

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function checkRestaurantAvailabilityAction(
  restaurantName: string,
  customSlug?: string
): Promise<RestaurantAvailabilityResult> {
  const trimmedName = (restaurantName ?? "").trim();
  const slug = normalizeSlug(customSlug?.trim() ? customSlug : trimmedName);

  if (!trimmedName || !slug) {
    return {
      available: false,
      isNameTaken: false,
      isSlugTaken: false,
      slug: "",
    };
  }

  try {
    const { isNameTaken, isSlugTaken, available } =
      await tenantRepository.checkNameAndSlugAvailability(trimmedName, slug);

    let message = "Nombre y enlace disponibles";
    if (isNameTaken && isSlugTaken) {
      message = "Este nombre de negocio y su enlace ya están registrados.";
    } else if (isNameTaken) {
      message = "Este nombre de negocio ya está tomado.";
    } else if (isSlugTaken) {
      message = `El enlace "/restaurant/${slug}" ya está tomado. Prueba otro nombre.`;
    }

    return {
      available,
      isNameTaken,
      isSlugTaken,
      slug,
      message,
    };
  } catch (err) {
    console.error("checkRestaurantAvailabilityAction failed:", err);
    return {
      available: true,
      isNameTaken: false,
      isSlugTaken: false,
      slug,
    };
  }
}

export async function registerAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const restaurantName = formData.get("restaurantName") as string;
  const rawSlug = formData.get("slug") as string;
  const slug = normalizeSlug(rawSlug || restaurantName || "");
  const country = (formData.get("country") as string) || "CO";
  const whatsapp = formData.get("whatsapp") as string;
  const monthlyOrders = (formData.get("monthlyOrders") as string) || "none";

  // Validate
  const errors: Record<string, string[]> = {};
  if (!name?.trim()) errors.name = ["Nombre requerido"];
  if (!email?.includes("@")) errors.email = ["Email inválido"];
  if (!password || password.length < 6) errors.password = ["Mínimo 6 caracteres"];
  if (!restaurantName?.trim()) errors.restaurantName = ["Nombre del restaurante requerido"];
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) errors.slug = ["Solo letras minúsculas, números y guiones"];

  if (Object.keys(errors).length > 0) return { errors };

  try {
    // Check restaurant name & slug availability in Prisma
    const { available, isNameTaken } = await tenantRepository.checkNameAndSlugAvailability(
      restaurantName.trim(),
      slug
    );
    if (!available) {
      const takenMsg = isNameTaken
        ? `El nombre "${restaurantName.trim()}" ya está tomado. Prueba agregando tu ciudad o sede.`
        : `El enlace "/restaurant/${slug}" ya está en uso. Prueba con otro nombre.`;
      return {
        errors: {
          restaurantName: [takenMsg],
          slug: [takenMsg],
        },
      };
    }

    // Check email in Prisma
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return { errors: { email: ["Ya existe una cuenta con este email"] } };
    }
  } catch (dbError) {
    console.error("registerAction: pre-signup DB check failed:", dbError);
    if (isDatabaseUnavailableError(dbError)) return { message: DB_UNAVAILABLE_MESSAGE };
    return { message: "Ocurrió un error inesperado. Intenta de nuevo." };
  }

  const supabase = await createClient();
  
  // Ensure any previous session from another tenant is signed out
  await deleteSession();
  
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
      country,
      phone: whatsapp,
      onboarding: false,
      monthlyOrders,
    });

    // Try signing in immediately (works if email confirmation is disabled or auto-confirmed)
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData?.session) {
      return { success: true, redirectUrl: "/onboarding" };
    }

    // If session is null (email confirmation required by Supabase Auth)
    return {
      success: true,
      message: `Te hemos enviado un correo de confirmación a ${email}. Por favor revisa tu bandeja de entrada para verificar tu cuenta y comenzar el onboarding.`,
    };
  } catch (dbError) {
    console.error("Failed to create tenant in DB after Supabase signup:", dbError);
    if (isDatabaseUnavailableError(dbError)) return { message: DB_UNAVAILABLE_MESSAGE };
    return { message: "Error creando el restaurante en la base de datos." };
  }
}

