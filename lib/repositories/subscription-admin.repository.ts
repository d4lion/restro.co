import { prisma } from "@/lib/prisma";
import type { PlanKey } from "@/lib/types";

export interface TenantAdminSummary {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: Date;
  onboarding: boolean;
  allowDineIn: boolean;
  allowTakeout: boolean;
  allowDelivery: boolean;
  isMenuOnly: boolean;
  allowWhatsAppOrdering: boolean;
  whatsappNumber: string | null;
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    trialEndsAt: Date | null;
    cancelledAt: Date | null;
    cancelReason: string | null;
    plan: {
      id: string;
      key: PlanKey;
      label: string;
      tag: string;
      priceMonthly: number;
      priceYearly: number | null;
      maxTables: number;
      maxMenuItems: number;
      maxStaff: number;
      maxMenus: number;
      analyticsDays: number;
      hasAI: boolean;
      hasInventory: boolean;
      hasMultiLanguage: boolean;
      hasExportPDF: boolean;
      hasExportExcel: boolean;
      hasCustomBranding: boolean;
      hasWhatsApp: boolean;
      hasPrioritySupport: boolean;
    };
    billingEvents: Array<{
      id: string;
      createdAt: Date;
      type: string;
      amount: number | null;
      currency: string;
      note: string | null;
      metadata: string | null;
    }>;
  } | null;
  featureOverrides: Array<{
    id: string;
    feature: string;
    value: string;
    reason: string | null;
    expiresAt: Date | null;
    createdAt: Date;
  }>;
  ownerUser: {
    id: string;
    email: string;
    name: string;
    role: string;
    lastLoginAt: Date | null;
  } | null;
  supportTickets?: Array<{
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    authorName: string | null;
    notes: string | null;
    resolvedAt: Date | null;
  }>;
  counts: {
    tables: number;
    orders: number;
    supportTickets?: number;
  };
}

