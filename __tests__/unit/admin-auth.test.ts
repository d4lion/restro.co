import { describe, it, expect } from "vitest";
import { isSuperAdminEmail, isSuperAdmin, assertSuperAdmin } from "@/lib/admin-auth";
import type { SessionPayload } from "@/lib/types";

describe("Admin Auth & Super Admin Guard", () => {
  it("should recognize default admin email as super admin", () => {
    expect(isSuperAdminEmail("admin@restro.dev")).toBe(true);
    expect(isSuperAdminEmail("ADMIN@RESTRO.DEV")).toBe(true);
  });

  it("should reject normal restaurant emails", () => {
    expect(isSuperAdminEmail("carlos@restaurant.com")).toBe(false);
    expect(isSuperAdminEmail("starter@restro.dev")).toBe(false);
    expect(isSuperAdminEmail(null)).toBe(false);
    expect(isSuperAdminEmail(undefined)).toBe(false);
  });

  it("should recognize session with SUPERADMIN role", () => {
    const session: SessionPayload = {
      userId: "user-123",
      email: "custom-admin@gmail.com",
      tenantId: "tenant-1",
      role: "SUPERADMIN",
      plan: "BUSINESS",
      planId: "plan-1",
      expiresAt: new Date(),
    };

    expect(isSuperAdmin(session)).toBe(true);
    expect(() => assertSuperAdmin(session)).not.toThrow();
  });

  it("should recognize session with superadmin email even if role is OWNER", () => {
    const session: SessionPayload = {
      userId: "user-123",
      email: "admin@restro.dev",
      tenantId: "tenant-1",
      role: "OWNER",
      plan: "STARTER",
      planId: "plan-1",
      expiresAt: new Date(),
    };

    expect(isSuperAdmin(session)).toBe(true);
    expect(() => assertSuperAdmin(session)).not.toThrow();
  });

  it("should reject and throw for normal tenant sessions", () => {
    const tenantSession: SessionPayload = {
      userId: "user-tenant",
      email: "pizzas@mimenu.com",
      tenantId: "tenant-pizza",
      role: "OWNER",
      plan: "CARTA_DIGITAL",
      planId: "plan-cd",
      expiresAt: new Date(),
    };

    expect(isSuperAdmin(tenantSession)).toBe(false);
    expect(() => assertSuperAdmin(tenantSession)).toThrow(/Acceso denegado/);
  });

  it("should throw for unauthenticated sessions", () => {
    expect(isSuperAdmin(null)).toBe(false);
    expect(() => assertSuperAdmin(null)).toThrow(/No autenticado/);
  });
});
