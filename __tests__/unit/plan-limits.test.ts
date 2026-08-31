import { describe, it, expect } from "vitest";
import { getPlanLimits, type PlanRecord } from "@/lib/types";

describe("getPlanLimits utility function", () => {
  it("should convert numeric -1 values to Infinity for unlimited limits", () => {
    const mockPlan: PlanRecord = {
      id: "plan-business-1",
      key: "BUSINESS",
      label: "Business Plan",
      tag: "ENTERPRISE",
      description: "Business plan with unlimited everything",
      priceMonthly: 99900,
      priceYearly: 959000,
      maxTables: -1,
      maxMenuItems: -1,
      maxStaff: -1,
      maxMenus: -1,
      analyticsDays: 365,
      hasAI: true,
      hasInventory: true,
      hasMultiLanguage: true,
      hasExportPDF: true,
      hasExportExcel: true,
      hasCustomBranding: true,
      hasWhatsApp: true,
      hasPrioritySupport: true,
      sortOrder: 3,
      isActive: true,
    };

    const limits = getPlanLimits(mockPlan);

    expect(limits.maxTables).toBe(Infinity);
    expect(limits.maxMenuItems).toBe(Infinity);
    expect(limits.maxStaff).toBe(Infinity);
    expect(limits.maxMenus).toBe(Infinity);
    expect(limits.analyticsDays).toBe(365);
    expect(limits.hasAI).toBe(true);
    expect(limits.hasWhatsApp).toBe(true);
  });

  it("should preserve specific numeric values when not -1", () => {
    const mockPlan: PlanRecord = {
      id: "plan-starter-1",
      key: "STARTER",
      label: "Starter Plan",
      tag: "GRATIS",
      description: "Basic starter plan",
      priceMonthly: 0,
      priceYearly: null,
      maxTables: 5,
      maxMenuItems: 20,
      maxStaff: 1,
      maxMenus: 1,
      analyticsDays: 7,
      hasAI: false,
      hasInventory: false,
      hasMultiLanguage: false,
      hasExportPDF: false,
      hasExportExcel: false,
      hasCustomBranding: false,
      hasWhatsApp: false,
      hasPrioritySupport: false,
      sortOrder: 1,
      isActive: true,
    };

    const limits = getPlanLimits(mockPlan);

    expect(limits.maxTables).toBe(5);
    expect(limits.maxMenuItems).toBe(20);
    expect(limits.maxStaff).toBe(1);
    expect(limits.maxMenus).toBe(1);
    expect(limits.analyticsDays).toBe(7);
    expect(limits.hasAI).toBe(false);
  });
});
