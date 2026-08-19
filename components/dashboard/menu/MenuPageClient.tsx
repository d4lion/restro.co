"use client";

import React, { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { Plus, ChevronDown, ChevronUp, Loader2, Check, X } from "lucide-react";
import {
  toggleAvailabilityAction,
  addCategoryAction,
  addItemAction,
} from "@/app/actions/menu";
import styles from "@/app/(dashboard)/menu/page.module.css";

/* ── Types ─────────────────────────────────────────────────── */
interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

interface CategoryData {
  id: string;
  name: string;
  items: MenuItemData[];
}

interface MenuData {
  id: string;
  categories: CategoryData[];
}

interface Props {
  menu: MenuData | null;
}

/* ── Helpers ────────────────────────────────────────────────── */
const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

/* ── Main component ─────────────────────────────────────────── */
export function MenuPageClient({ menu: initialMenu }: Props) {
  // Local optimistic state for availability toggles
  const [itemAvailability, setItemAvailability] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialMenu?.categories.forEach((cat) =>
      cat.items.forEach((item) => (map[item.id] = item.isAvailable))
    );
    return map;
  });

  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Category form
  const [categoryName, setCategoryName] = useState("");
  const [isPendingCat, startCatTransition] = useTransition();
  const catInputRef = useRef<HTMLInputElement>(null);

  // Item form per category
  const [itemForms, setItemForms] = useState<Record<string, {
    name: string; price: string; description: string; imageUrl: string;
  }>>({});
  const [pendingItems, setPendingItems] = useState<Record<string, boolean>>({});

  /* ── Toggle availability ──────────────────────────────────── */
  async function handleToggle(itemId: string) {
    if (pendingToggles[itemId]) return;
    // Optimistic update
    setItemAvailability((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    setPendingToggles((prev) => ({ ...prev, [itemId]: true }));

    const result = await toggleAvailabilityAction(itemId);

    setPendingToggles((prev) => ({ ...prev, [itemId]: false }));
    if (result.success) {
      toast.success(result.message, { duration: 2000 });
    } else {
      // Revert
      setItemAvailability((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
      toast.error(result.message);
    }
  }

  /* ── Add category ─────────────────────────────────────────── */
  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) return;
    startCatTransition(async () => {
      const result = await addCategoryAction(categoryName.trim());
      if (result.success) {
        toast.success(result.message);
        setCategoryName("");
        catInputRef.current?.focus();
      } else {
        toast.error(result.message);
      }
    });
  }

  /* ── Add item ─────────────────────────────────────────────── */
  async function handleAddItem(categoryId: string) {
    const form = itemForms[categoryId];
    if (!form?.name || !form?.price) {
      toast.error("Nombre y precio son obligatorios");
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      toast.error("El precio debe ser un número válido mayor a 0");
      return;
    }

    setPendingItems((prev) => ({ ...prev, [categoryId]: true }));
    const result = await addItemAction({
      categoryId,
      name: form.name.trim(),
      price,
      description: form.description?.trim() || undefined,
      imageUrl: form.imageUrl?.trim() || undefined,
    });
    setPendingItems((prev) => ({ ...prev, [categoryId]: false }));

    if (result.success) {
      toast.success(result.message);
      // Reset form
      setItemForms((prev) => ({
        ...prev,
        [categoryId]: { name: "", price: "", description: "", imageUrl: "" },
      }));
      setExpandedCategories((prev) => ({ ...prev, [categoryId]: false }));
    } else {
      toast.error(result.message);
    }
  }

  function getItemForm(categoryId: string) {
    return itemForms[categoryId] ?? { name: "", price: "", description: "", imageUrl: "" };
  }

  function updateItemForm(categoryId: string, field: string, value: string) {
    setItemForms((prev) => ({
      ...prev,
      [categoryId]: { ...getItemForm(categoryId), [field]: value },
    }));
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestión de Carta Digital</h1>
          <p className={styles.subtitle}>
            Organiza tus categorías, administra precios e imágenes y controla la disponibilidad instantánea.
          </p>
        </div>
      </div>

      {/* ── Add Category Form ─────────────────────────────── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Nueva Categoría</h2>
        <form onSubmit={handleAddCategory} className={styles.inlineForm}>
          <input
            ref={catInputRef}
            className={styles.inputField}
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Nombre de categoría (ej. Entradas, Fuertes, Bebidas)"
            required
            disabled={isPendingCat}
          />
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isPendingCat || !categoryName.trim()}
          >
            {isPendingCat ? (
              <><Loader2 size={14} className={styles.spin} /> Creando…</>
            ) : (
              <><Plus size={14} /> Crear Categoría</>
            )}
          </button>
        </form>
      </div>

      {/* ── Categories list ─────────────────────────────────── */}
      {!initialMenu || initialMenu.categories.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Tu carta aún no tiene productos</p>
          <p className={styles.emptySub}>
            Crea tu primera categoría arriba para empezar a estructurar tu menú.
          </p>
        </div>
      ) : (
        <div className={styles.categoriesList}>
          {initialMenu.categories.map((category) => {
            const isExpanded = expandedCategories[category.id];
            const form = getItemForm(category.id);
            const isAddingItem = pendingItems[category.id];

            return (
              <div key={category.id} className={styles.categoryCard}>
                {/* Category header */}
                <div className={styles.categoryHeader}>
                  <h3 className={styles.categoryName}>
                    {category.name}
                    <span className={styles.itemCount}>
                      ({category.items.length} platos)
                    </span>
                  </h3>
                </div>

                {/* Items */}
                <div className={styles.itemsGrid}>
                  {category.items.map((item) => {
                    const available = itemAvailability[item.id] ?? item.isAvailable;
                    const toggling = pendingToggles[item.id];

                    return (
                      <div
                        key={item.id}
                        className={`${styles.itemRow} ${!available ? styles["itemRow--disabled"] : ""}`}
                      >
                        <div className={styles.itemMain}>
                          <div className={styles.itemThumb}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} />
                            ) : (
                              <span>Plato</span>
                            )}
                          </div>
                          <div>
                            <strong className={styles.itemName}>{item.name}</strong>
                            {item.description && (
                              <p className={styles.itemDesc}>{item.description}</p>
                            )}
                            <span className={styles.itemPrice}>
                              {formatCOP(item.price)}
                            </span>
                          </div>
                        </div>

                        <div className={styles.itemActions}>
                          <button
                            type="button"
                            disabled={toggling}
                            onClick={() => handleToggle(item.id)}
                            className={`${styles.toggleBtn} ${
                              available
                                ? styles["toggleBtn--on"]
                                : styles["toggleBtn--off"]
                            }`}
                          >
                            {toggling ? (
                              <Loader2 size={12} className={styles.spin} />
                            ) : available ? (
                              <><Check size={12} /> DISPONIBLE</>
                            ) : (
                              <><X size={12} /> AGOTADO</>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add item accordion */}
                <div className={styles.addItemDetails}>
                  <button
                    type="button"
                    className={styles.addItemSummary}
                    onClick={() =>
                      setExpandedCategories((prev) => ({
                        ...prev,
                        [category.id]: !prev[category.id],
                      }))
                    }
                  >
                    <Plus size={14} />
                    Agregar plato a {category.name}
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && (
                    <div className={styles.addItemForm}>
                      <input
                        className={styles.inputField}
                        placeholder="Nombre del plato *"
                        value={form.name}
                        onChange={(e) =>
                          updateItemForm(category.id, "name", e.target.value)
                        }
                        required
                      />
                      <input
                        className={styles.inputField}
                        type="number"
                        placeholder="Precio COP *"
                        value={form.price}
                        onChange={(e) =>
                          updateItemForm(category.id, "price", e.target.value)
                        }
                        min="0"
                        required
                      />
                      <input
                        className={styles.inputField}
                        placeholder="URL Imagen (opcional)"
                        value={form.imageUrl}
                        onChange={(e) =>
                          updateItemForm(category.id, "imageUrl", e.target.value)
                        }
                      />
                      <textarea
                        className={`${styles.inputField} ${styles.textarea}`}
                        placeholder="Descripción de ingredientes / sabor"
                        value={form.description}
                        onChange={(e) =>
                          updateItemForm(category.id, "description", e.target.value)
                        }
                      />
                      <div className={styles.formActions}>
                        <button
                          type="button"
                          className={styles.btnCancel}
                          onClick={() =>
                            setExpandedCategories((prev) => ({
                              ...prev,
                              [category.id]: false,
                            }))
                          }
                          disabled={isAddingItem}
                        >
                          <X size={13} /> Cancelar
                        </button>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          disabled={isAddingItem || !form.name || !form.price}
                          onClick={() => handleAddItem(category.id)}
                        >
                          {isAddingItem ? (
                            <><Loader2 size={13} className={styles.spin} /> Guardando…</>
                          ) : (
                            <><Check size={13} /> Guardar Plato</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