export const subscriptionAdminRepository = {
  /**
   * List all tenants with subscriptions, plan details, overrides, and recent billing events.
   */
  async listAllTenants(): Promise<TenantAdminSummary[]> {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          include: {
            plan: true,
            billingEvents: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
        featureOverrides: {
          orderBy: { createdAt: "desc" },
        },
        users: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
        supportTickets: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            tables: true,
            orders: true,
            supportTickets: true,
          },
        },
      },
    });

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      phone: t.phone,
      address: t.address,
      city: t.city,
      isActive: t.isActive,
      createdAt: t.createdAt,
      onboarding: t.onboarding,
      allowDineIn: t.allowDineIn,
      allowTakeout: t.allowTakeout,
      allowDelivery: t.allowDelivery,
      isMenuOnly: t.isMenuOnly,
      allowWhatsAppOrdering: t.allowWhatsAppOrdering,
      whatsappNumber: t.whatsappNumber,
      subscription: t.subscription
        ? {
            id: t.subscription.id,
            status: t.subscription.status,
            currentPeriodStart: t.subscription.currentPeriodStart,
            currentPeriodEnd: t.subscription.currentPeriodEnd,
            trialEndsAt: t.subscription.trialEndsAt,
            cancelledAt: t.subscription.cancelledAt,
            cancelReason: t.subscription.cancelReason,
            plan: {
              id: t.subscription.plan.id,
              key: t.subscription.plan.key as PlanKey,
              label: t.subscription.plan.label,
              tag: t.subscription.plan.tag,
              priceMonthly: t.subscription.plan.priceMonthly,
              priceYearly: t.subscription.plan.priceYearly,
              maxTables: t.subscription.plan.maxTables,
              maxMenuItems: t.subscription.plan.maxMenuItems,
              maxStaff: t.subscription.plan.maxStaff,
              maxMenus: t.subscription.plan.maxMenus,
              analyticsDays: t.subscription.plan.analyticsDays,
              hasAI: t.subscription.plan.hasAI,
              hasInventory: t.subscription.plan.hasInventory,
              hasMultiLanguage: t.subscription.plan.hasMultiLanguage,
              hasExportPDF: t.subscription.plan.hasExportPDF,
              hasExportExcel: t.subscription.plan.hasExportExcel,
              hasCustomBranding: t.subscription.plan.hasCustomBranding,
              hasWhatsApp: t.subscription.plan.hasWhatsApp,
              hasPrioritySupport: t.subscription.plan.hasPrioritySupport,
            },
            billingEvents: t.subscription.billingEvents.map((be) => ({
              id: be.id,
              createdAt: be.createdAt,
              type: be.type,
              amount: be.amount,
              currency: be.currency,
              note: be.note,
              metadata: be.metadata,
            })),
          }
        : null,
      featureOverrides: t.featureOverrides.map((fo) => ({
        id: fo.id,
        feature: fo.feature,
        value: fo.value,
        reason: fo.reason,
        expiresAt: fo.expiresAt,
        createdAt: fo.createdAt,
      })),
      ownerUser: t.users[0]
        ? {
            id: t.users[0].id,
            email: t.users[0].email,
            name: t.users[0].name,
            role: t.users[0].role,
            lastLoginAt: t.users[0].lastLoginAt,
          }
        : null,
      supportTickets: (t.supportTickets || []).map((st) => ({
        id: st.id,
        tenantId: st.tenantId,
        createdAt: st.createdAt,
        updatedAt: st.updatedAt,
        title: st.title,
        description: st.description,
        status: st.status,
        priority: st.priority,
        category: st.category,
        authorName: st.authorName,
        notes: st.notes,
        resolvedAt: st.resolvedAt,
      })),
      counts: {
        tables: t._count.tables,
        orders: t._count.orders,
        supportTickets: t._count.supportTickets,
      },
    }));
  },

  /**
   * Get full details of a specific tenant including all history
   */
  async getTenantDetail(tenantId: string) {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: {
            plan: true,
            billingEvents: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
        featureOverrides: {
          orderBy: { createdAt: "desc" },
        },
        users: {
          orderBy: { createdAt: "asc" },
        },
        supportTickets: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            tables: true,
            orders: true,
            menus: true,
          },
        },
      },
    });
  },

  /**
   * Manually extend a subscription by a number of days or to a specific date.
   * Records a BillingEvent so the extension is never lost.
   */
  async extendSubscription(params: {
    subscriptionId: string;
    daysToAdd: number;
    newEndDate?: Date;
    note?: string;
    amount?: number;
    actor?: string;
  }) {
    const sub = await prisma.subscription.findUnique({
      where: { id: params.subscriptionId },
      include: { plan: true },
    });
    if (!sub) throw new Error("Suscripción no encontrada");

    const now = new Date();
    let calculatedEnd: Date;

    if (params.newEndDate) {
      calculatedEnd = new Date(params.newEndDate);
    } else {
      // If current period end is in the future, extend from that date; otherwise from today
      const baseDate = sub.currentPeriodEnd && sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
      calculatedEnd = new Date(baseDate.getTime() + params.daysToAdd * 24 * 60 * 60 * 1000);
    }

    const previousStart = sub.currentPeriodStart;
    const previousEnd = sub.currentPeriodEnd;
    const effectiveStart = previousStart || now;

    const [updatedSub, event] = await prisma.$transaction([
      prisma.subscription.update({
        where: { id: params.subscriptionId },
        data: {
          currentPeriodStart: effectiveStart,
          currentPeriodEnd: calculatedEnd,
          status: "ACTIVE",
          cancelledAt: null,
          cancelReason: null,
        },
      }),
      prisma.billingEvent.create({
        data: {
          subscriptionId: params.subscriptionId,
          type: "SUBSCRIPTION_RENEWED",
          amount: params.amount ?? null,
          currency: "COP",
          note: params.note || `Extensión manual de ${params.daysToAdd} días`,
          metadata: JSON.stringify({
            action: "MANUAL_EXTENSION",
            daysAdded: params.daysToAdd,
            previousEnd: previousEnd?.toISOString() || null,
            newEnd: calculatedEnd.toISOString(),
            actor: params.actor || "admin",
            reason: params.note || "Extensión manual administrativa",
          }),
        },
      }),
    ]);

    return { updatedSub, event };
  },

  /**
   * Explicitly set/update subscription dates and status.
   * Records an audit BillingEvent.
   */
  async updateSubscriptionDates(params: {
    subscriptionId: string;
    startDate: Date | null;
    endDate: Date | null;
    trialEndsAt?: Date | null;
    status: string;
    note?: string;
    actor?: string;
  }) {
    const prev = await prisma.subscription.findUnique({
      where: { id: params.subscriptionId },
    });
    if (!prev) throw new Error("Suscripción no encontrada");

    const [updatedSub, event] = await prisma.$transaction([
      prisma.subscription.update({
        where: { id: params.subscriptionId },
        data: {
          currentPeriodStart: params.startDate,
          currentPeriodEnd: params.endDate,
          trialEndsAt: params.trialEndsAt !== undefined ? params.trialEndsAt : prev.trialEndsAt,
          status: params.status,
        },
      }),
      prisma.billingEvent.create({
        data: {
          subscriptionId: params.subscriptionId,
          type: "DATES_MANUALLY_UPDATED",
          note: params.note || "Ajuste manual de fechas y estado de suscripción",
          metadata: JSON.stringify({
            action: "UPDATE_DATES",
            previous: {
              start: prev.currentPeriodStart?.toISOString() || null,
              end: prev.currentPeriodEnd?.toISOString() || null,
              trialEndsAt: prev.trialEndsAt?.toISOString() || null,
              status: prev.status,
            },
            new: {
              start: params.startDate?.toISOString() || null,
              end: params.endDate?.toISOString() || null,
              trialEndsAt: params.trialEndsAt?.toISOString() || null,
              status: params.status,
            },
            actor: params.actor || "admin",
          }),
        },
      }),
    ]);

    return { updatedSub, event };
  },

  /**
   * Change plan from admin panel with option to reset cycle or preserve dates.
   * Records a PLAN_CHANGED BillingEvent with full audit metadata.
   */
  async changeTenantPlanAdmin(params: {
    tenantId: string;
    newPlanKey: PlanKey;
    resetCycle?: boolean;
    cycleDays?: number;
    note?: string;
    actor?: string;
  }) {
    const newPlan = await prisma.plan.findUnique({
      where: { key: params.newPlanKey },
    });
    if (!newPlan) throw new Error(`Plan ${params.newPlanKey} no encontrado`);

    const sub = await prisma.subscription.findUnique({
      where: { tenantId: params.tenantId },
      include: { plan: true },
    });
    if (!sub) throw new Error("Suscripción no encontrada");

    const now = new Date();
    let updatedDates: { currentPeriodStart?: Date; currentPeriodEnd?: Date } = {};

    if (params.resetCycle) {
      const days = params.cycleDays || 30;
      updatedDates = {
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
      };
    } else if (!sub.currentPeriodStart || !sub.currentPeriodEnd) {
      // If was Starter with no dates, initialize with 30 days
      updatedDates = {
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      };
    }

    const [updatedSub, event] = await prisma.$transaction([
      prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planId: newPlan.id,
          status: "ACTIVE",
          ...updatedDates,
        },
      }),
      prisma.billingEvent.create({
        data: {
          subscriptionId: sub.id,
          type: "PLAN_CHANGED",
          fromPlanId: sub.planId,
          toPlanId: newPlan.id,
          amount: newPlan.priceMonthly,
          currency: "COP",
          note: params.note || `Cambio de plan a ${newPlan.label} gestionado por administración`,
          metadata: JSON.stringify({
            action: "ADMIN_PLAN_CHANGE",
            previousPlanKey: sub.plan.key,
            newPlanKey: newPlan.key,
            resetCycle: !!params.resetCycle,
            actor: params.actor || "admin",
          }),
        },
      }),
    ]);

    return { updatedSub, event };
  },

  /**
   * Set or update a feature override (e.g. hasAI = true, maxTables = 50).
   * Records a BillingEvent.
   */
  async setFeatureOverride(params: {
    tenantId: string;
    feature: string;
    value: string;
    reason?: string;
    expiresAt?: Date | null;
    actor?: string;
  }) {
    const sub = await prisma.subscription.findUnique({
      where: { tenantId: params.tenantId },
    });

    const override = await prisma.tenantFeatureOverride.upsert({
      where: {
        tenantId_feature: {
          tenantId: params.tenantId,
          feature: params.feature,
        },
      },
      update: {
        value: params.value,
        reason: params.reason || null,
        expiresAt: params.expiresAt || null,
      },
      create: {
        tenantId: params.tenantId,
        feature: params.feature,
        value: params.value,
        reason: params.reason || null,
        expiresAt: params.expiresAt || null,
      },
    });

    if (sub) {
      await prisma.billingEvent.create({
        data: {
          subscriptionId: sub.id,
          type: "FEATURE_OVERRIDE_SET",
          note: `Permiso especial asignado: ${params.feature} = ${params.value}${params.reason ? ` (${params.reason})` : ""}`,
          metadata: JSON.stringify({
            action: "FEATURE_OVERRIDE_SET",
            feature: params.feature,
            value: params.value,
            reason: params.reason || null,
            expiresAt: params.expiresAt?.toISOString() || null,
            actor: params.actor || "admin",
          }),
        },
      });
    }

    return override;
  },

  /**
   * Remove a feature override and restore default plan limit.
   */
  async removeFeatureOverride(params: {
    tenantId: string;
    feature: string;
    actor?: string;
  }) {
    const sub = await prisma.subscription.findUnique({
      where: { tenantId: params.tenantId },
    });

    const deleted = await prisma.tenantFeatureOverride.deleteMany({
      where: {
        tenantId: params.tenantId,
        feature: params.feature,
      },
    });

    if (sub && deleted.count > 0) {
      await prisma.billingEvent.create({
        data: {
          subscriptionId: sub.id,
          type: "FEATURE_OVERRIDE_REMOVED",
          note: `Permiso especial removido: ${params.feature} (restaurado a límites del plan)`,
          metadata: JSON.stringify({
            action: "FEATURE_OVERRIDE_REMOVED",
            feature: params.feature,
            actor: params.actor || "admin",
          }),
        },
      });
    }

    return deleted;
  },

  /**
   * Update tenant operational status and ordering capabilities.
   */
  async updateTenantSettings(params: {
    tenantId: string;
    isActive?: boolean;
    allowDineIn?: boolean;
    allowTakeout?: boolean;
    allowDelivery?: boolean;
    isMenuOnly?: boolean;
    allowWhatsAppOrdering?: boolean;
    whatsappNumber?: string | null;
    reason?: string;
    actor?: string;
  }) {
    const prev = await prisma.tenant.findUnique({
      where: { id: params.tenantId },
      include: { subscription: true },
    });
    if (!prev) throw new Error("Restaurante no encontrado");

    const updateData: Record<string, unknown> = {};
    if (params.isActive !== undefined) updateData.isActive = params.isActive;
    if (params.allowDineIn !== undefined) updateData.allowDineIn = params.allowDineIn;
    if (params.allowTakeout !== undefined) updateData.allowTakeout = params.allowTakeout;
    if (params.allowDelivery !== undefined) updateData.allowDelivery = params.allowDelivery;
    if (params.isMenuOnly !== undefined) updateData.isMenuOnly = params.isMenuOnly;
    if (params.allowWhatsAppOrdering !== undefined) updateData.allowWhatsAppOrdering = params.allowWhatsAppOrdering;
    if (params.whatsappNumber !== undefined) updateData.whatsappNumber = params.whatsappNumber;

    const updatedTenant = await prisma.tenant.update({
      where: { id: params.tenantId },
      data: updateData,
    });

    if (prev.subscription && params.isActive !== undefined && params.isActive !== prev.isActive) {
      await prisma.billingEvent.create({
        data: {
          subscriptionId: prev.subscription.id,
          type: "TENANT_STATUS_CHANGED",
          note: `Estado del restaurante cambiado a: ${params.isActive ? "ACTIVO" : "SUSPENDIDO"}${params.reason ? ` (${params.reason})` : ""}`,
          metadata: JSON.stringify({
            action: "TENANT_STATUS_CHANGED",
            previousState: prev.isActive,
            newState: params.isActive,
            reason: params.reason || null,
            actor: params.actor || "admin",
          }),
        },
      });
    }

    return updatedTenant;
  },

  /**
   * Get all BillingEvents for a subscription for full audit trail.
   */
  async getSubscriptionEvents(subscriptionId: string) {
    return prisma.billingEvent.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: "desc" },
    });
  },
};
