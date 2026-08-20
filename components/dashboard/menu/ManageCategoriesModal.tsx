import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pencil, Trash2, X, Plus, Loader2 } from "lucide-react";
import styles from "./ManageCategoriesModal.module.css";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onAddCategory: (name: string) => Promise<{ success: boolean; message?: string }>;
  onUpdateCategory: (id: string, name: string) => Promise<{ success: boolean; message?: string }>;
  onDeleteCategory: (id: string) => Promise<{ success: boolean; message?: string }>;
}

export function ManageCategoriesModal({
  isOpen,
  categories,
  onClose,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: Props) {
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    startTransition(async () => {
      const res = await onAddCategory(newCatName);
      if (res.success) {
        toast.success(res.message);
        setNewCatName("");
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    startTransition(async () => {
      const res = await onUpdateCategory(id, editName);
      if (res.success) {
        toast.success(res.message);
        setEditingId(null);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta categoría y todos sus platos?")) return;
    startTransition(async () => {
      const res = await onDeleteCategory(id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Categorías">
      <div className={styles.container}>
        <div className={styles.addSection}>
          <Input
            placeholder="Nueva categoría..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            disabled={isPending}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={isPending || !newCatName.trim()}>
            {isPending ? <Loader2 size={16} className={styles.spin} /> : <Plus size={16} />}
            Agregar
          </Button>
        </div>

        <div className={styles.list}>
          {categories.length === 0 ? (
            <p className={styles.empty}>No hay categorías creadas.</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className={styles.row}>
                {editingId === cat.id ? (
                  <div className={styles.editMode}>
                    <Input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={isPending}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(cat.id)}
                    />
                    <div className={styles.actions}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => handleUpdate(cat.id)}
                        disabled={isPending}
                        title="Guardar"
                      >
                        <Pencil size={16} color="#10b981" />
                      </button>
                      <button
                        className={styles.iconBtn}
                        onClick={() => setEditingId(null)}
                        disabled={isPending}
                        title="Cancelar"
                      >
                        <X size={16} color="#64748b" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.viewMode}>
                    <span className={styles.name}>{cat.name}</span>
                    <div className={styles.actions}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                        }}
                        disabled={isPending}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className={styles.iconBtn}
                        onClick={() => handleDelete(cat.id)}
                        disabled={isPending}
                        title="Eliminar"
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
