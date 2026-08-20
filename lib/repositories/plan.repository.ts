import { prisma } from "@/lib/prisma";
import type { PlanKey, PlanRecord, PlanLimits } from "@/lib/types";
import { getPlanLimits } from "@/lib/types";

export const planRepository = {
  /** List all active plans (for pricing page) */
  async findAllActive(): Promise<PlanRecord[]> {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return plans as PlanRecord[];
  },

  /** Find a plan by its unique key */
  async findByKey(key: PlanKey): Promise<PlanRecord | null> {
    const plan = await prisma.plan.findUnique({
      where: { key },
    });
    return plan as PlanRecord | null;
  },

  /** Find a plan by its ID */
  async findById(id: string): Promise<PlanRecord | null> {
    const plan = await prisma.plan.findUnique({
      where: { id },
    });
    return plan as PlanRecord | null;
  },

  /**
   * Get the effective plan + limits for a tenant, applying any feature overrides.
   * Returns both the raw plan and the resolved limits (with overrides applied).
   */
  async getPlanForTenant(tenantId: string): Promise<{
    plan: PlanRecord;
    limits: PlanLimits;
  } | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: { plan: true },
        },
        featureOverrides: true,
      },
    });

    if (!tenant?.subscription?.plan) return null;

    const plan = tenant.subscription.plan as unknown as PlanRecord;
    const limits = getPlanLimits(plan);

    // Apply feature overrides (non-expired only)
    const now = new Date();
    for (const override of tenant.featureOverrides) {
      if (override.expiresAt && override.expiresAt < now) continue;

      const feature = override.feature as keyof PlanLimits;
      if (feature in limits) {
        const currentValue = limits[feature];
        if (typeof currentValue === "boolean") {
          (limits as unknown as Record<string, unknown>)[feature] = override.value === "true";
        } else if (typeof currentValue === "number") {
          const parsed = parseInt(override.value, 10);
          if (!isNaN(parsed)) {
            (limits as unknown as Record<string, unknown>)[feature] = parsed === -1 ? Infinity : parsed;
          }
        } else if (typeof currentValue === "string") {
          (limits as unknown as Record<string, unknown>)[feature] = override.value;
        }
      }
    }

    return { plan, limits };
  },
};
