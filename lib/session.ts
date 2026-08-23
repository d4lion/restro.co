import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/types";

/**
 * Level 1 Cache: Cached Session & Tenant Metadata (1 hour TTL)
 * Completely eliminates User ➔ Tenant ➔ Subscription ➔ Plan DB queries on polling requests.
 */
const getCachedPrismaUserSession = (userId: string) =>
  unstable_cache(
    async () => {
      const prismaUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          tenant: {
            include: {
              subscription: {
                include: { plan: true },
              },
            },
          },
        },
      });

      if (!prismaUser) return null;

      const planKey = prismaUser.tenant.subscription?.plan?.key ?? "STARTER";
      const planId = prismaUser.tenant.subscription?.planId ?? "";

      return {
        userId: prismaUser.id,
        tenantId: prismaUser.tenantId,
        role: prismaUser.role as SessionPayload["role"],
        plan: planKey as SessionPayload["plan"],
        planId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    },
    [`user-session-meta-${userId}`],
    {
      revalidate: 3600, // 1 hour
      tags: [`user-session:${userId}`],
    }
  )();

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    return getCachedPrismaUserSession(user.id);
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
});

// Deprecated: No longer used with Supabase Auth, but kept to avoid broken imports if any
export async function createSession() {}
export async function deleteSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
export async function updateSession() {}
