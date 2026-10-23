"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Bookmark,
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowLeft,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { ModifierGroupData } from "./MenuPageClient";
import { formatCOPInput, parseCOPInput } from "./ItemFormModal";
import styles from "./ItemFormModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reusableGroups: ModifierGroupData[];
  usageCountByGroupName?: Record<string, number>;
  onSaveReusableGroup: (
    group: ModifierGroupData
  ) => Promise<{ success: boolean; message?: string }>;
  onDeleteReusableGroup: (
    groupId: string
  ) => Promise<{ success: boolean; message?: string }>;
}

export function ManageReusableGroupsModal({
  isOpen,
  onClose,
  reusableGroups,
  usageCountByGroupName = {},
  onSaveReusableGroup,
  onDeleteReusableGroup,
}: Props) {
  const [editingGroup, setEditingGroup] = useState<ModifierGroupData | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const startNewGroup = () => {
    setEditingGroup({
      id: `temp-reusable-${Date.now()}`,
      name: "",
      isRequired: false,
      minSelections: 0,
      maxSelections: 1,
      saveAsReusable: true,
      options: [
        {
          id: `temp-ropt-${Date.now()}`,
          name: "",
          priceExtra: 0,
          isAvailable: true,
        },
      ],
    });
  };

  const startEditGroup = (tpl: ModifierGroupData) => {
    setEditingGroup({
      ...tpl,
      previousName: tpl.name,
      saveAsReusable: true,
      options: tpl.options.map((o) => ({ ...o })),
    });
  };

  const handleSave = async () => {
    if (!editingGroup) return;
    const cleanName = editingGroup.name.trim();
    if (!cleanName) {
      toast.error("El nombre del grupo de acompañantes es obligatorio");
      return;
    }

    const validOpts = editingGroup.options
      .filter((o) => o.name.trim().length > 0)
      .map((o) => ({
        ...o,
        name: o.name.trim(),
      }));

    if (validOpts.length === 0) {
      toast.error("Agrega al menos una opción con nombre");
      return;
    }

    setIsSaving(true);
    const res = await onSaveReusableGroup({
      ...editingGroup,
      name: cleanName,
      previousName: editingGroup.previousName || cleanName,
      saveAsReusable: true,
      options: validOpts,
    });
    setIsSaving(false);

    if (res.success) {
      toast.success(
        res.message ||
          `Grupo "${cleanName}" guardado y actualizado en todos los platos`
      );
      setEditingGroup(null);
    } else {
      toast.error(res.message || "No se pudo guardar el grupo");
    }
  };

  const handleDelete = async (tpl: ModifierGroupData) => {
    if (tpl.id.startsWith("derived-")) {
      toast.info(
        "Este grupo proviene de un plato existente. Edítalo y guárdalo para administrarlo en tu biblioteca."
      );
      return;
    }
    if (
      !confirm(
        `¿Eliminar "${tpl.name}" de la biblioteca de acompañantes reutilizables?`
      )
    ) {
      return;
    }

    setDeletingId(tpl.id);
    const res = await onDeleteReusableGroup(tpl.id);
    setDeletingId(null);

    if (res.success) {
      toast.success("Grupo eliminado de la biblioteca");
    } else {
      toast.error(res.message || "Error al eliminar el grupo");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setEditingGroup(null);
        onClose();
      }}
      title={
        editingGroup
          ? editingGroup.previousName
            ? `Editar Acompañante: ${editingGroup.previousName}`
            : "Nuevo Acompañante Reutilizable"
          : "Acompañantes Reutilizables"
      }
      size="lg"
    >
      <div className={styles.container}>
        <div className={styles.content} style={{ maxHeight: "65vh" }}>
          {!editingGroup ? (
            <div className={styles.modifiersSection}>
              <div className={styles.modToolbar}>
                <div className={styles.modToolbarLeft}>
                  <p className={styles.modSubtitle}>
                    Administra tus grupos de acompañantes guardados. Al
                    actualizar un grupo aquí, todos los platos que lo usen se
                    actualizarán automáticamente.
                  </p>
                </div>
                <Button onClick={startNewGroup} type="button">
                  <Plus size={15} /> Nuevo Grupo
                </Button>
              </div>

              {reusableGroups.length === 0 ? (
                <div className={styles.emptyModifiers}>
                  <Bookmark size={28} color="#94a3b8" />
                  <p>
                    Aún no tienes acompañantes reutilizables (ej. Bebidas,
                    Salsas, Guarniciones).
                  </p>
                  <Button onClick={startNewGroup} type="button">
                    <Plus size={15} /> Crear Primer Grupo Reutilizable
                  </Button>
                </div>
              ) : (
                <div className={styles.groupsList}>
                  {reusableGroups.map((tpl) => {
                    const usageCount =
                      usageCountByGroupName[tpl.name.trim().toLowerCase()] || 0;

                    return (
                      <div
                        key={tpl.id}
                        className={`${styles.groupCard} ${styles.reusableReadOnlyCard}`}
                      >
                        <div className={styles.reusableCardTopRow}>
                          <div className={styles.reusableCardTitleBlock}>
                            <div className={styles.reusableCardTitleLine}>
                              <span className={styles.reusableCardTitle}>
                                {tpl.name}
                              </span>
                              <span className={styles.reusableBadge}>
                                <Bookmark size={11} />{" "}
                                {usageCount === 1
                                  ? "En 1 plato"
                                  : `En ${usageCount} platos`}
                              </span>
                            </div>
                            <span className={styles.reusableCardMeta}>
                              {tpl.isRequired ? "Obligatorio" : "Opcional"} ·
                              Mín: {tpl.minSelections} · Máx:{" "}
                              {tpl.maxSelections} · {tpl.options.length}{" "}
                              {tpl.options.length === 1 ? "opción" : "opciones"}
                            </span>
                          </div>

                          <div className={styles.reusableListActions}>
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => startEditGroup(tpl)}
                            >
                              <Pencil size={14} /> Editar
                            </Button>
                            {!tpl.id.startsWith("derived-") && (
                              <button
                                type="button"
                                className={styles.iconBtnDanger}
                                onClick={() => handleDelete(tpl)}
                                disabled={deletingId === tpl.id}
                                title="Eliminar de la biblioteca"
                              >
                                {deletingId === tpl.id ? (
                                  <Loader2 size={15} className={styles.spin} />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className={styles.reusableOptionsGrid}>
                          {tpl.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={styles.reusableOptionPill}
                            >
                              <span className={styles.reusableOptionPillName}>
                                {opt.name}
                              </span>
                              <span className={styles.reusableOptionPillPrice}>
                                {opt.priceExtra > 0
                                  ? formatCOPInput(opt.priceExtra, "+ $ ")
                                  : "Gratis"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.modifiersSection}>
              <div className={styles.reusableSyncBanner}>
                <Bookmark size={15} />
                <span>
                  Los cambios realizados en este grupo se reflejarán
                  automáticamente en todos los platos que lo tengan asignado.
                </span>
              </div>

              <div className={styles.groupCard}>
                <div className={styles.groupHeader}>
                  <div className={styles.field}>
                    <label>Nombre del Grupo *</label>
                    <Input
                      value={editingGroup.name}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          name: e.target.value,
                        })
                      }
                      placeholder="Ej. Bebidas, Salsas, Elige tu acompañamiento"
                      disabled={isSaving}
                    />
                  </div>

                  <div className={styles.groupSettingsRow}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={editingGroup.isRequired}
                        onChange={(e) =>
                          setEditingGroup({
                            ...editingGroup,
                            isRequired: e.target.checked,
                            minSelections:
                              e.target.checked &&
                              editingGroup.minSelections === 0
                                ? 1
                                : editingGroup.minSelections,
                          })
                        }
                        disabled={isSaving}
                      />
                      Obligatorio
                    </label>
                    <label className={styles.numberLabel}>
                      Mín
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={
                          editingGroup.minSelections === 0
                            ? ""
                            : String(editingGroup.minSelections)
                        }
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          const d = e.target.value.replace(/\D/g, "");
                          setEditingGroup({
                            ...editingGroup,
                            minSelections: d ? parseInt(d, 10) : 0,
                          });
                        }}
                        style={{ width: "64px" }}
                        disabled={isSaving}
                      />
                    </label>
                    <label className={styles.numberLabel}>
                      Máx
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="1"
                        value={String(editingGroup.maxSelections)}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          const d = e.target.value.replace(/\D/g, "");
                          setEditingGroup({
                            ...editingGroup,
                            maxSelections: d ? parseInt(d, 10) : 1,
                          });
                        }}
                        style={{ width: "64px" }}
                        disabled={isSaving}
                      />
                    </label>
                  </div>
                </div>

                <div className={styles.optionsList}>
                  {editingGroup.options.map((opt, idx) => (
                    <div key={opt.id} className={styles.optionRow}>
                      <Input
                        value={opt.name}
                        onChange={(e) =>
                          setEditingGroup({
                            ...editingGroup,
                            options: editingGroup.options.map((o) =>
                              o.id === opt.id
                                ? { ...o, name: e.target.value }
                                : o
                            ),
                          })
                        }
                        placeholder={`Opción ${idx + 1} (Ej. Coca-Cola 400ml)`}
                        style={{ flex: 1 }}
                        disabled={isSaving}
                      />
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatCOPInput(opt.priceExtra, "+ $ ")}
                        onChange={(e) =>
                          setEditingGroup({
                            ...editingGroup,
                            options: editingGroup.options.map((o) =>
                              o.id === opt.id
                                ? {
                                    ...o,
                                    priceExtra: parseCOPInput(e.target.value),
                                  }
                                : o
                            ),
                          })
                        }
                        placeholder="+ $ 0 (Gratis)"
                        style={{ width: "145px" }}
                        disabled={isSaving}
                      />
                      <button
                        type="button"
                        className={styles.iconBtnDanger}
                        onClick={() =>
                          setEditingGroup({
                            ...editingGroup,
                            options: editingGroup.options.filter(
                              (o) => o.id !== opt.id
                            ),
                          })
                        }
                        disabled={isSaving}
                        title="Eliminar opción"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.addOptionLink}
                    onClick={() =>
                      setEditingGroup({
                        ...editingGroup,
                        options: [
                          ...editingGroup.options,
                          {
                            id: `temp-ropt-${Date.now()}-${Math.random()
                              .toString(36)
                              .slice(2, 5)}`,
                            name: "",
                            priceExtra: 0,
                            isAvailable: true,
                          },
                        ],
                      })
                    }
                    disabled={isSaving}
                  >
                    <Plus size={14} /> Añadir opción
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {editingGroup ? (
            <>
              <Button
                variant="outline"
                onClick={() => setEditingGroup(null)}
                disabled={isSaving}
                type="button"
              >
                <ArrowLeft size={15} /> Volver
              </Button>
              <Button onClick={handleSave} disabled={isSaving} type="button">
                {isSaving ? (
                  <Loader2 size={16} className={styles.spin} />
                ) : (
                  <Check size={16} />
                )}{" "}
                Guardar y Actualizar Platos
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose} type="button">
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
