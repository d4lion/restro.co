import React from "react";
import styles from "./Input.module.css";
import { ChevronDown } from "lucide-react";

interface HourPickerProps {
  value: string; // 24h format HH:mm e.g., "14:30"
  onChange: (value: string) => void;
}

export function HourPicker({ value, onChange }: HourPickerProps) {
  const [h24, min] = (value || "08:00").split(":");
  const minute = min || "00";

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${e.target.value.padStart(2, "0")}:${minute}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${h24}:${e.target.value}`);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      {/* Hour Select (24h) */}
      <div style={{ position: "relative" }}>
        <select
          value={h24}
          onChange={handleHourChange}
          className={styles.input}
          style={{ paddingRight: "28px", cursor: "pointer", appearance: "none", width: "60px", paddingLeft: "10px" }}
        >
          {Array.from({ length: 24 }, (_, i) => i).map((h) => (
            <option key={h} value={h.toString().padStart(2, "0")}>
              {h.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
        <ChevronDown size={14} color="#64748B" style={{ position: "absolute", right: "8px", top: "13px", pointerEvents: "none" }} />
      </div>

      <span style={{ fontWeight: 600, color: "#334155" }}>:</span>

      {/* Minute Select */}
      <div style={{ position: "relative" }}>
        <select
          value={minute}
          onChange={handleMinuteChange}
          className={styles.input}
          style={{ paddingRight: "28px", cursor: "pointer", appearance: "none", width: "60px", paddingLeft: "10px" }}
        >
          {["00", "15", "30", "45"].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <ChevronDown size={14} color="#64748B" style={{ position: "absolute", right: "8px", top: "13px", pointerEvents: "none" }} />
      </div>
    </div>
  );
}
