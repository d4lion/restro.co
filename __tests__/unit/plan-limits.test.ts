import { describe, it, expect, vi } from "vitest";
import {
  getPlanLimits,
  isDashboardModuleLocked,
  PLAN_LIMITS,
  type PlanRecord,
} from "@/lib/types";

vi.mock("@/app/actions/orders", () => ({
  createPublicOrderAction: vi.fn(),
  validateTableAction: vi.fn().mockResolvedValue({ valid: true, table: { id: "t-4", number: 4, label: "Mesa 4" } }),
}));

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
      sortOrder: 4,
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

  it("should configure CARTA_DIGITAL ($9.900/mes) with unlimited products and tables but no AI/KDS", () => {
    const mockCartaPlan: PlanRecord = {
      id: "plan-carta-1",
      key: "CARTA_DIGITAL",
      label: "Carta Digital",
      tag: "ESENCIAL",
      description: "Productos ilimitados y códigos QR por mesa",
      priceMonthly: 9900,
      priceYearly: 95000,
      maxTables: -1,
      maxMenuItems: -1,
      maxStaff: 1,
      maxMenus: 1,
      analyticsDays: 0,
      hasAI: false,
      hasInventory: false,
      hasMultiLanguage: false,
      hasExportPDF: false,
      hasExportExcel: false,
      hasCustomBranding: true,
      hasWhatsApp: false,
      hasPrioritySupport: false,
      sortOrder: 2,
      isActive: true,
    };

    const limits = getPlanLimits(mockCartaPlan);

    expect(limits.priceMonthly).toBe(9900);
    expect(limits.maxMenuItems).toBe(Infinity);
    expect(limits.maxTables).toBe(Infinity);
    expect(limits.hasCustomBranding).toBe(true);
    expect(limits.hasAI).toBe(false);
    expect(limits.hasInventory).toBe(false);
    expect(PLAN_LIMITS.CARTA_DIGITAL.priceMonthly).toBe(9900);
  });

  it("should preserve specific numeric values for STARTER (max 5 tables, max 5 menu items)", () => {
    const mockPlan: PlanRecord = {
      id: "plan-starter-1",
      key: "STARTER",
      label: "Starter Plan",
      tag: "GRATIS",
      description: "Basic starter plan",
      priceMonthly: 0,
      priceYearly: null,
      maxTables: 5,
      maxMenuItems: 5,
      maxStaff: 1,
      maxMenus: 1,
      analyticsDays: 0,
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
    expect(limits.maxMenuItems).toBe(5);
    expect(limits.maxStaff).toBe(1);
    expect(limits.maxMenus).toBe(1);
    expect(limits.analyticsDays).toBe(0);
    expect(limits.hasAI).toBe(false);
    expect(PLAN_LIMITS.STARTER.maxMenuItems).toBe(5);
    expect(PLAN_LIMITS.STARTER.maxTables).toBe(5);
  });
});

describe("isDashboardModuleLocked", () => {
  it("locks KDS, Reservations, Inventory, Analytics, and WhatsApp for both STARTER and CARTA_DIGITAL while keeping /overview, /menu, /tables, and /settings unlocked", () => {
    for (const plan of ["STARTER", "CARTA_DIGITAL"] as const) {
      expect(isDashboardModuleLocked(plan, "/overview")).toBe(false);
      expect(isDashboardModuleLocked(plan, "/menu")).toBe(false);
      expect(isDashboardModuleLocked(plan, "/tables")).toBe(false);
      expect(isDashboardModuleLocked(plan, "/settings")).toBe(false);

      expect(isDashboardModuleLocked(plan, "/orders")).toBe(true);
      expect(isDashboardModuleLocked(plan, "/reservations")).toBe(true);
      expect(isDashboardModuleLocked(plan, "/inventory")).toBe(true);
      expect(isDashboardModuleLocked(plan, "/analytics")).toBe(true);
      expect(isDashboardModuleLocked(plan, "/whatsapp")).toBe(true);
    }
  });

  it("unlocks all modules for RESTRO_IA and BUSINESS", () => {
    for (const route of ["/overview", "/menu", "/tables", "/orders", "/reservations", "/inventory", "/analytics", "/whatsapp", "/settings"]) {
      expect(isDashboardModuleLocked("RESTRO_IA", route)).toBe(false);
      expect(isDashboardModuleLocked("BUSINESS", route)).toBe(false);
    }
  });
});

