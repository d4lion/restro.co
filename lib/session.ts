import "server-only";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/types";

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Supabase user is logged in, find their Prisma User record to get Tenant & Role info
    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Mocked for compatibility
    };
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

// Deprecated: No longer used with Supabase Auth, but kept to avoid broken imports if any
export async function createSession() {}
export async function deleteSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
export async function updateSession() {}

