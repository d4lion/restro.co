"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  LayoutGrid,
  BarChart3,
  MessageCircle,
  Settings,
  ChevronLeft,
  ExternalLink,
  Wrench,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import styles from "./Sidebar.module.css";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
}

const BuildingBadge = () => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className={styles.buildingBadge}>
        <Wrench size={10} strokeWidth={2.5} />
        DEV
      </span>
    </TooltipTrigger>
    <TooltipContent side="top">Módulo en desarrollo</TooltipContent>
  </Tooltip>
);

const navItems: NavItem[] = [
  { href: "/overview",  label: "Resumen",      icon: <LayoutDashboard size={18} strokeWidth={1.8} /> },
  { href: "/menu",      label: "Carta Digital", icon: <BookOpen        size={18} strokeWidth={1.8} /> },
  { href: "/orders",    label: "Pedidos",      icon: <ClipboardList   size={18} strokeWidth={1.8} /> },
  { href: "/tables",    label: "Mesas & QRs",  icon: <LayoutGrid      size={18} strokeWidth={1.8} /> },
  { href: "/analytics", label: "Analítica IA", icon: <BarChart3       size={18} strokeWidth={1.8} /> },
  {
    href: "/whatsapp",
    label: "WhatsApp",
    icon: <MessageCircle size={18} strokeWidth={1.8} />,
    badge: <BuildingBadge />,
  },
  { href: "/settings",  label: "Configuración", icon: <Settings       size={18} strokeWidth={1.8} /> },
];

interface SidebarProps {
  restaurantName?: string;
  restaurantSlug?: string;
  plan?: string;
}

export function Sidebar({
  restaurantName = "Mi Restaurante",
  restaurantSlug = "mi-restaurante",
  plan = "STARTER",
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  const planLabel =
    plan === "RESTRO_IA" ? "Restro IA" : plan === "BUSINESS" ? "Business" : "Starter";
  const planClass =
    plan === "RESTRO_IA"
      ? styles["plan--ia"]
      : plan === "BUSINESS"
      ? styles["plan--business"]
      : styles["plan--starter"];

  return (
    <TooltipProvider delayDuration={100}>
      <aside className={`${styles.sidebar} ${collapsed ? styles["sidebar--collapsed"] : ""}`}>

        {/* ── Logo ─────────────────────────────────────────── */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="#2563EB" />
              <path d="M10 28L20 12L30 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 22H25" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          {!collapsed && <span className={styles.logoText}>Restro</span>}
        </div>

        {/* ── Restaurant info ──────────────────────────────── */}
        {!collapsed && (
          <div className={styles.restaurant}>
            <div className={styles.restaurantAvatar}>
              {restaurantName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.restaurantInfo}>
              <div className={styles.restaurantName}>{restaurantName}</div>
              <span className={`${styles.planBadge} ${planClass}`}>
                {plan === "RESTRO_IA" && <Zap size={10} strokeWidth={2.5} />}
                {planLabel}
              </span>
            </div>
          </div>
        )}

        {/* ── Divider ─────────────────────────────────────── */}
        <div className={styles.divider} />

        {/* ── Navigation ──────────────────────────────────── */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isCurrentRoute =
              pathname === item.href ||
              (item.href !== "/overview" && pathname.startsWith(item.href));

            const isPending =
              pendingPath !== null &&
              (pendingPath === item.href ||
                (item.href !== "/overview" && pendingPath.startsWith(item.href)));

            const isActive = isPending || (pendingPath === null && isCurrentRoute);

            const link = (
              <Link
                href={item.href}
                onClick={() => {
                  if (pathname !== item.href) {
                    setPendingPath(item.href);
                  }
                }}
                className={`${styles.navItem} ${
                  isPending
                    ? styles["navItem--pending"]
                    : isActive
                    ? styles["navItem--active"]
                    : ""
                }`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className={styles.navLabel}>{item.label}</span>
                    {isPending ? (
                      <span className={styles.pendingSpinner} />
                    ) : (
                      item.badge && <span className={styles.navBadge}>{item.badge}</span>
                    )}
                  </>
                )}
                {isActive && !isPending && !collapsed && (
                  <span className={styles.activeIndicator} />
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <React.Fragment key={item.href}>{link}</React.Fragment>;
          })}
        </nav>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className={styles.footer}>
          {!collapsed ? (
            <Link
              href={`/restaurant/${restaurantSlug}`}
              target="_blank"
              className={styles.viewMenu}
            >
              <ExternalLink size={14} strokeWidth={1.8} />
              Ver carta pública
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/restaurant/${restaurantSlug}`}
                  target="_blank"
                  className={styles.viewMenu}
                  style={{ justifyContent: "center" }}
                >
                  <ExternalLink size={14} strokeWidth={1.8} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                Ver carta pública
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={styles.collapseBtn}
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
              >
                <span className={collapsed ? styles.rotated : ""}>
                  <ChevronLeft size={16} strokeWidth={2} />
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12}>
              {collapsed ? "Expandir menú" : "Colapsar menú"}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
