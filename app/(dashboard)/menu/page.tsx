import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { menuRepository } from "@/lib/repositories/menu.repository";
import { planRepository } from "@/lib/repositories/plan.repository";
import { PLAN_LIMITS, type PlanKey } from "@/lib/types";
import { MenuPageClient } from "@/components/dashboard/menu/MenuPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestión de Carta" };

export default async function MenuPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [menu, planInfo] = await Promise.all([
    menuRepository.getFullMenu(session.tenantId),
    planRepository.getPlanForTenant(session.tenantId),
  ]);

  const plan = (planInfo?.plan.key ?? session.plan ?? "STARTER") as PlanKey;
  const limits = planInfo?.limits ?? PLAN_LIMITS[plan];
  const maxMenuItems = Number.isFinite(limits.maxMenuItems) ? limits.maxMenuItems : null;

  // Sanitize Prisma model instances into plain JSON primitives
  const sanitizedMenu = menu
    ? {
        id: menu.id,
        tenantId: session.tenantId,
        reusableModifierGroups: (menu.reusableModifierGroups ?? []).map((g) => ({
          id: g.id,
          name: g.name,
          isRequired: g.isRequired,
          minSelections: g.minSelections,
          maxSelections: g.maxSelections,
          options: g.options.map((o) => ({
            id: o.id,
            name: o.name,
            priceExtra: Number(o.priceExtra),
            isAvailable: Boolean(o.isAvailable),
          })),
        })),
        categories: menu.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          items: cat.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description ?? null,
            price: Number(item.price),
            imageUrl: item.imageUrl ?? null,
            isAvailable: Boolean(item.isAvailable),
            modifierGroups: (item as unknown as { modifierGroups?: { id: string; name: string; isRequired: boolean; minSelections: number; maxSelections: number; options: { id: string; name: string; priceExtra: number | string | object; isAvailable: boolean }[] }[] }).modifierGroups ? (item as unknown as { modifierGroups: { id: string; name: string; isRequired: boolean; minSelections: number; maxSelections: number; options: { id: string; name: string; priceExtra: number | string | object; isAvailable: boolean }[] }[] }).modifierGroups.map((g) => ({
              id: g.id,
              name: g.name,
              isRequired: g.isRequired,
              minSelections: g.minSelections,
              maxSelections: g.maxSelections,
              options: g.options.map((o) => ({
                id: o.id,
                name: o.name,
                priceExtra: Number(o.priceExtra),
                isAvailable: Boolean(o.isAvailable)
              }))
            })) : []
          })),
        })),
      }
    : null;

  return (
    <MenuPageClient
      initialMenu={sanitizedMenu}
      plan={plan}
      planLabel={limits.label}
      maxMenuItems={maxMenuItems}
    />
  );
}
