import { describe, it, expect } from "vitest";
import {
  ORDER_TYPES,
  ORDER_STATUSES,
  STAFF_ROLES,
  TABLE_STATUS_CONFIG,
} from "@/lib/types";

describe("Domain Enums & Constants", () => {
  it("should have correct Order Types defined", () => {
    expect(ORDER_TYPES).toHaveProperty("DINE_IN");
    expect(ORDER_TYPES).toHaveProperty("TAKEOUT");
    expect(ORDER_TYPES).toHaveProperty("DELIVERY");

    expect(ORDER_TYPES.DINE_IN.label).toBe("En el local");
    expect(ORDER_TYPES.TAKEOUT.label).toBe("Para recoger");
    expect(ORDER_TYPES.DELIVERY.label).toBe("Domicilio");
  });

  it("should have correct Order Statuses defined with valid colors", () => {
    const statuses = ["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"] as const;

    statuses.forEach((status) => {
      expect(ORDER_STATUSES).toHaveProperty(status);
      expect(ORDER_STATUSES[status].label).toBeTruthy();
      expect(ORDER_STATUSES[status].color).toMatch(/^#[0-9A-FA-f]{6}$/);
    });
  });

  it("should contain expected Staff Roles and permissions", () => {
    expect(STAFF_ROLES.OWNER.permissions).toContain("all");
    expect(STAFF_ROLES.MANAGER.permissions).toContain("menu");
    expect(STAFF_ROLES.WAITER.permissions).toContain("orders");
    expect(STAFF_ROLES.KITCHEN.permissions).toContain("orders");
  });

  it("should contain complete Table Status configuration", () => {
    expect(TABLE_STATUS_CONFIG.FREE.label).toBe("Libre");
    expect(TABLE_STATUS_CONFIG.ACTIVE.label).toBe("Con pedido");
    expect(TABLE_STATUS_CONFIG.BILL_REQUESTED.label).toBe("Cuenta pedida");
    expect(TABLE_STATUS_CONFIG.DISABLED.label).toBe("Deshabilitada");
  });
});
