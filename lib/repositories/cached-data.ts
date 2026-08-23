import { unstable_cache } from "next/cache";
import { tenantRepository } from "./tenant.repository";
import { menuRepository } from "./menu.repository";
import { planRepository } from "./plan.repository";
import { CACHE_TAGS, CACHE_TTL } from "@/lib/cache";

/**
 * Level 1 Cache: Get public tenant profile by slug
 * Cached per tenant slug with on-demand revalidation tag 'tenant:[slug]'
 */
export async function getCachedTenantBySlug(slug: string) {
  const fetcher = unstable_cache(
    async (s: string) => {
      return tenantRepository.findBySlug(s);
    },
    [`cached-tenant-${slug}`],
    {
      tags: [CACHE_TAGS.tenantSlug(slug)],
      revalidate: CACHE_TTL.tenantProfile,
    }
  );
  return fetcher(slug);
}

/**
 * Level 1 Cache: Get public menu items & categories by tenant ID
 * Cached per tenant ID with on-demand revalidation tag 'menu:[tenantId]'
 */
export async function getCachedPublicMenu(tenantId: string) {
  const fetcher = unstable_cache(
    async (tId: string) => {
      return menuRepository.getPublicMenu(tId);
    },
    [`cached-menu-${tenantId}`],
    {
      tags: [CACHE_TAGS.menuTenantId(tenantId)],
      revalidate: CACHE_TTL.publicMenu,
    }
  );
  return fetcher(tenantId);
}

/**
 * Level 2 Cache: Get all active SaaS subscription plans
 * Cached globally with tag 'saas-plans' for 24 hours
 */
export const getCachedPlans = unstable_cache(
  async () => {
    return planRepository.findAllActive();
  },
  ["cached-all-plans"],
  {
    tags: [CACHE_TAGS.plans],
    revalidate: CACHE_TTL.plans,
  }
);
