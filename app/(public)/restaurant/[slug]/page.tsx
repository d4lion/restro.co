import { notFound } from "next/navigation";
import { getCachedTenantBySlug, getCachedPublicMenu } from "@/lib/repositories/cached-data";
import { PublicMenuClient } from "@/components/public/PublicMenuClient";
import { isStoreOpenNow } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getCachedTenantBySlug(slug);
  if (!tenant) return { title: "Restaurante no encontrado" };
  return {
    title: `${tenant.name} — Carta Digital`,
    description: tenant.description ?? `Explora la carta de ${tenant.name} y haz tu pedido fácilmente.`,
  };
}

export default async function PublicMenuPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await getCachedTenantBySlug(slug);
  if (!tenant || !tenant.isActive) notFound();

  const menu = await getCachedPublicMenu(tenant.id);

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
    })) || [];

  return (
    <PublicMenuClient
      tenantId={tenant.id}
      tenantName={tenant.name}
      tenantDescription={tenant.description ?? null}
      logoUrl={tenant.logoUrl ?? null}
      coverUrl={tenant.coverUrl ?? null}
      phone={tenant.phone ?? null}
      address={tenant.address ?? null}
      city={tenant.city ?? null}
      brandColor={tenant.brandColor ?? "#0066FF"}
      instagramUrl={tenant.instagramUrl ?? null}
      facebookUrl={tenant.facebookUrl ?? null}
      tiktokUrl={tenant.tiktokUrl ?? null}
      websiteUrl={tenant.websiteUrl ?? null}
      plan={tenant.subscription?.plan?.key ?? "STARTER"}
      categories={categories}
      isOpen={isStoreOpenNow(tenant.businessHours, tenant.timezone)}
      businessHours={tenant.businessHours}
    />
  );
}
