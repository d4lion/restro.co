import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { supportTicketRepository } from "@/lib/repositories/support-ticket.repository";
import { SupportTicketsClient } from "@/components/dashboard/settings/SupportTicketsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soporte & Novedades - Configuración | Restro",
};

export default async function SettingsSupportPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await tenantRepository.findById(session.tenantId);
  if (!tenant) redirect("/login");

  const tickets = await supportTicketRepository.findByTenantId(session.tenantId);

  return (
    <SupportTicketsClient
      initialTickets={tickets}
      restaurantName={tenant.name}
    />
  );
}
