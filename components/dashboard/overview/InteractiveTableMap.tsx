import React from "react";
import Link from "next/link";
import { Utensils, Hourglass, DollarSign } from "lucide-react";
import styles from "./InteractiveTableMap.module.css";

// Assuming table has these properties from DB or enriched
type TableState = "FREE" | "WAITING" | "SERVICE" | "BILLING";

interface TableProps {
  id: string;
  name: string;
  state: TableState;
}

export function InteractiveTableMap({ tables }: { tables: TableProps[] }) {
  const getStateConfig = (state: TableState) => {
    switch (state) {
      case "WAITING":
        return { icon: <Hourglass size={20} strokeWidth={2} />, color: "#D97706", bg: "#FEF3C7", shadow: "rgba(217,119,6,0.3)", label: "Esperando pedido" };
      case "SERVICE":
        return { icon: <Utensils size={20} strokeWidth={2} />, color: "#2563EB", bg: "#EFF6FF", shadow: "rgba(37,99,235,0.3)", label: "En Servicio" };
      case "BILLING":
        return { icon: <DollarSign size={20} strokeWidth={2.5} />, color: "#16A34A", bg: "#DCFCE7", shadow: "rgba(22,163,74,0.3)", label: "Facturando" };
      default:
        return { icon: null, color: "#94A3B8", bg: "#F8FAFC", shadow: "none", label: "Libre" };
    }
  };

  return (
    <div className={styles.mapContainer}>
      <div className={styles.grid}>
        {tables.map((table) => {
          const config = getStateConfig(table.state);
          return (
            <Link href={`/tables/${table.id}`} key={table.id} className={styles.tableCard} style={{ borderColor: table.state === "FREE" ? "#E2E8F0" : config.color, boxShadow: table.state !== "FREE" ? `0 0 10px ${config.shadow}` : "none" }}>
              <div className={styles.iconWrapper} style={{ backgroundColor: config.bg, color: config.color }}>
                {config.icon || <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#CBD5E1" }} />}
              </div>
              <span className={styles.tableName}>{table.name}</span>
              <span className={styles.stateLabel} style={{ color: config.color }}>{config.label}</span>
            </Link>
          );
        })}
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}><span className={styles.dot} style={{ background: "#2563EB" }}/> En Servicio</div>
        <div className={styles.legendItem}><span className={styles.dot} style={{ background: "#D97706" }}/> Esperando pedido</div>
        <div className={styles.legendItem}><span className={styles.dot} style={{ background: "#16A34A" }}/> Facturando</div>
        <div className={styles.legendItem}><span className={styles.dot} style={{ background: "#CBD5E1" }}/> Libre</div>
      </div>
    </div>
  );
}
