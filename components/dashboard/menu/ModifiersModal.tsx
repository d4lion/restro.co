"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import styles from "./ModifiersModal.module.css";
import {
  createModifierGroupAction,
  updateModifierGroupAction,
  deleteModifierGroupAction,
  createModifierOptionAction,
  updateModifierOptionAction,
  deleteModifierOptionAction,
} from "@/app/actions/menu";
import type { ModifierGroupData, ModifierOptionData } from "./MenuPageClient";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  menuItemId: string;
  itemName: string;
  groups: ModifierGroupData[];
}

export function ModifiersModal({ isOpen, onClose, menuItemId, itemName, groups }: Props) {
  const [isPending, startTransition] = useTransition();

  // New Group State
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMin, setNewGroupMin] = useState(0);
  const [newGroupMax, setNewGroupMax] = useState(1);
  const [newGroupRequired, setNewGroupRequired] = useState(false);

  // New Option State (keyed by groupId)
  const [addingOptionToGroup, setAddingOptionToGroup] = useState<string | null>(null);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("0");

  function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    startTransition(async () => {
      const res = await createModifierGroupAction({
        menuItemId,
        name: newGroupName.trim(),
        isRequired: newGroupRequired,
        minSelections: newGroupMin,
        maxSelections: newGroupMax,
      });
      if (res.success) {
        toast.success(res.message);
        setIsAddingGroup(false);
        setNewGroupName("");
        setNewGroupMin(0);
        setNewGroupMax(1);
        setNewGroupRequired(false);
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleDeleteGroup(groupId: string) {
    if (!confirm("¿Eliminar este grupo y todas sus opciones?")) return;
    startTransition(async () => {
      const res = await deleteModifierGroupAction(groupId);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  function handleCreateOption(e: React.FormEvent, groupId: string) {
    e.preventDefault();
    if (!newOptionName.trim()) return;

    startTransition(async () => {
      const res = await createModifierOptionAction({
        groupId,
        name: newOptionName.trim(),
        priceExtra: parseFloat(newOptionPrice) || 0,
      });
      if (res.success) {
        toast.success(res.message);
        setAddingOptionToGroup(null);
        setNewOptionName("");
        setNewOptionPrice("0");
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleDeleteOption(optionId: string) {
    if (!confirm("¿Eliminar esta opción?")) return;
    startTransition(async () => {
      const res = await deleteModifierOptionAction(optionId);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Modificadores: ${itemName}`} size="lg">
      <div className={styles.container}>
        <p className={styles.hint}>
          Crea grupos de opciones (ej: "Elige tu bebida", "Extras") y agrega opciones a cada uno.
        </p>

        <div className={styles.groupsList}>
          {groups.map((group) => (
            <div key={group.id} className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <div>
                  <h4 className={styles.groupTitle}>{group.name}</h4>
                  <div className={styles.groupMeta}>
                    <span>{group.isRequired ? "Obligatorio" : "Opcional"}</span>
                    <span>•</span>
                    <span>Min: {group.minSelections}</span>
                    <span>•</span>
                    <span>Max: {group.maxSelections}</span>
                  </div>
                </div>
                <div className={styles.groupActions}>
                  <button
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={() => handleDeleteGroup(group.id)}
                    disabled={isPending}
                    title="Eliminar grupo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.optionsList}>
                {group.options.length === 0 && (
                  <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0" }}>Sin opciones aún.</p>
                )}
                {group.options.map((opt) => (
                  <div key={opt.id} className={styles.optionRow}>
                    <span className={styles.optionName}>{opt.name}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className={styles.optionPrice}>
                        +{new Intl.NumberFormat("es-CO").format(opt.priceExtra)}
                      </span>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => handleDeleteOption(opt.id)}
                        disabled={isPending}
                        title="Eliminar opción"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {addingOptionToGroup === group.id ? (
                  <form onSubmit={(e) => handleCreateOption(e, group.id)} className={styles.inlineForm}>
                    <div className={styles.formRow}>
                      <input
                        placeholder="Nombre (ej. Queso Extra)"
                        value={newOptionName}
                        onChange={(e) => setNewOptionName(e.target.value)}
                        required
                        style={{ padding: 8, border: "1px solid #CBD5E1", borderRadius: 4 }}
                      />
                      <input
                        type="number"
                        placeholder="Precio Extra (COP)"
                        value={newOptionPrice}
                        onChange={(e) => setNewOptionPrice(e.target.value)}
                        min="0"
                        style={{ padding: 8, border: "1px solid #CBD5E1", borderRadius: 4 }}
                      />
                    </div>
                    <div className={styles.formActions}>
                      <button type="button" className={styles.btnSecondary} onClick={() => setAddingOptionToGroup(null)}>
                        Cancelar
                      </button>
                      <button type="submit" className={styles.btnPrimary} disabled={isPending || !newOptionName}>
                        {isPending ? <Loader2 size={14} className={styles.spin} /> : <Check size={14} />} Guardar Opción
                      </button>
                    </div>
                  </form>
                ) : (
                  <button className={styles.addOptionBtn} onClick={() => setAddingOptionToGroup(group.id)}>
                    <Plus size={14} /> Agregar Opción
                  </button>
                )}
              </div>
            </div>
          ))}

          {isAddingGroup ? (
            <form onSubmit={handleCreateGroup} className={styles.inlineForm} style={{ background: "white", padding: 16 }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 15 }}>Nuevo Grupo</h4>
              <div className={styles.formRow} style={{ gridTemplateColumns: "1fr" }}>
                <input
                  placeholder="Nombre del Grupo (ej. Tipo de carne)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  style={{ padding: 8, border: "1px solid #CBD5E1", borderRadius: 4 }}
                />
              </div>
              <div className={styles.formRow} style={{ gridTemplateColumns: "1fr 1fr 1fr", marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <input type="checkbox" checked={newGroupRequired} onChange={(e) => setNewGroupRequired(e.target.checked)} />
                  Es Obligatorio
                </label>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#64748B", marginBottom: 2 }}>Selección Min</label>
                  <input type="number" value={newGroupMin} onChange={(e) => setNewGroupMin(parseInt(e.target.value) || 0)} min="0" style={{ padding: "4px 8px", width: "100%", border: "1px solid #CBD5E1", borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#64748B", marginBottom: 2 }}>Selección Max</label>
                  <input type="number" value={newGroupMax} onChange={(e) => setNewGroupMax(parseInt(e.target.value) || 1)} min="1" style={{ padding: "4px 8px", width: "100%", border: "1px solid #CBD5E1", borderRadius: 4 }} />
                </div>
              </div>
              <div className={styles.formActions} style={{ marginTop: 12 }}>
                <button type="button" className={styles.btnSecondary} onClick={() => setIsAddingGroup(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isPending || !newGroupName}>
                  {isPending ? <Loader2 size={14} className={styles.spin} /> : <Check size={14} />} Crear Grupo
                </button>
              </div>
            </form>
          ) : (
            <button className={styles.addGroupBtn} onClick={() => setIsAddingGroup(true)}>
              <Plus size={16} /> Crear Nuevo Grupo de Modificadores
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