describe("COP currency input helpers", () => {
  it("formats COP amounts with $ and thousands separator and returns empty string for 0", async () => {
    const { formatCOPInput, parseCOPInput } = await import(
      "@/components/dashboard/menu/ItemFormModal"
    );

    expect(formatCOPInput(0)).toBe("");
    expect(formatCOPInput("")).toBe("");
    expect(formatCOPInput(null)).toBe("");
    expect(formatCOPInput(25000)).toBe("$ 25.000");
    expect(formatCOPInput(5000, "+ $ ")).toBe("+ $ 5.000");

    expect(parseCOPInput("$ 25.000")).toBe(25000);
    expect(parseCOPInput("+ $ 4.500")).toBe(4500);
    expect(parseCOPInput("")).toBe(0);
    expect(parseCOPInput("0")).toBe(0);
  });

  it("computes 4:3 crop geometry accurately for vertical, square, and panoramic dish photos", async () => {
    const { computeCropGeometry } = await import(
      "@/components/dashboard/menu/ItemFormModal"
    );

    // Vertical 3:4 photo (900x1200) inside a 4:3 frame
    const verticalCover = computeCropGeometry(900, 1200, 1, 0, 0.2);
    expect(verticalCover.wRel).toBeCloseTo(1, 3);
    expect(verticalCover.hRel).toBeCloseTo(16 / 9, 3);
    expect(verticalCover.clampedPanX).toBe(0);
    expect(verticalCover.clampedPanY).toBeCloseTo(0.2, 3);

    // Fitting entire vertical photo without cutting edges ("Encajar sin recortar")
    const verticalFit = computeCropGeometry(
      900,
      1200,
      verticalCover.fitZoom,
      0.5,
      0.5
    );
    expect(verticalFit.hRel).toBeCloseTo(1, 2);
    expect(verticalFit.wRel).toBeLessThan(1);
    expect(verticalFit.clampedPanX).toBe(0);
    expect(verticalFit.clampedPanY).toBe(0);
  });
});

