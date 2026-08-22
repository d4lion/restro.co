"use client";

import React, { useState, useRef, useTransition, useEffect } from "react";
import { X, Check, Loader2, Copy, Trash2, Clock, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { updateBusinessHoursAction } from "@/app/actions/settings";
import styles from "./BusinessHoursCard.module.css";

interface BusinessHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

interface BusinessHoursCardProps {
  initialHours: BusinessHour[];
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 0, label: "Domingo", short: "Dom" },
];

interface TimeBlock {
  id: string;
  openTime: string;
  closeTime: string;
}

type WeeklySchedule = Record<number, { isOpen: boolean; blocks: TimeBlock[] }>;

// Helpers for time/minute math
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(1440, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  const hStr = h < 24 ? h.toString().padStart(2, "0") : "24";
  const mStr = m.toString().padStart(2, "0");
  return `${hStr}:${mStr}`;
}

function snapTo15Minutes(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

const TOTAL_GRID_HEIGHT = 576; // 24 hours * 24px

export function BusinessHoursCard({ initialHours }: BusinessHoursCardProps) {
  const [isPending, startTransition] = useTransition();
  const [activeCopyMenu, setActiveCopyMenu] = useState<number | null>(null);

  // Convert initial flat array to weekly schedule map
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
        blocks: dayBlocks,
      };
    });
    return schedule;
  };

  const [schedule, setSchedule] = useState<WeeklySchedule>(getInitialSchedule);

  // Dragging state
  const [dragState, setDragState] = useState<{
    type: "move" | "resize-top" | "resize-bottom" | "create";
    dayOfWeek: number;
    blockId?: string;
    startY: number;
    initialOpenMin: number;
    initialCloseMin: number;
  } | null>(null);

  const daysGridRef = useRef<HTMLDivElement>(null);

  // Handle pointer movements for drag and resize
  useEffect(() => {
    if (!dragState) return;

    function handlePointerMove(e: PointerEvent) {
      if (!dragState) return;
      const deltaY = e.clientY - dragState.startY;
      const deltaMinutes = snapTo15Minutes((deltaY / TOTAL_GRID_HEIGHT) * 1440);

      const { type, dayOfWeek, blockId, initialOpenMin, initialCloseMin } = dragState;

      setSchedule((prev) => {
        const dayData = prev[dayOfWeek];
        if (!dayData) return prev;

        const duration = initialCloseMin - initialOpenMin;
        let newOpenMin = initialOpenMin;
        let newCloseMin = initialCloseMin;

        if (type === "move") {
          newOpenMin = Math.max(0, Math.min(1440 - duration, initialOpenMin + deltaMinutes));
          newCloseMin = newOpenMin + duration;
        } else if (type === "resize-top") {
          newOpenMin = Math.max(0, Math.min(initialCloseMin - 15, initialOpenMin + deltaMinutes));
        } else if (type === "resize-bottom") {
          newCloseMin = Math.max(initialOpenMin + 15, Math.min(1440, initialCloseMin + deltaMinutes));
        }

        const newBlocks = dayData.blocks.map((b) => {
          if (b.id === blockId) {
            return {
              ...b,
              openTime: minutesToTime(newOpenMin),
              closeTime: minutesToTime(newCloseMin),
            };
          }
          return b;
        });

        return {
          ...prev,
          [dayOfWeek]: {
            ...dayData,
            blocks: newBlocks,
          },
        };
      });
    }

    function handlePointerUp() {
      setDragState(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState]);

  // Handle Click/Drag to create a new block on empty column space
  function handleColumnPointerDown(e: React.PointerEvent<HTMLDivElement>, dayOfWeek: number) {
    // If clicked on an existing block or button, ignore
    if ((e.target as HTMLElement).closest(`.${styles.timeBlock}`)) return;

    const dayData = schedule[dayOfWeek];
    if (!dayData?.isOpen) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickMinutes = snapTo15Minutes((clickY / TOTAL_GRID_HEIGHT) * 1440);
    const startMin = Math.max(0, Math.min(1380, clickMinutes));
    const endMin = Math.min(1440, startMin + 120); // Default 2-hour duration

    const newBlockId = crypto.randomUUID();
    const newBlock: TimeBlock = {
      id: newBlockId,
      openTime: minutesToTime(startMin),
      closeTime: minutesToTime(endMin),
    };

    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        blocks: [...prev[dayOfWeek].blocks, newBlock],
      },
    }));

    setDragState({
      type: "resize-bottom",
      dayOfWeek,
      blockId: newBlockId,
      startY: e.clientY,
      initialOpenMin: startMin,
      initialCloseMin: endMin,
    });
  }

  // Toggle Day Switch
  function toggleDay(dayOfWeek: number) {
    setSchedule((prev) => {
      const current = prev[dayOfWeek];
      const willBeOpen = !current.isOpen;
      return {
        ...prev,
        [dayOfWeek]: {
          isOpen: willBeOpen,
          blocks:
            willBeOpen && current.blocks.length === 0
              ? [{ id: crypto.randomUUID(), openTime: "08:00", closeTime: "17:00" }]
              : current.blocks,
        },
      };
    });
  }

  // Remove block
  function removeBlock(dayOfWeek: number, blockId: string) {
    setSchedule((prev) => {
      const current = prev[dayOfWeek];
      const newBlocks = current.blocks.filter((b) => b.id !== blockId);
      return {
        ...prev,
        [dayOfWeek]: {
          ...current,
          blocks: newBlocks,
          isOpen: newBlocks.length > 0,
        },
      };
    });
  }

  // Copy Schedule to other days
  function copyScheduleTo(fromDay: number, target: "all" | "weekdays" | "weekends") {
    const sourceData = schedule[fromDay];
    setSchedule((prev) => {
      const next = { ...prev };
      DAYS_OF_WEEK.forEach((d) => {
        if (d.value === fromDay) return;
        const isWeekday = d.value >= 1 && d.value <= 5;
        const isWeekend = d.value === 6 || d.value === 0;

        if (
          target === "all" ||
          (target === "weekdays" && isWeekday) ||
          (target === "weekends" && isWeekend)
        ) {
          next[d.value] = {
            isOpen: sourceData.isOpen,
            blocks: sourceData.blocks.map((b) => ({
              id: crypto.randomUUID(),
              openTime: b.openTime,
              closeTime: b.closeTime,
            })),
          };
        }
      });
      return next;
    });
    setActiveCopyMenu(null);
    toast.success("Horario copiado correctamente", { duration: 3000 });
  }

  // Helper to serialize schedule for clean equality comparison
  const serializeSchedule = (s: WeeklySchedule) => {
    return JSON.stringify(
      DAYS_OF_WEEK.map((d) => {
        const day = s[d.value];
        return {
          day: d.value,
          isOpen: day?.isOpen ?? false,
          blocks: (day?.blocks ?? [])
            .map((b) => `${b.openTime}-${b.closeTime}`)
            .sort(),
        };
      })
    );
  };

  const [initialSerializedState, setInitialSerializedState] = useState<string>(() =>
    serializeSchedule(getInitialSchedule())
  );

  const isDirty = serializeSchedule(schedule) !== initialSerializedState;

  function handleCancel() {
    setSchedule(getInitialSchedule());
    toast.info("Cambios descartados", { duration: 3000 });
  }

  function handleSave() {
    startTransition(async () => {
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
        setInitialSerializedState(serializeSchedule(schedule));
        toast.success(result.message, { duration: 4000 });
      } else {
        toast.error(result.message, { duration: 5000 });
      }
    });
  }

  // Calculate top & height in px for a time block
  const getBlockStyle = (openTime: string, closeTime: string) => {
    const openMin = timeToMinutes(openTime);
    const closeMin = timeToMinutes(closeTime);
    const durationMin = Math.max(15, closeMin - openMin);

    const topPx = (openMin / 1440) * TOTAL_GRID_HEIGHT;
    const heightPx = (durationMin / 1440) * TOTAL_GRID_HEIGHT;

    return {
      top: `${topPx}px`,
      height: `${heightPx}px`,
    };
  };

  return (
    <div className={styles.card}>
      {/* ── Card Header ────────────────────────────────────────────── */}
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Horarios de Atención</h2>
          <p className={styles.cardSub}>
            Haz clic o arrastra sobre el calendario para definir tus turnos de atención.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={!isDirty || isPending}
          >
            <RotateCcw size={14} />
            Descartar
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!isDirty || isPending}
          >
            {isPending ? (
              <>
                <Loader2 size={14} className={styles.spin} />
                Guardando…
              </>
            ) : (
              <>
                <Check size={14} />
                Guardar Horarios
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Interactive Calendar Container ──────────────────────────── */}
      <div className={styles.calendarContainer}>
        {/* Header Row: Days & Switch Controls & Copy Menu */}
        <div className={styles.headerRow}>
          <div className={styles.timeHeaderColumn} />
          <div className={styles.daysHeaderGrid}>
            {DAYS_OF_WEEK.map((day) => {
              const dayData = schedule[day.value];
              const isOpen = dayData?.isOpen ?? false;
              const isCopyMenuOpen = activeCopyMenu === day.value;

              return (
                <div
                  key={day.value}
                  className={`${styles.dayHeaderCell} ${
                    !isOpen ? styles.dayHeaderCellClosed : ""
                  }`}
                >
                  <div className={styles.dayHeaderTop}>
                    {/* Toggle Day Switch */}
                    <label className={styles.switch} title={isOpen ? "Desactivar día" : "Activar día"}>
                      <input
                        type="checkbox"
                        checked={isOpen}
                        onChange={() => toggleDay(day.value)}
                      />
                      <span className={styles.slider} />
                    </label>

                    {/* Copy Schedule Menu Button */}
                    {isOpen && (
                      <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={() =>
                          setActiveCopyMenu(isCopyMenuOpen ? null : day.value)
                        }
                        title="Copiar horario a otros días"
                      >
                        <Copy size={13} />
                      </button>
                    )}
                  </div>

                  {/* Day Label */}
                  <span
                    className={`${styles.dayLabel} ${
                      !isOpen ? styles.dayLabelClosed : ""
                    }`}
                  >
                    {day.label}
                  </span>

                  {/* Copy Popover Dropdown */}
                  {isCopyMenuOpen && (
                    <div className={styles.copyPopover}>
                      <span className={styles.copyPopoverTitle}>Copiar horario a:</span>
                      <button
                        type="button"
                        className={styles.copyOption}
                        onClick={() => copyScheduleTo(day.value, "all")}
                      >
                        Todos los días
                      </button>
                      <button
                        type="button"
                        className={styles.copyOption}
                        onClick={() => copyScheduleTo(day.value, "weekdays")}
                      >
                        Lun - Vie (Laborables)
                      </button>
                      <button
                        type="button"
                        className={styles.copyOption}
                        onClick={() => copyScheduleTo(day.value, "weekends")}
                      >
                        Sáb - Dom (Fin de semana)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Hours Grid Body */}
        <div className={styles.bodyScroll}>
          {/* Left Time Scale Labels (00:00 - 23:00) */}
          <div className={styles.timeColumn}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className={styles.timeLabel}>
                <span className={styles.timeText}>
                  {i.toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Days Grid Columns */}
          <div className={styles.daysGrid} ref={daysGridRef}>
            {/* Background Hour Lines */}
            <div className={styles.gridLines}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className={styles.gridLine} />
              ))}
            </div>

            {/* 7 Columns */}
            {DAYS_OF_WEEK.map((day) => {
              const dayData = schedule[day.value];
              const isOpen = dayData?.isOpen ?? false;
              const blocks = dayData?.blocks ?? [];

              return (
                <div
                  key={day.value}
                  onPointerDown={(e) => handleColumnPointerDown(e, day.value)}
                  className={`${styles.dayColumn} ${
                    !isOpen ? styles.dayColumnClosed : ""
                  }`}
                >
                  {!isOpen && <span className={styles.closedLabel}>Cerrado</span>}

                  {isOpen &&
                    blocks.map((block) => {
                      const { top, height } = getBlockStyle(
                        block.openTime,
                        block.closeTime
                      );
                      const openMin = timeToMinutes(block.openTime);
                      const closeMin = timeToMinutes(block.closeTime);
                      const durationHours = ((closeMin - openMin) / 60).toFixed(1).replace(".0", "");

                      const isDraggingThis =
                        dragState?.blockId === block.id;

                      return (
                        <div
                          key={block.id}
                          className={`${styles.timeBlock} ${
                            isDraggingThis ? styles.timeBlockDragging : ""
                          }`}
                          style={{ top, height }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              type: "move",
                              dayOfWeek: day.value,
                              blockId: block.id,
                              startY: e.clientY,
                              initialOpenMin: openMin,
                              initialCloseMin: closeMin,
                            });
                          }}
                        >
                          {/* Top Resize Handle */}
                          <div
                            className={styles.resizeHandleTop}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setDragState({
                                type: "resize-top",
                                dayOfWeek: day.value,
                                blockId: block.id,
                                startY: e.clientY,
                                initialOpenMin: openMin,
                                initialCloseMin: closeMin,
                              });
                            }}
                          >
                            <div className={styles.resizeBar} />
                          </div>

                          {/* Delete Block Button */}
                          <button
                            type="button"
                            className={styles.deleteBlockBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBlock(day.value, block.id);
                            }}
                            title="Eliminar este turno"
                          >
                            <X size={10} />
                          </button>

                          {/* Time & Duration Text */}
                          <span className={styles.blockTimeText}>
                            {block.openTime} - {block.closeTime}
                          </span>
                          {parseFloat(height) >= 28 && (
                            <span className={styles.blockDurationText}>
                              {durationHours}h
                            </span>
                          )}

                          {/* Bottom Resize Handle */}
                          <div
                            className={styles.resizeHandleBottom}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setDragState({
                                type: "resize-bottom",
                                dayOfWeek: day.value,
                                blockId: block.id,
                                startY: e.clientY,
                                initialOpenMin: openMin,
                                initialCloseMin: closeMin,
                              });
                            }}
                          >
                            <div className={styles.resizeBar} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
