import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getSession } from "@/lib/session";
import { tenantRepository } from "@/lib/repositories/tenant.repository";
import { SettingsNav } from "@/components/dashboard/settings/SettingsNav";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuración | Restro",
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await tenantRepository.findById(session.tenantId);
  if (!tenant) redirect("/login");

  return (
    <div className={styles.page}>
      {/* ── Settings Header ───────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Configuración</h1>
            <p className={styles.subtitle}>
              Administra los datos de tu restaurante, opciones de pedido, horarios, alertas y tu plan de suscripción.
            </p>
          </div>

          <Link
            href={`/restaurant/${tenant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.publicMenuButton}
          >
            <ExternalLink size={16} />
            <span>Ver carta pública</span>
          </Link>
        </div>
      </div>

      {/* ── Horizontal Navigation Tabs ────────────────────── */}
      <SettingsNav />

      {/* ── Sub-page Content ──────────────────────────────── */}
      {children}
    </div>
  );
}
