"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  LayoutGrid,
  Settings,
} from "lucide-react";
import styles from "@/app/(dashboard)/layout.module.css";

const navItems = [
  { href: "/overview",  label: "Resumen",  icon: LayoutDashboard },
  { href: "/menu",      label: "Carta",    icon: BookOpen },
  { href: "/orders",    label: "Pedidos",  icon: ClipboardList },
  { href: "/tables",    label: "Mesas",    icon: LayoutGrid },
  { href: "/settings",  label: "Config",   icon: Settings },
];

export function MobileDashboardNav() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== "/overview" && pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            className={`${styles.mobileNavItem} ${isActive ? styles["mobileNavItem--active"] : ""}`}
            // Asegurar área táctil mínima y evitar el delay de 300ms en iOS
            style={{ touchAction: "manipulation" }}
          >
            <span className={styles.mobileNavIcon}>
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
            </span>
            {label}
          </Link>
        );
      })}
    </>
  );
}
