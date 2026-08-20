import { prisma } from "@/lib/prisma";

/** Shared include to always load subscription → plan + overrides */
const TENANT_INCLUDE = {
  subscription: {
    include: { plan: true },
  },
  featureOverrides: true,
} as const;

export const tenantRepository = {
  async findBySlug(slug: string) {
    return prisma.tenant.findUnique({
      where: { slug },
      include: TENANT_INCLUDE,
    });
  },

  async findById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      include: TENANT_INCLUDE,
    });
  },

  async create(data: {
    name: string;
    slug: string;
    userId: string;
    userEmail: string;
    userName: string;
    passwordHash?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // Find the STARTER plan
      const starterPlan = await tx.plan.findUnique({
        where: { key: "STARTER" },
      });

      if (!starterPlan) {
        throw new Error("Plan STARTER not found in database. Run seed first.");
      }

      // Create tenant (no plan field — source of truth is subscription)
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
        },
      });

      // Create menu
      await tx.menu.create({
        data: { tenantId: tenant.id, name: "Carta Principal" },
      });

      // Create owner user
      await tx.user.create({
        data: {
          id: data.userId,
          email: data.userEmail,
          name: data.userName,
          passwordHash: data.passwordHash,
          tenantId: tenant.id,
          role: "OWNER",
        },
      });

      // Create subscription with FK to Plan
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: starterPlan.id,
          status: "ACTIVE",
        },
      });

      return tenant;
    });
  },

  async updateSettings(tenantId: string, data: Partial<{
    name: string;
    description: string;
    logoUrl: string;
    coverUrl: string;
    phone: string;
    address: string;
    city: string;
    brandColor: string;
    accentColor: string;
    allowDineIn: boolean;
    allowTakeout: boolean;
    allowDelivery: boolean;
    instagramUrl: string;
    facebookUrl: string;
    tiktokUrl: string;
    websiteUrl: string;
  }>) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data,
    });
  },

  async updateSlug(tenantId: string, newSlug: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slugLockedAt: true, createdAt: true },
    });

    if (!tenant) throw new Error("Tenant not found");

    // Slug policy: locked after 30 days from creation
    const thirtyDaysAfterCreation = new Date(tenant.createdAt);
    thirtyDaysAfterCreation.setDate(thirtyDaysAfterCreation.getDate() + 30);

    if (new Date() > thirtyDaysAfterCreation && tenant.slugLockedAt) {
      throw new Error("El slug ya no puede ser modificado. Contacta soporte.");
    }

    return prisma.tenant.update({
      where: { id: tenantId },
      data: {
        slug: newSlug,
        slugChangedAt: new Date(),
        slugLockedAt: new Date(),
      },
    });
  },

  async isSlugAvailable(slug: string, excludeTenantId?: string): Promise<boolean> {
    const existing = await prisma.tenant.findFirst({
      where: {
        slug,
        ...(excludeTenantId ? { NOT: { id: excludeTenantId } } : {}),
      },
      select: { id: true },
    });
    return !existing;
  },

  async addWhatsappWaitlist(tenantId: string, email: string) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: { whatsappWaitlistEmail: email },
    });
  },
};

