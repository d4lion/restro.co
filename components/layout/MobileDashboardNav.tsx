"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  useEffect(() => {
    // Eagerly prefetch the most critical dashboard routes (Resumen & Carta) on mobile
    router.prefetch("/overview");
    router.prefetch("/menu");
  }, [router]);

  return (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isCurrentRoute =
          pathname === href ||
          (href !== "/overview" && pathname.startsWith(href));

        const isPending =
          pendingPath !== null &&
          (pendingPath === href ||
            (href !== "/overview" && pendingPath.startsWith(href)));

        const isActive = isPending || (pendingPath === null && isCurrentRoute);

        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            onMouseEnter={() => router.prefetch(href)}
            onTouchStart={() => router.prefetch(href)}
            onFocus={() => router.prefetch(href)}
            onClick={() => {
              if (pathname !== href) {
                setPendingPath(href);
              }
            }}
            className={`${styles.mobileNavItem} ${isActive ? styles["mobileNavItem--active"] : ""}`}
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
