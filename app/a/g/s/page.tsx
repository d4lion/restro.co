import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/admin-auth";
import { subscriptionAdminRepository } from "@/lib/repositories/subscription-admin.repository";
import { platformAdminRepository } from "@/lib/repositories/platform-admin.repository";
import { marketResearchRepository } from "@/lib/repositories/market-research.repository";
import { MasterControlHub } from "@/components/admin/MasterControlHub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Master Control — Restro Core",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ObfuscatedAdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/a/g/s");

  if (!isSuperAdmin(session)) {
    notFound();
  }

  // Fetch all tenant data, accounts, global platform metrics, and market research report concurrently
  const [tenants, accounts, metrics, marketReport] = await Promise.all([
    subscriptionAdminRepository.listAllTenants(),
    platformAdminRepository.getAllAccounts(),
    platformAdminRepository.getGlobalMetrics(),
    marketResearchRepository.getMarketResearchReport(),
  ]);

  return (
    <MasterControlHub
      tenants={tenants}
      accounts={accounts}
      metrics={metrics}
      marketReport={marketReport}
      adminEmail={session.email}
    />
  );
}
