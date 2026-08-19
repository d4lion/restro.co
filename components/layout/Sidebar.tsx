"use client";

import React, { useState } from "react";
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
  <span className={styles.buildingBadge} title="En construcción">
    <Wrench size={10} strokeWidth={2.5} />
    DEV
  </span>
);

const navItems: NavItem[] = [
  { href: "/overview",  label: "Resumen",      icon: <LayoutDashboard size={18} strokeWidth={2} /> },
  { href: "/menu",      label: "Carta Digital", icon: <BookOpen        size={18} strokeWidth={2} /> },
  { href: "/orders",    label: "Pedidos (KDS)", icon: <ClipboardList   size={18} strokeWidth={2} /> },
  { href: "/tables",    label: "Mesas & QRs",  icon: <LayoutGrid      size={18} strokeWidth={2} /> },
  { href: "/analytics", label: "Analítica IA", icon: <BarChart3       size={18} strokeWidth={2} /> },
  {
    href: "/whatsapp",
    label: "WhatsApp",
    icon: <MessageCircle size={18} strokeWidth={2} />,
    badge: <BuildingBadge />,
  },
  { href: "/settings",  label: "Configuración", icon: <Settings       size={18} strokeWidth={2} /> },
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

  const planLabel =
    plan === "RESTRO_IA" ? "Restro IA" : plan === "BUSINESS" ? "Business" : "Starter";
  const planClass =
    plan === "RESTRO_IA"
      ? styles["plan--ia"]
      : plan === "BUSINESS"
      ? styles["plan--business"]
      : styles["plan--starter"];

  return (
    <TooltipProvider delayDuration={200}>
      <aside className={`${styles.sidebar} ${collapsed ? styles["sidebar--collapsed"] : ""}`}>

        {/* ── Logo ─────────────────────────────────────────── */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#FFFFFF" fillOpacity="0.15" />
              <rect width="40" height="40" rx="10" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1" />
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
                {plan === "RESTRO_IA" && <Zap size={9} strokeWidth={3} />}
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
            const isActive =
              pathname === item.href ||
              (item.href !== "/overview" && pathname.startsWith(item.href));

            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles["navItem--active"] : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className={styles.navLabel}>{item.label}</span>
                    {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
                  </>
                )}
                {isActive && !collapsed && <span className={styles.activeIndicator} />}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className={styles.footer}>
          {!collapsed && (
            <Link
              href={`/${restaurantSlug}`}
              target="_blank"
              className={styles.viewMenu}
            >
              <ExternalLink size={13} strokeWidth={2} />
              Ver carta pública
            </Link>
          )}
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <span className={collapsed ? styles.rotated : ""}>
              <ChevronLeft size={16} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
