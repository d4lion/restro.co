import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { menuRepository } from "@/lib/repositories/menu.repository";
import { MenuPageClient } from "@/components/dashboard/menu/MenuPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestión de Carta" };

export default async function MenuPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const menu = await menuRepository.getFullMenu(session.tenantId);

  // Sanitize Prisma model instances into plain JSON primitives
  const sanitizedMenu = menu
    ? {
        id: menu.id,
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
          })),
        })),
      }
    : null;

  return <MenuPageClient menu={sanitizedMenu} />;
}
