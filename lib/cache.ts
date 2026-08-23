import { revalidateTag, revalidatePath } from "next/cache";

/**
 * Standardized Cache Tags for Next.js Data Cache
 */
export const CACHE_TAGS = {
  tenantSlug: (slug: string) => `tenant:${slug}`,
  menuTenantId: (tenantId: string) => `menu:${tenantId}`,
  plans: "saas-plans",
};

/**
 * Standardized Cache TTLs (in seconds) based on Criticality Level
 */
export const CACHE_TTL = {
  /** Level 1: Public Menu & Tenant Info - 5 minutes with on-demand revalidation */
  publicMenu: 300,
  /** Level 1: Tenant Profile - 5 minutes with on-demand revalidation */
  tenantProfile: 300,
  /** Level 2: SaaS Plans & Feature Limits - 24 hours */
  plans: 86400,
};

/**
 * On-demand revalidation helper when tenant settings/profile change
 */
export function revalidateTenantCache(slug: string) {
  try {
    revalidateTag(CACHE_TAGS.tenantSlug(slug), "default");
    revalidatePath(`/restaurant/${slug}`, "page");
  } catch (error) {
    console.error(`Failed to revalidate tenant cache for slug: ${slug}`, error);
  }
}

/**
 * On-demand revalidation helper when menu items, categories, or modifiers change
 */
export function revalidateMenuCache(tenantId: string, slug?: string) {
  try {
    revalidateTag(CACHE_TAGS.menuTenantId(tenantId), "default");
    if (slug) {
      revalidateTag(CACHE_TAGS.tenantSlug(slug), "default");
      revalidatePath(`/restaurant/${slug}`, "page");
    }
  } catch (error) {
    console.error(`Failed to revalidate menu cache for tenantId: ${tenantId}`, error);
  }
}

/**
 * Revalidate SaaS subscription plans cache
 */
export function revalidatePlansCache() {
  try {
    revalidateTag(CACHE_TAGS.plans, "default");
  } catch (error) {
    console.error("Failed to revalidate plans cache", error);
  }
}
