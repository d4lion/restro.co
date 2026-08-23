import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { orderRepository } from "@/lib/repositories/order.repository";
import { KdsDashboardClient } from "@/components/dashboard/kds/KdsDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestión de Comandas | Restro" };

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orders = await orderRepository.findByTenant(session.tenantId, 100);

  return (
    <KdsDashboardClient
      initialOrders={orders}
      tenantId={session.tenantId}
    />
  );
}
