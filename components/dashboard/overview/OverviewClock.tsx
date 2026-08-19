"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import styles from "@/app/(dashboard)/overview/page.module.css";

export function OverviewClock() {
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const datePart = now.toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const timePart = now.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setTimeString(`${datePart} · ${timePart}`);
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={styles.dateBadge}>
      <Clock size={14} strokeWidth={2} style={{ color: "#2563EB" }} />
      {timeString || "Cargando fecha y hora..."}
    </span>
  );
}
