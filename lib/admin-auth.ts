import type { SessionPayload } from "@/lib/types";

/**
 * Checks if an email is listed in SUPERADMIN_EMAILS env variable or default admin list.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();

  const envList = (process.env.SUPERADMIN_EMAILS || "admin@restro.dev")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return envList.includes(normalized);
}

/**
 * Checks if the current session belongs to a Super Administrator.
 * A user is a Super Admin if:
 * 1. Their database role is "SUPERADMIN"
 * 2. OR their email is present in SUPERADMIN_EMAILS env or defaults.
 */
export function isSuperAdmin(session?: SessionPayload | null): boolean {
  if (!session) return false;
  if ((session.role as string) === "SUPERADMIN") return true;
  return isSuperAdminEmail(session.email);
}

/**
 * Asserts super admin privileges; throws if unauthorized.
 */
export function assertSuperAdmin(session?: SessionPayload | null): void {
  if (!session) {
    throw new Error("No autenticado. Inicia sesión con tu cuenta de administrador.");
  }
  if (!isSuperAdmin(session)) {
    throw new Error("Acceso denegado: Esta cuenta no tiene permisos de Super Administrador.");
  }
}
