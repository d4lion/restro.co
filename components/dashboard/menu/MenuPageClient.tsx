"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Settings,
  Lock,
  ArrowUpRight,
  Bookmark,
} from "lucide-react";
import {
  toggleAvailabilityAction,
  addCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  addItemAction,
  updateItemAction,
  deleteItemAction,
  saveReusableModifierGroupAction,
  deleteReusableModifierGroupAction,
} from "@/app/actions/menu";
import { uploadImageAction } from "@/app/actions/storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { PlanKey } from "@/lib/types";
import styles from "@/app/(dashboard)/menu/page.module.css";

import { ItemFormModal, ItemFormData } from "./ItemFormModal";
import { ManageCategoriesModal } from "./ManageCategoriesModal";
import { ManageReusableGroupsModal } from "./ManageReusableGroupsModal";

export interface ModifierOptionData {
  id: string;
  name: string;
  priceExtra: number;
  isAvailable: boolean;
}

export interface ModifierGroupData {
  id: string;
  name: string;
  previousName?: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  saveAsReusable?: boolean;
  options: ModifierOptionData[];
}

interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  modifierGroups?: ModifierGroupData[];
}

interface CategoryData {
  id: string;
  name: string;
  items: MenuItemData[];
}

interface Props {
  initialMenu: {
    id: string;
    tenantId: string;
    reusableModifierGroups?: ModifierGroupData[];
    categories: CategoryData[];
  } | null;
  plan?: PlanKey;
  planLabel?: string;
  maxMenuItems?: number | null;
}

