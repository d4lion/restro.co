import { notFound } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { menuRepository } from "@/lib/repositories/menu.repository";
import { PublicMenuClient } from "@/components/public/PublicMenuClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await tenantRepository.findBySlug(slug);
  if (!tenant) return { title: "Restaurante no encontrado" };
  return {
    title: `${tenant.name} — Carta Digital`,
    description: tenant.description ?? `Explora la carta de ${tenant.name} y haz tu pedido fácilmente.`,
  };
}

export default async function PublicMenuPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await tenantRepository.findBySlug(slug);
  if (!tenant || !tenant.isActive) notFound();

  const menu = await menuRepository.getPublicMenu(tenant.id);

  // Sanitize Prisma objects into plain JSON primitives to prevent React hydration failures
  const categories =
    menu?.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description ?? null,
      items: cat.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? null,
        price: Number(item.price),
        imageUrl: item.imageUrl ?? null,
        isAvailable: Boolean(item.isAvailable),
        isHighlighted: Boolean(item.isHighlighted),
      })),
    })) || [];

  return (
    <PublicMenuClient
      tenantName={tenant.name}
      tenantDescription={tenant.description ?? null}
      logoUrl={tenant.logoUrl ?? null}
      phone={tenant.phone ?? null}
      address={tenant.address ?? null}
      city={tenant.city ?? null}
      brandColor={tenant.brandColor ?? "#0066FF"}
      plan={tenant.plan}
      categories={categories}
    />
  );
}
