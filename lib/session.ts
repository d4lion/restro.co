import "server-only";
import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import type { SessionPayload } from "@/lib/types";

function slugifyRestaurantName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Level 1 Cache: Cached Session & Tenant Metadata (1 hour TTL)
 * Completely eliminates User ➔ Tenant ➔ Subscription ➔ Plan DB queries on polling requests.
 */
const getCachedPrismaUserSession = (userId: string, userEmail?: string, userName?: string) =>
  unstable_cache(
    async () => {
      let prismaUser = await prisma.user.findUnique({
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

      // Fallback 1: if Supabase Auth user exists by email in public.User, sync its ID to Supabase Auth UUID
      if (!prismaUser && userEmail) {
        const byEmail = await prisma.user.findUnique({
          where: { email: userEmail.toLowerCase() },
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

        if (byEmail) {
          prismaUser = await prisma.user.update({
            where: { email: userEmail.toLowerCase() },
            data: { id: userId },
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
        }
      }

      // Fallback 2: if a user exists in Supabase Auth (auth.users) whose public.User / Tenant row was missing, auto-restore it
      if (!prismaUser && userEmail) {
        const rawRestaurantName = (userName || userEmail.split("@")[0] || "Mi Restaurante").trim();
        let baseSlug = slugifyRestaurantName(rawRestaurantName) || "restaurante";
        const existingSlug = await prisma.tenant.findUnique({ where: { slug: baseSlug }, select: { id: true } });
        if (existingSlug) {
          baseSlug = `${baseSlug}-${userId.slice(0, 6)}`;
        }

        await tenantRepository.create({
          userId,
          userEmail: userEmail.toLowerCase(),
          userName: rawRestaurantName,
          name: rawRestaurantName,
          slug: baseSlug,
          country: "CO",
          onboarding: true,
        });

        prismaUser = await prisma.user.findUnique({
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
      }

      if (!prismaUser) return null;

      const planKey = prismaUser.tenant.subscription?.plan?.key ?? "STARTER";
      const planId = prismaUser.tenant.subscription?.planId ?? "";

      return {
        userId: prismaUser.id,
        email: prismaUser.email,
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

export function revalidateUserSession(userId: string) {
  try {
    revalidateTag(`user-session:${userId}`, "default");
  } catch (error) {
    console.error("Failed to revalidate user session cache:", error);
  }
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const metaName =
      typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : undefined;

    return getCachedPrismaUserSession(user.id, user.email, metaName);
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
});

export async function createSession() {}
export async function deleteSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
export async function updateSession() {}

