import React from "react";
import Link from "next/link";
import { CalendarPlus, ShoppingBag, BellRing, Calculator } from "lucide-react";
import styles from "./QuickActionsBar.module.css";

const actions = [
  { href: "/reservations/new", label: "Nueva Reserva", icon: <CalendarPlus size={20} strokeWidth={1.5} />, color: "var(--brand)" },
  { href: "/orders", label: "Nuevo Pedido", icon: <ShoppingBag size={20} strokeWidth={1.5} />, color: "#0F766E" },
  { href: "#", label: "Llamar Mesero", icon: <BellRing size={20} strokeWidth={1.5} />, color: "#D97706" },
  { href: "#", label: "Cierre de Caja", icon: <Calculator size={20} strokeWidth={1.5} />, color: "#475569" },
];

export function QuickActionsBar() {
  return (
    <div className={styles.container}>
      {actions.map((action, i) => (
        <Link href={action.href} key={i} className={styles.actionCard}>
          <div className={styles.iconBox} style={{ color: action.color, background: `${action.color}15` }}>
            {action.icon}
          </div>
          <span className={styles.label}>{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
