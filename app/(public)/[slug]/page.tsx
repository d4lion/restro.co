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

  return (
    <PublicMenuClient
      tenantName={tenant.name}
      tenantDescription={tenant.description}
      logoUrl={tenant.logoUrl}
      phone={tenant.phone}
      address={tenant.address}
      city={tenant.city}
      brandColor={tenant.brandColor}
      plan={tenant.plan}
      categories={menu?.categories || []}
    />
  );
}
