"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, ShoppingBag, Clock, Bell, CreditCard, LifeBuoy } from "lucide-react";
import styles from "./SettingsNav.module.css";

export const SETTINGS_TABS = [
  {
    href: "/settings",
    label: "Mi Restaurante",
    icon: Store,
    exact: true,
  },
  {
    href: "/settings/orders",
    label: "Formas de Pedir",
    icon: ShoppingBag,
    exact: false,
  },
  {
    href: "/settings/hours",
    label: "Horarios de Atención",
    icon: Clock,
    exact: false,
  },
  {
    href: "/settings/notifications",
    label: "Alertas y Sonidos",
    icon: Bell,
    exact: false,
  },
  {
    href: "/settings/plan",
    label: "Mi Plan y Pagos",
    icon: CreditCard,
    exact: false,
  },
  {
    href: "/settings/support",
    label: "Soporte & Novedades",
    icon: LifeBuoy,
    exact: false,
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.navWrapper} aria-label="Navegación de configuración">
      <div className={styles.navList}>
        {SETTINGS_TABS.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const IconComponent = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tabLink} ${isActive ? styles.tabLinkActive : ""}`}
            >
              <IconComponent size={20} className={styles.icon} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
