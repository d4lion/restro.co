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
  Lock,
} from "lucide-react";
import { isDashboardModuleLocked, type PlanKey, type PlanLimits } from "@/lib/types";
import styles from "@/app/(dashboard)/layout.module.css";

const navItems = [
  { href: "/overview",  label: "Resumen",  icon: LayoutDashboard },
  { href: "/menu",      label: "Carta",    icon: BookOpen },
  { href: "/orders",    label: "Pedidos",  icon: ClipboardList },
  { href: "/tables",    label: "Mesas",    icon: LayoutGrid },
  { href: "/settings",  label: "Config",   icon: Settings },
];

export function MobileDashboardNav({
  plan = "STARTER",
  limits,
}: {
  plan?: string;
  limits?: Partial<PlanLimits>;
}) {
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
        const isLocked = isDashboardModuleLocked(plan as PlanKey, href, limits);

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
            style={{ touchAction: "manipulation", opacity: isLocked && !isActive ? 0.65 : 1 }}
          >
            <span className={styles.mobileNavIcon} style={{ position: "relative" }}>
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              {isLocked && (
                <Lock
                  size={10}
                  strokeWidth={2.5}
                  style={{ position: "absolute", top: -2, right: -6 }}
                />
              )}
            </span>
            {label}
          </Link>
        );
      })}
    </>
  );
}
