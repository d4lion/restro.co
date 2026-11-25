import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AttentionQueue } from "@/components/admin/common/AttentionQueue";
import { RestaurantDetailDrawer } from "@/components/admin/clients/RestaurantDetailDrawer";
import type { TenantAdminSummary } from "@/lib/repositories/subscription-admin.repository";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/app/actions/support-tickets", () => ({
  createSupportTicketAction: vi.fn(),
  updateSupportTicketStatusAction: vi.fn(),
  updateSupportTicketNoteAction: vi.fn(),
}));

vi.mock("@/app/actions/settings", () => ({
  logoutAction: vi.fn(),
}));

describe("Admin Redesign — AttentionQueue & Ficha Integral", () => {
  const mockTenantExpiring: TenantAdminSummary = {
    id: "tenant-expiring",
    name: "La Trattoria Italiana",
    slug: "trattoria",
    phone: "3001234567",
    address: "Calle 10 # 5-20",
    city: "Medellín",
    isActive: true,
    createdAt: new Date("2026-01-01"),
    onboarding: true,
    allowDineIn: true,
    allowTakeout: true,
    allowDelivery: false,
    isMenuOnly: false,
    allowWhatsAppOrdering: false,
    whatsappNumber: null,
    subscription: {
      id: "sub-1",
      status: "ACTIVE",
      currentPeriodStart: new Date("2026-09-25"),
      // Expiring in 2 days from now (local time is 2026-10-22)
      currentPeriodEnd: new Date("2026-10-24T23:59:59"),
      trialEndsAt: null,
      cancelledAt: null,
      cancelReason: null,
      plan: {
        id: "plan-1",
        key: "RESTRO_IA",
        label: "Restro IA",
        tag: "IA",
        priceMonthly: 49900,
        priceYearly: 499000,
        maxTables: 15,
        maxMenuItems: 100,
        maxStaff: 5,
        maxMenus: 3,
        analyticsDays: 90,
        hasAI: true,
        hasInventory: true,
        hasMultiLanguage: false,
        hasExportPDF: true,
        hasExportExcel: true,
        hasCustomBranding: true,
        hasWhatsApp: false,
        hasPrioritySupport: true,
      },
      billingEvents: [
        {
          id: "ev-1",
          createdAt: new Date("2026-09-25"),
          type: "SUBSCRIPTION_RENEWED",
          amount: 49900,
          currency: "COP",
          note: "Pago confirmado mes anterior",
          metadata: null,
        },
      ],
    },
    featureOverrides: [],
    ownerUser: {
      id: "user-owner",
      email: "owner@trattoria.dev",
      name: "Marco Rossi",
      role: "OWNER",
      lastLoginAt: new Date("2026-10-21"),
    },
    counts: {
      tables: 10,
      orders: 45,
    },
  };

  it("identifies accounts expiring soon and renders action buttons in AttentionQueue", () => {
    const handleExtend = vi.fn();
    const handleDates = vi.fn();
    const handleDetail = vi.fn();

    render(
      <AttentionQueue
        tenants={[mockTenantExpiring]}
        onExtend={handleExtend}
        onEditDates={handleDates}
        onOpenDetail={handleDetail}
      />
    );

    expect(screen.getByText("La Trattoria Italiana")).toBeInTheDocument();
    expect(screen.getByText("Restro IA")).toBeInTheDocument();
    expect(screen.getByText("1 pendientes")).toBeInTheDocument();

    const extendBtn = screen.getByText("Extender");
    fireEvent.click(extendBtn);
    expect(handleExtend).toHaveBeenCalledWith(mockTenantExpiring);

    const fichaBtn = screen.getByText("Ficha");
    fireEvent.click(fichaBtn);
    expect(handleDetail).toHaveBeenCalledWith(mockTenantExpiring);
  });

  it("renders empty state message when no tenants require urgent attention", () => {
    const mockStarter: TenantAdminSummary = {
      ...mockTenantExpiring,
      id: "starter-tenant",
      subscription: {
        ...mockTenantExpiring.subscription!,
        plan: {
          ...mockTenantExpiring.subscription!.plan,
          key: "STARTER",
          label: "Starter",
          priceMonthly: 0,
        },
        currentPeriodEnd: null, // Unlimited for Starter
      },
    };

    render(
      <AttentionQueue
        tenants={[mockStarter]}
        onExtend={vi.fn()}
        onEditDates={vi.fn()}
      />
    );

    expect(screen.getByText(/Todo al día/)).toBeInTheDocument();
  });

  it("renders RestaurantDetailDrawer with all five sections and operational status", () => {
    const handleClose = vi.fn();

    render(
      <RestaurantDetailDrawer
        tenant={mockTenantExpiring}
        isOpen={true}
        onClose={handleClose}
        onExtend={vi.fn()}
        onEditDates={vi.fn()}
        onPermissions={vi.fn()}
        onChangePlan={vi.fn()}
        onViewHistory={vi.fn()}
      />
    );

    // Verify header and distinct statuses
    expect(screen.getByText("La Trattoria Italiana")).toBeInTheDocument();
    expect(screen.getByText(/Operativo \(Activo\)/)).toBeInTheDocument();
    expect(screen.getByText(/Plan Restro IA/)).toBeInTheDocument();

    // Verify tabs
    expect(screen.getByText("Resumen")).toBeInTheDocument();
    expect(screen.getByText("Suscripción & Permisos")).toBeInTheDocument();
    expect(screen.getByText("Pedidos & Ventas")).toBeInTheDocument();
    expect(screen.getByText("Catálogo & Mesas")).toBeInTheDocument();
    expect(screen.getByText("Tickets & Novedades")).toBeInTheDocument();
    expect(screen.getByText("Historial")).toBeInTheDocument();
  });

  it("renders MasterControlHub with sidebar layout, visit restaurant button, and opens TicketsManager", async () => {
    const { MasterControlHub } = await import("@/components/admin/MasterControlHub");

    const tenantWithTicket: TenantAdminSummary = {
      ...mockTenantExpiring,
      supportTickets: [
        {
          id: "ticket-1",
          tenantId: mockTenantExpiring.id,
          createdAt: new Date("2026-10-22T10:00:00"),
          updatedAt: new Date("2026-10-22T10:00:00"),
          title: "Error al sincronizar menú",
          description: "No se guardan los cambios en la sección bebidas",
          status: "OPEN",
          priority: "HIGH",
          category: "TECHNICAL",
          authorName: "Marco Rossi",
          notes: null,
          resolvedAt: null,
        },
      ],
    };

    const mockMetrics = {
      totalTenants: 1,
      activeSubscriptions: 1,
      totalOrders: 45,
      grossMerchandiseVolumeCOP: 1200000,
      monthlyRecurringRevenueCOP: 49900,
      estimatedAnnualRunRateCOP: 598800,
      periodGrowthRate: 0,
      planDistribution: {
        STARTER: 0,
        CARTA_DIGITAL: 0,
        RESTRO_IA: 1,
        BUSINESS: 0,
      },
    };

    const mockMarketReport = {
      summary: {
        totalTenantsAnalyzed: 1,
        totalGMVCOP: 1200000,
        averageTicketCOP: 26666,
        avgCompletionRate: 98,
        leadSegment: "RESTRO_IA",
      },
      tenants: [],
      segments: [],
      channelDistribution: { dineIn: 100, takeout: 0, delivery: 0 },
    };

    render(
      <MasterControlHub
        tenants={[tenantWithTicket]}
        accounts={[]}
        metrics={mockMetrics as unknown as any}
        marketReport={mockMarketReport as unknown as any}
        adminEmail="admin@restro.internal"
      />
    );

    // Verify Sidebar header and navigation items
    expect(screen.getAllByText("Restro Core").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("/a/g/s").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("SUPERADMIN")).toBeInTheDocument();
    expect(screen.getByText("Centro de Control")).toBeInTheDocument();
    expect(screen.getByText("Suscripciones & Vigencias")).toBeInTheDocument();
    expect(screen.getByText("Clientes & Cuentas")).toBeInTheDocument();
    expect(screen.getAllByText("Gestor de Tickets").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Analítica & BI")).toBeInTheDocument();

    // Verify Sidebar Footer actions
    expect(screen.getByText("admin@restro.internal")).toBeInTheDocument();
    const visitLink = screen.getByRole("link", { name: /Visitar Restaurante/i });
    expect(visitLink).toHaveAttribute("href", "/overview");
    expect(screen.getByRole("button", { name: /Cerrar Sesión/i })).toBeInTheDocument();

    // Switch to Gestor de Tickets
    const ticketsNavBtns = screen.getAllByRole("button", { name: /Gestor de Tickets/i });
    fireEvent.click(ticketsNavBtns[0]);

    // Verify TicketsManager is active
    expect(screen.getByText("Gestor de Novedades & Tickets de Soporte")).toBeInTheDocument();
    expect(screen.getByText("Error al sincronizar menú")).toBeInTheDocument();
  }, 15000);
});
