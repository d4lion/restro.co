"use client";

import React, { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Settings
} from "lucide-react";
import {
  toggleAvailabilityAction,
  addCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  addItemAction,
  updateItemAction,
  deleteItemAction,
} from "@/app/actions/menu";
import { uploadImageAction } from "@/app/actions/storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "@/app/(dashboard)/menu/page.module.css";

import { ItemFormModal, ItemFormData } from "./ItemFormModal";
import { ManageCategoriesModal } from "./ManageCategoriesModal";

export interface ModifierOptionData {
  id: string;
  name: string;
  priceExtra: number;
  isAvailable: boolean;
}

export interface ModifierGroupData {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
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
    categories: CategoryData[];
  } | null;
}

export function MenuPageClient({ initialMenu }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  
  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
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

  const categories = initialMenu?.categories || [];

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
          <h1 className={styles.title}>Digital Menu Management</h1>
          <p className={styles.subtitle}>Current Menu: Principal (Active)</p>
        </div>
      </div>

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
        </div>

        <Button onClick={() => setItemFormState({ isOpen: true })}>
          <Plus size={16} /> Agregar Plato
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
                        onClick={() => setItemFormState({ isOpen: true, data: { ...item, description: item.description || "", imageUrl: item.imageUrl || "", modifierGroups: item.modifierGroups || [] } })}
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
          initialData={itemFormState.data}
          onSave={handleSaveItem}
          onUploadImage={handleUploadImage}
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
    </div>
  );
}