export function MenuPageClient({
  initialMenu,
  plan = "STARTER",
  planLabel = "Starter",
  maxMenuItems = null,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  
  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isReusableModalOpen, setIsReusableModalOpen] = useState(false);
  const [itemFormState, setItemFormState] = useState<{ isOpen: boolean; data?: ItemFormData }>({ isOpen: false });
  
  const [isPending, startTransition] = useTransition();

  // Extract a flat list of all items, attaching category details to each
  const allItems = useMemo(() => {
    if (!initialMenu) return [];
    const flatItems: (MenuItemData & { categoryId: string; categoryName: string })[] = [];
    initialMenu.categories.forEach(cat => {
      cat.items.forEach(item => {
        flatItems.push({ ...item, categoryId: cat.id, categoryName: cat.name });
      });
    });
    return flatItems;
  }, [initialMenu]);

  // Combine saved reusable modifier groups with any unique modifier groups already created on dishes
  const reusableGroups = useMemo(() => {
    const map = new Map<string, ModifierGroupData>();
    (initialMenu?.reusableModifierGroups ?? []).forEach((g) => {
      const key = g.name.trim().toLowerCase();
      if (key) map.set(key, g);
    });
    allItems.forEach((item) => {
      (item.modifierGroups ?? []).forEach((g) => {
        const key = g.name.trim().toLowerCase();
        if (key && !map.has(key) && g.options.length > 0) {
          map.set(key, {
            ...g,
            id: `derived-${g.id}`,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [initialMenu, allItems]);

  const usageCountByGroupName = useMemo(() => {
    const counts: Record<string, number> = {};
    allItems.forEach((item) => {
      (item.modifierGroups ?? []).forEach((g) => {
        const key = g.name.trim().toLowerCase();
        if (key) {
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });
    return counts;
  }, [allItems]);

  const categories = initialMenu?.categories || [];

  const hasItemLimit = typeof maxMenuItems === "number" && maxMenuItems > 0;
  const currentItemsCount = allItems.length;
  const isAtItemLimit = hasItemLimit && currentItemsCount >= maxMenuItems;
  const isNearItemLimit = hasItemLimit && !isAtItemLimit && currentItemsCount >= maxMenuItems - 1;
  const remainingItems = hasItemLimit ? Math.max(0, maxMenuItems - currentItemsCount) : null;
  const quotaPercentage = hasItemLimit ? Math.min(100, Math.round((currentItemsCount / maxMenuItems) * 100)) : 0;

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryFilter === "All" || item.categoryId === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allItems, searchQuery, selectedCategoryFilter]);

  const formatCOP = (price: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(price);

  // --- Actions ---

  const handleToggleAvailability = (itemId: string) => {
    startTransition(async () => {
      const res = await toggleAvailabilityAction(itemId);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este plato?")) return;
    startTransition(async () => {
      const res = await deleteItemAction(itemId);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleSaveItem = async (data: ItemFormData) => {
    if (!initialMenu) return { success: false, message: "No hay menú activo" };

    if (data.id) {
      // Update
      const res = await updateItemAction({
        itemId: data.id,
        categoryId: data.categoryId,
        name: data.name,
        price: data.price,
        description: data.description,
        imageUrl: data.imageUrl,
        modifierGroups: data.modifierGroups,
      });
      return res;
    } else {
      // Create
      const res = await addItemAction({
        categoryId: data.categoryId,
        name: data.name,
        price: data.price,
        description: data.description,
        imageUrl: data.imageUrl,
        modifierGroups: data.modifierGroups,
      });
      return res;
    }
  };

  const handleAddCategory = async (name: string) => {
    if (!initialMenu) return { success: false, message: "Menú no encontrado" };
    return addCategoryAction(name);
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    return updateCategoryAction(id, name);
  };

  const handleDeleteCategory = async (id: string) => {
    return deleteCategoryAction(id);
  };

  const handleUploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await uploadImageAction(formData, "menu-items");
    if (res.error) return { success: false, message: res.error };
    return { success: true, url: res.publicUrl };
  };

  if (!initialMenu) {
    return (
      <div className={styles.emptyState}>
        <p>Aún no has creado un menú para este restaurante.</p>
        <Button>Crear Primer Menú</Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestión de Carta Digital</h1>
          <p className={styles.subtitle}>Administra las categorías, platos, fotos y precios de tu carta pública.</p>
        </div>
      </div>

      {/* Quota Banner — ONLY rendered when the current plan has a finite product limit (e.g. Starter = 5) */}
      {hasItemLimit && (
        <div
          className={`${styles.quotaBanner} ${
            isAtItemLimit
              ? styles.quotaBannerFull
              : isNearItemLimit
              ? styles.quotaBannerWarning
              : ""
          }`}
        >
          <div className={styles.quotaContent}>
            <div className={styles.quotaTopRow}>
              <span className={styles.quotaTitle}>
                Límite de productos del Plan {planLabel}
              </span>
              <span
                className={`${styles.quotaPill} ${
                  isAtItemLimit ? styles.quotaPillFull : ""
                }`}
              >
                {currentItemsCount} / {maxMenuItems} productos
              </span>
            </div>

            <div className={styles.quotaBarTrack}>
              <div
                className={`${styles.quotaBarFill} ${
                  isAtItemLimit
                    ? styles.quotaBarFillFull
                    : isNearItemLimit
                    ? styles.quotaBarFillWarning
                    : ""
                }`}
                style={{ width: `${quotaPercentage}%` }}
              />
            </div>

            <p className={styles.quotaSubtext}>
              {isAtItemLimit ? (
                <>
                  Has alcanzado el máximo de <strong>{maxMenuItems} productos</strong> permitidos en el plan{" "}
                  <strong>{planLabel}</strong>. Mejora al plan <strong>Carta Digital ($9.900/mes)</strong> para agregar productos ilimitados.
                </>
              ) : (
                <>
                  Tu plan <strong>{planLabel}</strong> permite hasta <strong>{maxMenuItems} productos</strong> en tu carta digital (te{" "}
                  {remainingItems === 1 ? "queda 1 cupo disponible" : `quedan ${remainingItems} cupos disponibles`}).
                </>
              )}
            </p>
          </div>

          <Link href="/settings#planes" className={styles.quotaUpgradeLink}>
            Desbloquear ilimitados ($9.900/mes) <ArrowUpRight size={15} />
          </Link>
        </div>
      )}

      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <Search size={18} color="#94a3b8" />
          <Input 
            placeholder="Buscar platos..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.categoryChips}>
          <button 
            className={`${styles.chip} ${selectedCategoryFilter === "All" ? styles.chipActive : ""}`}
            onClick={() => setSelectedCategoryFilter("All")}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`${styles.chip} ${selectedCategoryFilter === cat.id ? styles.chipActive : ""}`}
              onClick={() => setSelectedCategoryFilter(cat.id)}
            >
              {cat.name}
            </button>
          ))}
          <button 
            className={styles.manageCatsBtn} 
            onClick={() => setIsCategoryModalOpen(true)}
            title="Gestionar Categorías"
          >
            <Settings size={14} /> Categorías
          </button>
          <button 
            className={styles.manageCatsBtn} 
            onClick={() => setIsReusableModalOpen(true)}
            title="Gestionar Acompañantes Reutilizables"
          >
            <Bookmark size={14} /> Acompañantes ({reusableGroups.length})
          </button>
        </div>

        <Button
          onClick={() => {
            if (isAtItemLimit) {
              toast.error(
                `Has alcanzado el límite de ${maxMenuItems} productos del plan ${planLabel}. Mejora a Carta Digital ($9.900/mes) para productos ilimitados.`
              );
              return;
            }
            setItemFormState({ isOpen: true });
          }}
          disabled={isAtItemLimit}
          title={
            isAtItemLimit
              ? `Límite de ${maxMenuItems} productos alcanzado en el plan ${planLabel}`
              : "Agregar un nuevo plato a la carta"
          }
        >
          {isAtItemLimit ? (
            <>
              <Lock size={16} /> Límite alcanzado ({currentItemsCount}/{maxMenuItems})
            </>
          ) : (
            <>
              <Plus size={16} /> Agregar Plato
              {hasItemLimit ? ` (${currentItemsCount}/${maxMenuItems})` : ""}
            </>
          )}
        </Button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Plato</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyTable}>No se encontraron platos.</td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.itemInfo}>
                      {item.imageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt={item.name} className={styles.itemImage} />
                        </>
                      ) : (
                        <div className={styles.itemImagePlaceholder}>Plato</div>
                      )}
                      <div className={styles.itemTexts}>
                        <span className={styles.itemName}>{item.name}</span>
                        {item.modifierGroups && item.modifierGroups.length > 0 && (
                          <span className={styles.itemModsCount}>{item.modifierGroups.length} acompañantes config.</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.catBadge}>{item.categoryName}</span>
                  </td>
                  <td className={styles.itemPrice}>{formatCOP(item.price)}</td>
                  <td>
                    <label className={styles.toggleSwitch}>
                      <input 
                        type="checkbox" 
                        checked={item.isAvailable} 
                        onChange={() => handleToggleAvailability(item.id)}
                        disabled={isPending}
                      />
                      <span className={styles.slider}></span>
                      <span className={styles.statusLabel}>{item.isAvailable ? "Activo" : "Agotado"}</span>
                    </label>
                  </td>
                  <td>
                    <div className={styles.actionsBox}>
                      <button 
                        className={styles.actionBtn} 
                        onClick={() =>
                          setItemFormState({
                            isOpen: true,
                            data: {
                              ...item,
                              description: item.description || "",
                              imageUrl: item.imageUrl || "",
                              modifierGroups: (item.modifierGroups || []).map((g) => {
                                const isReusable = reusableGroups.some(
                                  (r) =>
                                    !r.id.startsWith("derived-") &&
                                    r.name.trim().toLowerCase() ===
                                      g.name.trim().toLowerCase()
                                );
                                return {
                                  ...g,
                                  previousName: g.name,
                                  saveAsReusable:
                                    isReusable || Boolean(g.saveAsReusable),
                                };
                              }),
                            },
                          })
                        }
                        title="Editar"
                      >
                        <Pencil size={16} /> Editar
                      </button>
                      <button 
                        className={styles.actionBtnDanger} 
                        onClick={() => handleDeleteItem(item.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {itemFormState.isOpen && (
        <ItemFormModal
          isOpen={true}
          onClose={() => setItemFormState({ isOpen: false })}
          categories={categories}
          reusableGroups={reusableGroups}
          initialData={itemFormState.data}
          onSave={handleSaveItem}
          onSaveReusableGroup={(group) => saveReusableModifierGroupAction(group)}
          onDeleteReusableGroup={(groupId) => deleteReusableModifierGroupAction(groupId)}
          onUploadImage={handleUploadImage}
          quotaNotice={
            hasItemLimit
              ? `Cupo del Plan ${planLabel}: Estás creando el producto #${currentItemsCount + 1} de ${maxMenuItems} permitidos.`
              : null
          }
        />
      )}

      {isCategoryModalOpen && (
        <ManageCategoriesModal
          isOpen={true}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {isReusableModalOpen && (
        <ManageReusableGroupsModal
          isOpen={true}
          onClose={() => setIsReusableModalOpen(false)}
          reusableGroups={reusableGroups}
          usageCountByGroupName={usageCountByGroupName}
          onSaveReusableGroup={(group) => saveReusableModifierGroupAction(group)}
          onDeleteReusableGroup={(groupId) => deleteReusableModifierGroupAction(groupId)}
        />
      )}
    </div>
  );
}
