import { notFound } from "next/navigation";
import { getCachedTenantBySlug, getCachedPublicMenu } from "@/lib/repositories/cached-data";
import { PublicMenuClient } from "@/components/public/PublicMenuClient";
import { findProductByViewParam } from "@/components/public/ItemConfiguratorModal";
import { ServiceUnavailable } from "@/components/errors/ServiceUnavailable";
import { isDatabaseUnavailableError } from "@/lib/db-errors";
import { isStoreOpenNow } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ activeProductView?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  let tenant: Awaited<ReturnType<typeof getCachedTenantBySlug>>;
  try {
    tenant = await getCachedTenantBySlug(slug);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) return { title: "Servicio no disponible" };
    throw error;
  }
  if (!tenant) return { title: "Restaurante no encontrado" };

  if (resolvedSearch?.activeProductView) {
    try {
      const menu = await getCachedPublicMenu(tenant.id);
      const allItems =
        menu?.categories.flatMap((c) =>
          c.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description ?? null,
            imageUrl: item.imageUrl ?? null,
          }))
        ) ?? [];
      const matched = findProductByViewParam(allItems, resolvedSearch.activeProductView);
      if (matched) {
        const title = `${matched.name} · ${tenant.name}`;
        const description =
          matched.description ?? `Mira ${matched.name} en la carta digital de ${tenant.name}.`;
        return {
          title,
          description,
          openGraph: matched.imageUrl
            ? {
                title,
                description,
                images: [{ url: matched.imageUrl }],
              }
            : undefined,
        };
      }
    } catch {
      // Fallback to default restaurant metadata if menu lookup fails
    }
  }

  return {
    title: `${tenant.name} — Carta Digital`,
    description: tenant.description ?? `Explora la carta de ${tenant.name} y haz tu pedido fácilmente.`,
  };
}

export default async function PublicMenuPage({ params }: Props) {
  const { slug } = await params;
  let tenant: Awaited<ReturnType<typeof getCachedTenantBySlug>>;
  let menu: Awaited<ReturnType<typeof getCachedPublicMenu>>;
  try {
    tenant = await getCachedTenantBySlug(slug);
    if (!tenant || !tenant.isActive) notFound();
    menu = await getCachedPublicMenu(tenant.id);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      console.error(`[restaurant/${slug}] Database unavailable:`, error);
      return <ServiceUnavailable />;
    }
    throw error; // re-throw notFound() and any other error
  }

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

  const planKey = tenant.subscription?.plan?.key ?? "STARTER";
  // Starter & Carta Digital never send orders to the kitchen (KDS): menu-only plans.
  const isPlanMenuOnly = planKey === "STARTER" || planKey === "CARTA_DIGITAL";
  // WhatsApp ordering is active if allowed and the owner has not set "Solo Carta Visual".
  const whatsappOrderingEnabled =
    Boolean(tenant.allowWhatsAppOrdering) && !tenant.isMenuOnly;

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
      plan={planKey}
      categories={categories}
      isOpen={isStoreOpenNow(tenant.businessHours, tenant.timezone)}
      businessHours={tenant.businessHours}
      isMenuOnly={tenant.isMenuOnly}
      isPlanMenuOnly={isPlanMenuOnly}
      allowDineIn={tenant.allowDineIn}
      requireTableQrForDineIn={tenant.requireTableQrForDineIn}
      allowTakeout={tenant.allowTakeout}
      allowDelivery={tenant.allowDelivery}
      allowWhatsAppOrdering={whatsappOrderingEnabled}
      whatsappNumber={tenant.whatsappNumber ?? tenant.phone ?? null}
      tableCartEnabled={planKey === "CARTA_DIGITAL"}
    />
  );
}
