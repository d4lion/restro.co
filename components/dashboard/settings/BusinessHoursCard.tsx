"use client";

import React, { useState, useTransition } from "react";
import { Pencil, X, Check, Loader2, Plus, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { updateBusinessHoursAction } from "@/app/actions/settings";
import styles from "./ProfileCard.module.css";
import { HourPicker } from "@/components/ui/HourPicker";

interface BusinessHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

interface BusinessHoursCardProps {
  initialHours: BusinessHour[];
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

// Helper definition for robust state management
interface TimeBlock {
  id: string; // unique ID for React keys and safe updates
  openTime: string;
  closeTime: string;
}

type WeeklySchedule = Record<number, { isOpen: boolean; blocks: TimeBlock[] }>;

export function BusinessHoursCard({ initialHours }: BusinessHoursCardProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Convert initial flat array to organized weekly schedule dictionary
  const getInitialSchedule = (): WeeklySchedule => {
    const schedule: WeeklySchedule = {};
    DAYS_OF_WEEK.forEach((day) => {
      const dayBlocks = initialHours
        .filter((h) => h.dayOfWeek === day.value)
        .map((h) => ({
          id: crypto.randomUUID(),
          openTime: h.openTime,
          closeTime: h.closeTime,
        }));
      schedule[day.value] = {
        isOpen: dayBlocks.length > 0,
        blocks: dayBlocks.length > 0 ? dayBlocks : [],
      };
    });
    return schedule;
  };

  const [schedule, setSchedule] = useState<WeeklySchedule>(getInitialSchedule);

  function handleCancel() {
    setSchedule(getInitialSchedule());
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      // Flatten schedule back to flat array
      const draftArray: BusinessHour[] = [];
      Object.entries(schedule).forEach(([dayStr, data]) => {
        const dayOfWeek = parseInt(dayStr, 10);
        if (data.isOpen) {
          data.blocks.forEach((b) => {
            draftArray.push({
              dayOfWeek,
              openTime: b.openTime,
              closeTime: b.closeTime,
            });
          });
        }
      });

      const result = await updateBusinessHoursAction(draftArray);
      if (result.success) {
        toast.success(result.message, { duration: 4000 });
        setEditing(false);
      } else {
        toast.error(result.message, { duration: 5000 });
      }
    });
  }

  function toggleDay(dayOfWeek: number) {
    setSchedule((prev) => {
      const current = prev[dayOfWeek];
      const willBeOpen = !current.isOpen;
      return {
        ...prev,
        [dayOfWeek]: {
          isOpen: willBeOpen,
          // If opening and has no blocks, add a default block
          blocks: willBeOpen && current.blocks.length === 0
            ? [{ id: crypto.randomUUID(), openTime: "08:00", closeTime: "17:00" }]
            : current.blocks,
        },
      };
    });
  }

  function addBlock(dayOfWeek: number) {
    setSchedule((prev) => {
      const current = prev[dayOfWeek];
      return {
        ...prev,
        [dayOfWeek]: {
          ...current,
          blocks: [
            ...current.blocks,
            { id: crypto.randomUUID(), openTime: "08:00", closeTime: "17:00" },
          ],
        },
      };
    });
  }

  function removeBlock(dayOfWeek: number, blockId: string) {
    setSchedule((prev) => {
      const current = prev[dayOfWeek];
      const newBlocks = current.blocks.filter((b) => b.id !== blockId);
      return {
        ...prev,
        [dayOfWeek]: {
          ...current,
          blocks: newBlocks,
          // Automatically close the day if the last block is removed
          isOpen: newBlocks.length > 0, 
        },
      };
    });
  }

  function updateBlock(dayOfWeek: number, blockId: string, field: "openTime" | "closeTime", value: string) {
    setSchedule((prev) => {
      const current = prev[dayOfWeek];
      const newBlocks = current.blocks.map((b) =>
        b.id === blockId ? { ...b, [field]: value } : b
      );
      return {
        ...prev,
        [dayOfWeek]: {
          ...current,
          blocks: newBlocks,
        },
      };
    });
  }

  const formatTime = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  // --- Calendar Grid Rendering Helpers ---
  const pixelsPerHour = 24; 
  const totalHours = 24;
  
  const calculateBlockStyles = (openTime: string, closeTime: string) => {
    const parse = (t: string) => {
      const [h, m] = t.split(":");
      return parseInt(h, 10) + parseInt(m, 10) / 60;
    };
    const start = parse(openTime);
    let end = parse(closeTime);
    if (end < start) end += 24; // Handle overnight (basic)
    
    const top = start * pixelsPerHour;
    const height = (end - start) * pixelsPerHour;
    return { top: `${top}px`, height: `${height}px` };
  };

  return (
    <div className={`${styles.card} ${editing ? styles.cardEditing : ""}`} style={{ overflow: "visible" }}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Horarios de Atención</h2>
          {!editing && (
            <p className={styles.cardHint}>
              Haz clic en <strong>Editar</strong> para configurar los días y horas que atiendes.
            </p>
          )}
        </div>

        {!editing ? (
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => setEditing(true)}
          >
            <Pencil size={14} strokeWidth={2.5} />
            Editar
          </button>
        ) : (
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={isPending}
          >
            <X size={14} strokeWidth={2.5} />
            Cancelar
          </button>
        )}
      </div>

      {/* Visual Calendar Grid */}
      <div style={{ marginTop: "24px", marginBottom: "32px", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", backgroundColor: "#FFFFFF" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", backgroundColor: "#F8FAFC" }}>
          <div style={{ width: "50px", flexShrink: 0, borderRight: "1px solid var(--border)" }}></div>
          <div style={{ display: "flex", flex: 1, overflowX: "auto" }}>
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} style={{ flex: "1 0 60px", minWidth: "60px", padding: "8px 4px", textAlign: "center", borderRight: "1px solid var(--border)", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
                {day.label.slice(0, 3)}
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ display: "flex", height: `${totalHours * pixelsPerHour}px`, overflowY: "auto", position: "relative" }}>
          {/* Time Labels Column */}
          <div style={{ width: "50px", flexShrink: 0, borderRight: "1px solid var(--border)", backgroundColor: "#F8FAFC", position: "relative" }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{ height: `${pixelsPerHour}px`, position: "relative" }}>
                <span style={{ position: "absolute", top: "-7px", right: "6px", fontSize: "10px", color: "#94A3B8", lineHeight: 1 }}>
                  {i.toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>
          
          {/* Days Grid Columns */}
          <div style={{ display: "flex", flex: 1, overflowX: "auto", position: "relative" }}>
            {/* Background Grid Lines */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 1 }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} style={{ height: `${pixelsPerHour}px`, borderBottom: "1px solid #CBD5E1", width: "100%", opacity: 0.5 }} />
              ))}
            </div>

            {DAYS_OF_WEEK.map((day) => {
              const { isOpen, blocks } = schedule[day.value];
              return (
                <div 
                  key={day.value} 
                  style={{ 
                    flex: "1 0 60px", 
                    minWidth: "60px", 
                    borderRight: "1px solid var(--border)", 
                    position: "relative", 
                    // Unused hours background (gray pattern)
                    backgroundColor: "#F1F5F9",
                    backgroundImage: "repeating-linear-gradient(45deg, #F8FAFC, #F8FAFC 4px, #F1F5F9 4px, #F1F5F9 8px)" 
                  }}
                >
                  {isOpen && blocks.map((block) => {
                    const { top, height } = calculateBlockStyles(block.openTime, block.closeTime);
                    const s = parseInt(block.openTime.split(":")[0]) + parseInt(block.openTime.split(":")[1])/60;
                    let e = parseInt(block.closeTime.split(":")[0]) + parseInt(block.closeTime.split(":")[1])/60;
                    if (e < s) e += 24;
                    const dur = e - s;
                    const hrs = Math.floor(dur);
                    const mins = Math.round((dur - hrs) * 60);
                    const durText = mins === 0 ? `${hrs}h` : `${hrs}h ${mins}m`;

                    return (
                      <div
                        key={block.id}
                        style={{
                          position: "absolute",
                          left: "2px",
                          right: "2px",
                          top,
                          height,
                          backgroundColor: "#2563EB", // Solid Blue from design.md
                          borderRadius: "4px",
                          opacity: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "2px",
                          overflow: "hidden",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
                          zIndex: 10, // Ensure it's above everything
                          color: "white",
                          fontSize: "10px",
                          fontWeight: 600,
                          lineHeight: 1.1
                        }}
                      >
                        {parseFloat(height) >= 24 && (
                          <span>{durText}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {DAYS_OF_WEEK.map((day) => {
          const { isOpen, blocks } = schedule[day.value];

          return (
            <div 
              key={day.value} 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                padding: "16px", 
                backgroundColor: isOpen ? "var(--bg-body)" : "transparent",
                border: isOpen ? "1px solid var(--border)" : "1px dashed var(--border)",
                borderRadius: "12px",
                transition: "all 0.2s ease"
              }}
            >
              {/* Day Header Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ 
                  fontWeight: 600, 
                  fontSize: "15px",
                  color: isOpen ? "var(--text)" : "var(--text-muted)",
                }}>
                  {day.label}
                </span>

                {editing ? (
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
                    <input
                      type="checkbox"
                      checked={isOpen}
                      onChange={() => toggleDay(day.value)}
                      style={{ opacity: 0, position: "absolute", width: 0, height: 0 }}
                      title={isOpen ? "Marcar como cerrado" : "Marcar como abierto"}
                    />
                    <div style={{
                      width: "44px", height: "24px", borderRadius: "12px",
                      backgroundColor: isOpen ? "#2563EB" : "#E2E8F0",
                      transition: "all 0.3s ease", position: "relative",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
                    }}>
                      <div style={{
                        width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white",
                        position: "absolute", top: "2px", left: isOpen ? "22px" : "2px", transition: "all 0.3s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                      }} />
                    </div>
                  </label>
                ) : (
                  <span style={{ 
                    fontSize: "13px", 
                    fontWeight: 600, 
                    padding: "4px 10px", 
                    borderRadius: "12px", 
                    backgroundColor: isOpen ? "#DCFCE7" : "#FEE2E2", 
                    color: isOpen ? "#166534" : "#991B1B" 
                  }}>
                    {isOpen ? "Abierto" : "Cerrado"}
                  </span>
                )}
              </div>

              {/* Day Content (Time Blocks) */}
              <div style={{ 
                marginTop: isOpen ? "12px" : "0", 
                height: isOpen ? "auto" : "0", 
                overflow: "hidden", 
                opacity: isOpen ? 1 : 0,
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                {blocks.map((block) => (
                  <div key={block.id} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    {editing ? (
                      <div style={{ display: "flex", alignItems: "center", flex: 1, gap: "12px" }}>
                        {/* Custom styled time input container */}
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <HourPicker
                            value={block.openTime}
                            onChange={(val) => updateBlock(day.value, block.id, "openTime", val)}
                          />
                        </div>
                        
                        <span style={{ color: "var(--text-muted)", fontWeight: 500, margin: "0 8px" }}>a</span>
                        
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <HourPicker
                            value={block.closeTime}
                            onChange={(val) => updateBlock(day.value, block.id, "closeTime", val)}
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeBlock(day.value, block.id)}
                          style={{ 
                            background: "#FEF2F2", border: "1px solid #FEE2E2", color: "#DC2626", 
                            cursor: "pointer", padding: "10px", borderRadius: "8px", 
                            display: "flex", alignItems: "center", justifyContent: "center", 
                            transition: "all 0.2s" 
                          }}
                          title="Eliminar este turno"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "6px 0" }}>
                        <Clock size={16} color="var(--text-muted)" />
                        <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)" }}>{block.openTime}</span>
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                        <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)" }}>{block.closeTime}</span>
                      </div>
                    )}
                  </div>
                ))}

                {editing && (
                  <div style={{ paddingTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => addBlock(day.value)}
                      style={{ 
                        background: "white", border: "1px dashed var(--border)", 
                        color: "var(--text)", fontSize: "13px", fontWeight: 500, 
                        padding: "8px 16px", borderRadius: "8px", display: "inline-flex", 
                        alignItems: "center", gap: "6px", cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <Plus size={14} color="var(--brand)" /> Agregar franja horaria
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className={styles.saveBar} style={{ marginTop: "24px" }}>
          <button
            type="button"
            className={styles.cancelBtnInline}
            onClick={handleCancel}
            disabled={isPending}
          >
            <X size={14} strokeWidth={2.5} />
            Descartar
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            disabled={isPending}
            onClick={handleSave}
          >
            {isPending ? (
              <>
                <Loader2 size={14} strokeWidth={2.5} className={styles.spin} />
                Guardando…
              </>
            ) : (
              <>
                <Check size={14} strokeWidth={2.5} />
                Guardar Horarios
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
