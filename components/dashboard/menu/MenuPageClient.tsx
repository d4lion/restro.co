"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  X,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  ExternalLink,
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
import { uploadImageAction, deleteImageAction } from "@/app/actions/storage";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

/* ── Main component ─────────────────────────────────────────── */
export function MenuPageClient({ menu: initialMenu }: Props) {
  // Availability state map
  const [itemAvailability, setItemAvailability] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialMenu?.categories.forEach((cat) =>
      cat.items.forEach((item) => (map[item.id] = item.isAvailable))
    );
    return map;
  });

  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // 3-dots active dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.menuWrapper}`)) {
        setActiveDropdown(null);
      }
    }
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Category creation form
  const [categoryName, setCategoryName] = useState("");
  const [isPendingCat, startCatTransition] = useTransition();
  const catInputRef = useRef<HTMLInputElement>(null);

  // Item form per category (for adding new items)
  const [itemForms, setItemForms] = useState<Record<string, {
    name: string; price: string; description: string; imageUrl: string;
  }>>({});
  const [pendingItems, setPendingItems] = useState<Record<string, boolean>>({});
  const [uploadingItemImage, setUploadingItemImage] = useState<Record<string, boolean>>({});

  /* ── MODALS STATE ─────────────────────────────────────────── */
  // Category Edit Modal
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Category Delete Confirmation Modal
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Item Edit Modal
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);
  const [editItemForm, setEditItemForm] = useState<{
    name: string; price: string; description: string; imageUrl: string; isAvailable: boolean;
  }>({ name: "", price: "", description: "", imageUrl: "", isAvailable: true });
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Item Delete Confirmation Modal
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string; imageUrl?: string | null } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  /* ── HANDLERS ─────────────────────────────────────────────── */

  // Toggle availability
  async function handleToggle(itemId: string) {
    if (pendingToggles[itemId]) return;
    setItemAvailability((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    setPendingToggles((prev) => ({ ...prev, [itemId]: true }));

    const result = await toggleAvailabilityAction(itemId);

    setPendingToggles((prev) => ({ ...prev, [itemId]: false }));
    if (result.success) {
      toast.success(result.message, { duration: 2000 });
    } else {
      setItemAvailability((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
      toast.error(result.message);
    }
  }

  // Create Category
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

  // Save Edit Category
  async function handleSaveCategory() {
    if (!editingCategory || !editCategoryName.trim()) return;
    setIsSavingCategory(true);
    const result = await updateCategoryAction(editingCategory.id, editCategoryName.trim());
    setIsSavingCategory(false);
    if (result.success) {
      toast.success(result.message);
      setEditingCategory(null);
    } else {
      toast.error(result.message);
    }
  }

  // Delete Category
  async function handleDeleteCategory() {
    if (!deletingCategory) return;
    setIsDeletingCategory(true);
    const result = await deleteCategoryAction(deletingCategory.id);
    setIsDeletingCategory(false);
    if (result.success) {
      toast.success(result.message);
      setDeletingCategory(null);
    } else {
      toast.error(result.message);
    }
  }

  // Add Item
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
      setItemForms((prev) => ({
        ...prev,
        [categoryId]: { name: "", price: "", description: "", imageUrl: "" },
      }));
      setExpandedCategories((prev) => ({ ...prev, [categoryId]: false }));
    } else {
      toast.error(result.message);
    }
  }

  // Cancel Add Item (purges temp uploaded image if unsaved)
  async function handleCancelAddItem(categoryId: string) {
    const form = itemForms[categoryId];
    if (form?.imageUrl && form.imageUrl.includes("/restro-storage/")) {
      deleteImageAction(form.imageUrl);
    }
    setItemForms((prev) => ({
      ...prev,
      [categoryId]: { name: "", price: "", description: "", imageUrl: "" },
    }));
    setExpandedCategories((prev) => ({ ...prev, [categoryId]: false }));
  }

  // File Upload for New Item Form
  async function handleAddItemFileChange(categoryId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      toast.error("Formato no permitido. Solo se aceptan imágenes (PNG, JPG, WEBP, GIF, SVG).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5MB");
      return;
    }

    const currentForm = getItemForm(categoryId);
    if (currentForm.imageUrl && currentForm.imageUrl.includes("/restro-storage/")) {
      deleteImageAction(currentForm.imageUrl);
    }

    setUploadingItemImage((prev) => ({ ...prev, [categoryId]: true }));
    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadImageAction(formData, "menu-items");
    setUploadingItemImage((prev) => ({ ...prev, [categoryId]: false }));

    if (res.publicUrl) {
      updateItemForm(categoryId, "imageUrl", res.publicUrl);
      toast.success("Imagen subida correctamente");
    } else {
      toast.error(res.error || "Error al subir la imagen");
    }
  }

  // Open Edit Item Modal
  function openEditItemModal(item: MenuItemData) {
    setEditingItem(item);
    setEditItemForm({
      name: item.name,
      price: item.price.toString(),
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      isAvailable: itemAvailability[item.id] ?? item.isAvailable,
    });
    setActiveDropdown(null);
  }

  // Close Edit Item Modal (purges temp unsaved uploaded image)
  async function handleCloseEditModal() {
    if (
      editingItem &&
      editItemForm.imageUrl &&
      editItemForm.imageUrl !== (editingItem.imageUrl ?? "") &&
      editItemForm.imageUrl.includes("/restro-storage/")
    ) {
      deleteImageAction(editItemForm.imageUrl);
    }
    setEditingItem(null);
  }

  // File Upload for Edit Item Modal
  async function handleEditItemFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      toast.error("Formato no permitido. Solo se aceptan imágenes (PNG, JPG, WEBP, GIF, SVG).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5MB");
      return;
    }

    if (
      editingItem &&
      editItemForm.imageUrl &&
      editItemForm.imageUrl !== (editingItem.imageUrl ?? "") &&
      editItemForm.imageUrl.includes("/restro-storage/")
    ) {
      deleteImageAction(editItemForm.imageUrl);
    }

    setIsUploadingEditImage(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadImageAction(formData, "menu-items");
    setIsUploadingEditImage(false);

    if (res.publicUrl) {
      setEditItemForm((prev) => ({ ...prev, imageUrl: res.publicUrl! }));
      toast.success("Imagen del plato actualizada");
    } else {
      toast.error(res.error || "Error al subir la imagen");
    }
  }

  // Save Edit Item
  async function handleSaveItem() {
    if (!editingItem || !editItemForm.name.trim() || !editItemForm.price) {
      toast.error("Nombre y precio son obligatorios");
      return;
    }
    const price = parseFloat(editItemForm.price);
    if (isNaN(price) || price <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }

    setIsSavingItem(true);
    const result = await updateItemAction({
      itemId: editingItem.id,
      name: editItemForm.name.trim(),
      price,
      description: editItemForm.description.trim(),
      imageUrl: editItemForm.imageUrl.trim(),
      isAvailable: editItemForm.isAvailable,
    });
    setIsSavingItem(false);

    if (result.success) {
      setItemAvailability((prev) => ({ ...prev, [editingItem.id]: editItemForm.isAvailable }));
      toast.success(result.message);
      setEditingItem(null);
    } else {
      toast.error(result.message);
    }
  }

  // Delete Item
  async function handleDeleteItem() {
    if (!deletingItem) return;
    setIsDeletingItem(true);

    if (deletingItem.imageUrl && deletingItem.imageUrl.includes("/restro-storage/")) {
      await deleteImageAction(deletingItem.imageUrl);
    }

    const result = await deleteItemAction(deletingItem.id);
    setIsDeletingItem(false);

    if (result.success) {
      toast.success(result.message);
      setDeletingItem(null);
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

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestión de Carta Digital</h1>
          <p className={styles.subtitle}>
            Organiza tus categorías, edita precios, imágenes y controla la disponibilidad instantánea de tu menú.
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
            placeholder="Nombre de categoría (ej. Entradas, Platos Fuertes, Bebidas)"
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
            const isUploadingImg = uploadingItemImage[category.id];
            const isCatDropdownOpen = activeDropdown === `cat-${category.id}`;
            const fileInputRef = React.createRef<HTMLInputElement>();

            return (
              <div key={category.id} className={styles.categoryCard}>
                {/* Category Header */}
                <div className={styles.categoryHeader}>
                  <h3 className={styles.categoryName}>
                    {category.name}
                    <span className={styles.itemCount}>
                      ({category.items.length} platos)
                    </span>
                  </h3>

                  {/* Category 3-Dots Menu */}
                  <div className={styles.menuWrapper}>
                    <button
                      type="button"
                      className={styles.moreBtn}
                      aria-label={`Opciones de ${category.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(isCatDropdownOpen ? null : `cat-${category.id}`);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {isCatDropdownOpen && (
                      <div className={styles.dropdownMenu}>
                        <button
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => {
                            setEditingCategory({ id: category.id, name: category.name });
                            setEditCategoryName(category.name);
                            setActiveDropdown(null);
                          }}
                        >
                          <Pencil size={14} /> Editar Nombre
                        </button>
                        <button
                          type="button"
                          className={`${styles.dropdownItem} ${styles["dropdownItem--danger"]}`}
                          onClick={() => {
                            setDeletingCategory({ id: category.id, name: category.name });
                            setActiveDropdown(null);
                          }}
                        >
                          <Trash2 size={14} /> Eliminar Categoría
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Grid */}
                <div className={styles.itemsGrid}>
                  {category.items.length === 0 ? (
                    <div style={{ padding: "20px 24px", color: "#64748B", fontSize: "14px" }}>
                      Esta categoría no tiene platos agregados todavía.
                    </div>
                  ) : (
                    category.items.map((item) => {
                      const available = itemAvailability[item.id] ?? item.isAvailable;
                      const toggling = pendingToggles[item.id];
                      const isItemDropdownOpen = activeDropdown === `item-${item.id}`;

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
                            {/* Toggle availability button */}
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

                            {/* Item 3-Dots Action Menu */}
                            <div className={styles.menuWrapper}>
                              <button
                                type="button"
                                className={styles.moreBtn}
                                aria-label={`Opciones para ${item.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(isItemDropdownOpen ? null : `item-${item.id}`);
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>

                              {isItemDropdownOpen && (
                                <div className={styles.dropdownMenu}>
                                  <button
                                    type="button"
                                    className={styles.dropdownItem}
                                    onClick={() => openEditItemModal(item)}
                                  >
                                    <Pencil size={14} /> Editar Plato
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                      handleToggle(item.id);
                                      setActiveDropdown(null);
                                    }}
                                  >
                                    {available ? <EyeOff size={14} /> : <Eye size={14} />}
                                    {available ? "Marcar Agotado" : "Marcar Disponible"}
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.dropdownItem} ${styles["dropdownItem--danger"]}`}
                                    onClick={() => {
                                      setDeletingItem({ id: item.id, name: item.name, imageUrl: item.imageUrl });
                                      setActiveDropdown(null);
                                    }}
                                  >
                                    <Trash2 size={14} /> Eliminar Plato
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
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

                      {/* Full-width Image Upload Dropzone Row */}
                      <div className={styles.imageUploadRow}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                          className={styles.hiddenFileInput}
                          onChange={(e) => handleAddItemFileChange(category.id, e)}
                        />

                        {form.imageUrl ? (
                          <div className={styles.imagePreviewBox}>
                            <img src={form.imageUrl} alt="Vista previa del plato" className={styles.previewThumb} />
                            <div className={styles.previewInfo}>
                              <span className={styles.previewTitle}>Imagen adjuntada ✓</span>
                              <span className={styles.previewSubtitle}>Almacenada en Supabase</span>
                            </div>
                            <button
                              type="button"
                              className={styles.removeImageBtn}
                              onClick={() => {
                                if (form.imageUrl.includes("/restro-storage/")) {
                                  deleteImageAction(form.imageUrl);
                                }
                                updateItemForm(category.id, "imageUrl", "");
                              }}
                            >
                              <X size={12} /> Remover
                            </button>
                          </div>
                        ) : (
                          <div
                            className={styles.uploadDropzone}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {isUploadingImg ? (
                              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#2563EB" }}>
                                <Loader2 size={16} className={styles.spin} /> Subiendo imagen a Supabase...
                              </span>
                            ) : (
                              <>
                                <Upload size={18} color="#2563EB" />
                                <span>Subir foto del plato desde tu dispositivo</span>
                                <small>PNG, JPG, WEBP, GIF, SVG (Máx 5MB)</small>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Full-width Read-Only URL Row + View Image Button */}
                      <div className={styles.urlRow}>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          URL de la imagen (Solo lectura)
                        </label>
                        <div className={styles.urlInputGroup}>
                          <input
                            readOnly
                            className={styles.inputField}
                            value={form.imageUrl}
                            placeholder="La URL se generará automáticamente al cargar la imagen arriba"
                          />
                          <a
                            href={form.imageUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={form.imageUrl ? styles.btnViewImage : `${styles.btnViewImage} ${styles.btnViewImageDisabled}`}
                            onClick={(e) => !form.imageUrl && e.preventDefault()}
                          >
                            <ExternalLink size={14} /> Ver imagen
                          </a>
                        </div>
                      </div>

                      {/* Full-width Description Textarea underneath */}
                      <textarea
                        style={{ gridColumn: "1 / -1", width: "100%" }}
                        className={`${styles.inputField} ${styles.textarea}`}
                        placeholder="Descripción de ingredientes, alérgenos o sabor (aparecerá debajo de la imagen)"
                        value={form.description}
                        onChange={(e) =>
                          updateItemForm(category.id, "description", e.target.value)
                        }
                      />

                      <div className={styles.formActions}>
                        <button
                          type="button"
                          className={styles.btnCancel}
                          onClick={() => handleCancelAddItem(category.id)}
                          disabled={isAddingItem || isUploadingImg}
                        >
                          <X size={13} /> Cancelar
                        </button>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          disabled={isAddingItem || isUploadingImg || !form.name || !form.price}
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

      {/* ── MODALS (design.md aligned) ────────────────────────── */}

      {/* 1. Category Edit Modal */}
      <Modal
        isOpen={Boolean(editingCategory)}
        onClose={() => setEditingCategory(null)}
        title="Editar Categoría"
        size="sm"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#0F172A", marginBottom: "6px" }}>
              Nombre de la categoría *
            </label>
            <Input
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              placeholder="Ej. Entradas, Postres, Licores"
              required
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setEditingCategory(null)}
              disabled={isSavingCategory}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSaveCategory}
              disabled={isSavingCategory || !editCategoryName.trim()}
            >
              {isSavingCategory ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Category Delete Modal */}
      <Modal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        title="Eliminar Categoría"
        size="sm"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
            ¿Estás seguro de que deseas eliminar la categoría <strong>"{deletingCategory?.name}"</strong>?
            Todos los platos contenidos en esta categoría también se eliminarán.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setDeletingCategory(null)}
              disabled={isDeletingCategory}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={handleDeleteCategory}
              disabled={isDeletingCategory}
            >
              {isDeletingCategory ? "Eliminando..." : "Eliminar Categoría"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. Item Edit Modal */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={handleCloseEditModal}
        title="Editar Plato"
        size="md"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#0F172A", marginBottom: "6px" }}>
              Nombre del plato *
            </label>
            <Input
              value={editItemForm.name}
              onChange={(e) => setEditItemForm({ ...editItemForm, name: e.target.value })}
              placeholder="Nombre del plato"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#0F172A", marginBottom: "6px" }}>
                Precio (COP) *
              </label>
              <Input
                type="number"
                value={editItemForm.price}
                onChange={(e) => setEditItemForm({ ...editItemForm, price: e.target.value })}
                placeholder="25000"
                min="0"
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#0F172A", marginBottom: "6px" }}>
                Disponibilidad
              </label>
              <select
                className={styles.inputField}
                style={{ width: "100%" }}
                value={editItemForm.isAvailable ? "available" : "unavailable"}
                onChange={(e) =>
                  setEditItemForm({ ...editItemForm, isAvailable: e.target.value === "available" })
                }
              >
                <option value="available">Disponible</option>
                <option value="unavailable">Agotado</option>
              </select>
            </div>
          </div>

          {/* Image Upload Dropzone in Modal */}
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#0F172A", marginBottom: "6px" }}>
              Imagen del plato
            </label>
            <input
              ref={editFileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
              className={styles.hiddenFileInput}
              onChange={handleEditItemFileChange}
            />

            {editItemForm.imageUrl ? (
              <div className={styles.imagePreviewBox}>
                <img src={editItemForm.imageUrl} alt="Plato" className={styles.previewThumb} />
                <div className={styles.previewInfo}>
                  <span className={styles.previewTitle}>Imagen actual</span>
                  <span className={styles.previewSubtitle}>Almacenada en Supabase</span>
                </div>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ height: 32, padding: "0 10px", fontSize: 12 }}
                  onClick={() => editFileInputRef.current?.click()}
                  disabled={isUploadingEditImage}
                >
                  <Upload size={13} /> Cambiar
                </button>
                <button
                  type="button"
                  className={styles.removeImageBtn}
                  onClick={() => {
                    if (
                      editingItem &&
                      editItemForm.imageUrl !== (editingItem.imageUrl ?? "") &&
                      editItemForm.imageUrl.includes("/restro-storage/")
                    ) {
                      deleteImageAction(editItemForm.imageUrl);
                    }
                    setEditItemForm((prev) => ({ ...prev, imageUrl: "" }));
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div
                className={styles.uploadDropzone}
                onClick={() => editFileInputRef.current?.click()}
              >
                {isUploadingEditImage ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#2563EB" }}>
                    <Loader2 size={16} className={styles.spin} /> Subiendo nueva imagen...
                  </span>
                ) : (
                  <>
                    <Upload size={18} color="#2563EB" />
                    <span>Seleccionar imagen desde tu dispositivo</span>
                    <small>PNG, JPG, WEBP, GIF, SVG (Máx 5MB)</small>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Full-width Read-Only URL Input + View Image Link Button in Modal */}
          <div className={styles.urlRow}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              URL de la imagen (Solo lectura)
            </label>
            <div className={styles.urlInputGroup}>
              <input
                readOnly
                className={styles.inputField}
                value={editItemForm.imageUrl}
                placeholder="La URL se generará automáticamente al cargar la imagen"
              />
              <a
                href={editItemForm.imageUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={editItemForm.imageUrl ? styles.btnViewImage : `${styles.btnViewImage} ${styles.btnViewImageDisabled}`}
                onClick={(e) => !editItemForm.imageUrl && e.preventDefault()}
              >
                <ExternalLink size={14} /> Ver imagen
              </a>
            </div>
          </div>

          {/* Full-width Description Textarea underneath */}
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#0F172A", marginBottom: "6px" }}>
              Descripción
            </label>
            <textarea
              className={`${styles.inputField} ${styles.textarea}`}
              style={{ width: "100%", height: "80px" }}
              value={editItemForm.description}
              onChange={(e) => setEditItemForm({ ...editItemForm, description: e.target.value })}
              placeholder="Ingredientes, alérgenos o descripción corta"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleCloseEditModal}
              disabled={isSavingItem || isUploadingEditImage}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSaveItem}
              disabled={isSavingItem || isUploadingEditImage || !editItemForm.name || !editItemForm.price}
            >
              {isSavingItem ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Item Delete Modal */}
      <Modal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Eliminar Plato"
        size="sm"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
            ¿Estás seguro de que deseas eliminar el plato <strong>"{deletingItem?.name}"</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setDeletingItem(null)}
              disabled={isDeletingItem}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={handleDeleteItem}
              disabled={isDeletingItem}
            >
              {isDeletingItem ? "Eliminando..." : "Eliminar Plato"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
