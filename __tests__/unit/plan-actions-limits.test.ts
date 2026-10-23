import { describe, it, expect, vi, beforeEach } from "vitest";
import { PLAN_LIMITS, type PlanRecord } from "@/lib/types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/repositories/plan.repository", () => ({
  planRepository: {
    getPlanForTenant: vi.fn(),
  },
}));

vi.mock("@/lib/repositories/menu.repository", () => ({
  menuRepository: {
    countMenuItemsByTenant: vi.fn(),
    createMenuItem: vi.fn(),
  },
}));

vi.mock("@/lib/repositories/table.repository", () => ({
  tableRepository: {
    countByTenant: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/repositories/tenant.repository", () => ({
  tenantRepository: {
    findById: vi.fn().mockResolvedValue({ id: "tenant-1", slug: "demo" }),
  },
}));

import { getSession } from "@/lib/session";
import { planRepository } from "@/lib/repositories/plan.repository";
import { menuRepository } from "@/lib/repositories/menu.repository";
import { tableRepository } from "@/lib/repositories/table.repository";
import { addItemAction } from "@/app/actions/menu";
import { createTableAction } from "@/app/actions/tables";

describe("Server Action Plan Limits (maxMenuItems & maxTables)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addItemAction (maxMenuItems validation)", () => {
    it("blocks creating product #6 when tenant is on STARTER plan (maxMenuItems = 5)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-1",
        tenantId: "tenant-starter",
        role: "OWNER",
        plan: "STARTER",
        planId: "plan-starter",
        expiresAt: new Date(Date.now() + 3600000),
      });

      vi.mocked(planRepository.getPlanForTenant).mockResolvedValue({
        plan: { key: "STARTER", label: "Starter" } as PlanRecord,
        limits: { ...PLAN_LIMITS.STARTER },
      });

      vi.mocked(menuRepository.countMenuItemsByTenant).mockResolvedValue(5);

      const result = await addItemAction({
        categoryId: "cat-1",
        name: "Producto 6",
        price: 25000,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("límite de 5 productos");
      expect(result.message).toContain("Carta Digital");
      expect(menuRepository.createMenuItem).not.toHaveBeenCalled();
    });

    it("allows creating product #5 when tenant is on STARTER plan (current count = 4)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-1",
        tenantId: "tenant-starter",
        role: "OWNER",
        plan: "STARTER",
        planId: "plan-starter",
        expiresAt: new Date(Date.now() + 3600000),
      });

      vi.mocked(planRepository.getPlanForTenant).mockResolvedValue({
        plan: { key: "STARTER", label: "Starter" } as PlanRecord,
        limits: { ...PLAN_LIMITS.STARTER },
      });

      vi.mocked(menuRepository.countMenuItemsByTenant).mockResolvedValue(4);
      vi.mocked(menuRepository.createMenuItem).mockResolvedValue({ id: "item-5" } as never);

      const result = await addItemAction({
        categoryId: "cat-1",
        name: "Producto 5",
        price: 25000,
      });

      expect(result.success).toBe(true);
      expect(menuRepository.createMenuItem).toHaveBeenCalledTimes(1);
    });

    it("allows creating unlimited products when tenant is on CARTA_DIGITAL plan", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-2",
        tenantId: "tenant-carta",
        role: "OWNER",
        plan: "CARTA_DIGITAL",
        planId: "plan-carta",
        expiresAt: new Date(Date.now() + 3600000),
      });

      vi.mocked(planRepository.getPlanForTenant).mockResolvedValue({
        plan: { key: "CARTA_DIGITAL", label: "Carta Digital" } as PlanRecord,
        limits: { ...PLAN_LIMITS.CARTA_DIGITAL },
      });

      vi.mocked(menuRepository.createMenuItem).mockResolvedValue({ id: "item-55" } as never);

      const result = await addItemAction({
        categoryId: "cat-1",
        name: "Producto Ilimitado 55",
        price: 18000,
      });

      expect(result.success).toBe(true);
      expect(menuRepository.countMenuItemsByTenant).not.toHaveBeenCalled();
      expect(menuRepository.createMenuItem).toHaveBeenCalledTimes(1);
    });
  });

  describe("createTableAction (maxTables validation)", () => {
    it("blocks creating table #6 when tenant is on STARTER plan (maxTables = 5)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-1",
        tenantId: "tenant-starter",
        role: "OWNER",
        plan: "STARTER",
        planId: "plan-starter",
        expiresAt: new Date(Date.now() + 3600000),
      });

      vi.mocked(planRepository.getPlanForTenant).mockResolvedValue({
        plan: { key: "STARTER", label: "Starter" } as PlanRecord,
        limits: { ...PLAN_LIMITS.STARTER },
      });

      vi.mocked(tableRepository.countByTenant).mockResolvedValue(5);

      const result = await createTableAction({
        name: "Mesa 6",
        capacity: 4,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("límite de 5 mesas");
      expect(result.message).toContain("Carta Digital");
      expect(tableRepository.create).not.toHaveBeenCalled();
    });

    it("allows creating unlimited tables for QR printing when tenant is on CARTA_DIGITAL plan", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-2",
        tenantId: "tenant-carta",
        role: "OWNER",
        plan: "CARTA_DIGITAL",
        planId: "plan-carta",
        expiresAt: new Date(Date.now() + 3600000),
      });

      vi.mocked(planRepository.getPlanForTenant).mockResolvedValue({
        plan: { key: "CARTA_DIGITAL", label: "Carta Digital" } as PlanRecord,
        limits: { ...PLAN_LIMITS.CARTA_DIGITAL },
      });

      vi.mocked(tableRepository.create).mockResolvedValue({ id: "table-12" } as never);

      const result = await createTableAction({
        name: "Mesa 12",
        capacity: 4,
      });

      expect(result.success).toBe(true);
      expect(tableRepository.countByTenant).not.toHaveBeenCalled();
      expect(tableRepository.create).toHaveBeenCalledTimes(1);
    });

    it("allows creating unlimited tables when tenant is on RESTRO_IA plan", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-3",
        tenantId: "tenant-ia",
        role: "OWNER",
        plan: "RESTRO_IA",
        planId: "plan-ia",
        expiresAt: new Date(Date.now() + 3600000),
      });

      vi.mocked(planRepository.getPlanForTenant).mockResolvedValue({
        plan: { key: "RESTRO_IA", label: "Restro IA" } as PlanRecord,
        limits: { ...PLAN_LIMITS.RESTRO_IA },
      });

      vi.mocked(tableRepository.create).mockResolvedValue({ id: "table-35" } as never);

      const result = await createTableAction({
        name: "Mesa 35",
        capacity: 4,
      });

      expect(result.success).toBe(true);
      expect(tableRepository.countByTenant).not.toHaveBeenCalled();
      expect(tableRepository.create).toHaveBeenCalledTimes(1);
    });
  });
});