describe("Public menu read-only product & modifier inspection (STARTER / CARTA_DIGITAL / isMenuOnly)", () => {
  it("allows opening a product card to view its acompañantes/options without selection inputs or add-to-cart buttons when isMenuOnly is true", async () => {
    const React = await import("react");
    const { render, screen, fireEvent } = await import("@testing-library/react");
    const { PublicMenuClient } = await import("@/components/public/PublicMenuClient");

    render(
      React.createElement(PublicMenuClient, {
        tenantId: "tenant-starter",
        tenantName: "La Parrilla de Don Carlos",
        tenantDescription: "Cortes premium",
        logoUrl: null,
        coverUrl: null,
        phone: "+573105550001",
        address: "Calle 93",
        city: "Bogotá",
        brandColor: "#2563EB",
        instagramUrl: null,
        facebookUrl: null,
        tiktokUrl: null,
        websiteUrl: null,
        plan: "STARTER",
        isMenuOnly: true,
        categories: [
          {
            id: "cat-1",
            name: "Carnes",
            description: null,
            items: [
              {
                id: "item-1",
                name: "Churrasco 300g",
                description: "Corte premium madurado 21 días",
                price: 68000,
                imageUrl: null,
                isAvailable: true,
                isHighlighted: true,
                modifierGroups: [
                  {
                    id: "grp-1",
                    name: "Elige tus acompañantes",
                    isRequired: true,
                    minSelections: 1,
                    maxSelections: 2,
                    options: [
                      { id: "opt-1", name: "Papas rústicas", priceExtra: 0, isAvailable: true },
                      { id: "opt-2", name: "Yuca al vapor", priceExtra: 0, isAvailable: true },
                      { id: "opt-3", name: "Queso provolone", priceExtra: 8000, isAvailable: true },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      })
    );

    // Card shows "Ver acompañantes" hint instead of "+" add-to-cart button
    expect(screen.getByText("Ver acompañantes")).toBeInTheDocument();
    expect(screen.queryByTitle("Agregar al pedido")).not.toBeInTheDocument();

    // Clicking the product card opens the product modal in read-only mode
    fireEvent.click(screen.getByText("Churrasco 300g"));

    // All modifier group titles and options are visible
    expect(screen.getByText("Elige tus acompañantes")).toBeInTheDocument();
    expect(screen.getByText("Papas rústicas")).toBeInTheDocument();
    expect(screen.getByText("Yuca al vapor")).toBeInTheDocument();
    expect(screen.getByText("Queso provolone")).toBeInTheDocument();

    // No radio/checkbox selection inputs and no "Agregar" button exist in read-only mode
    expect(document.querySelectorAll('input[type="radio"], input[type="checkbox"]').length).toBe(0);
    expect(screen.queryByText("Agregar")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Cerrar" }).length).toBeGreaterThanOrEqual(1);
  });

  it("opens product modal automatically via ?activeProductView=<slug>, preserves table query params, and shows a discrete share button only inside the modal", async () => {
    const React = await import("react");
    const { render, screen, fireEvent, cleanup } = await import("@testing-library/react");
    cleanup();
    const { PublicMenuClient } = await import("@/components/public/PublicMenuClient");
    const { getProductShareSlug, findProductByViewParam } = await import(
      "@/components/public/ItemConfiguratorModal"
    );

    const sampleItems = [
      { id: "item-101", name: "Cazuela de Mariscos Especial" },
      { id: "item-102", name: "Limonada de Coco" },
    ];

    expect(getProductShareSlug(sampleItems[0])).toBe("cazuela-de-mariscos-especial");
    expect(findProductByViewParam(sampleItems, "cazuela-de-mariscos-especial")?.id).toBe("item-101");
    expect(findProductByViewParam(sampleItems, "item-102")?.id).toBe("item-102");

    // Simulate visiting URL with both a table QR param and ?activeProductView
    window.history.replaceState(
      {},
      "",
      "/restaurant/mar-y-tierra?table=mesa-4&activeProductView=limonada-de-coco"
    );

    render(
      React.createElement(PublicMenuClient, {
        tenantId: "tenant-1",
        tenantName: "Mar y Tierra",
        tenantDescription: null,
        logoUrl: null,
        coverUrl: null,
        phone: "+573105550001",
        address: "Calle 85",
        city: "Bogotá",
        brandColor: "#0066FF",
        instagramUrl: null,
        facebookUrl: null,
        tiktokUrl: null,
        websiteUrl: null,
        plan: "PRO",
        isMenuOnly: false,
        categories: [
          {
            id: "cat-1",
            name: "Bebidas",
            description: null,
            items: [
              {
                id: "item-102",
                name: "Limonada de Coco",
                description: "Refrescante con leche de coco natural",
                price: 14000,
                imageUrl: null,
                isAvailable: true,
                isHighlighted: false,
                modifierGroups: [],
              },
            ],
          },
        ],
      })
    );

    // Modal should auto-open with the primary-styled share button inside the modal
    const shareBtn = await screen.findByTestId("discrete-share-product-btn");
    expect(shareBtn).toBeInTheDocument();
    expect(shareBtn).toHaveTextContent("Compartir");
    expect(shareBtn).toHaveStyle({ backgroundColor: "#0066FF", color: "#FFFFFF" });

    // Simulate mobile Web Share API (navigator.share) for sending via WhatsApp/native sheet
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: mockShare,
      configurable: true,
      writable: true,
    });

    fireEvent.click(shareBtn);
    expect(mockShare).toHaveBeenCalledWith({
      title: "Limonada de Coco",
      text: "Limonada de Coco — Refrescante con leche de coco natural",
      url: expect.stringContaining("/restaurant/mar-y-tierra?activeProductView=limonada-de-coco"),
    });
    expect(mockShare.mock.calls[0][0].url).not.toContain("table=mesa-4");

    // Closing the modal removes activeProductView while preserving ?table=mesa-4
    const closeButtons = screen.getAllByRole("button", { name: "Cerrar" });
    fireEvent.click(closeButtons[0]);

    expect(window.location.search).toBe("?table=mesa-4");
  });
});



