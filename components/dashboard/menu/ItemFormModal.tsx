import React, { useState, useTransition, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Plus, 
  Trash2, 
  Upload, 
  Loader2, 
  HelpCircle,
  X
} from "lucide-react";
import { toast } from "sonner";
import styles from "./ItemFormModal.module.css";
import { ModifierGroupData } from "./MenuPageClient";

interface Category {
  id: string;
  name: string;
}

export interface ItemFormData {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  modifierGroups: ModifierGroupData[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ItemFormData;
  categories: Category[];
  onSave: (data: ItemFormData) => Promise<{ success: boolean; message?: string }>;
  onUploadImage: (file: File) => Promise<{ success: boolean; url?: string; message?: string }>;
}

export function ItemFormModal({
  isOpen,
  onClose,
  initialData,
  categories,
  onSave,
  onUploadImage
}: Props) {
  const [activeTab, setActiveTab] = useState<"basic" | "modifiers">("basic");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || (categories[0]?.id || ""));
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [modifierGroups, setModifierGroups] = useState<ModifierGroupData[]>(
    initialData?.modifierGroups || []
  );

  const [showHelp, setShowHelp] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen válida.");
      return;
    }

    setIsUploading(true);
    const res = await onUploadImage(file);
    setIsUploading(false);

    if (res.success && res.url) {
      setImageUrl(res.url);
      toast.success("Imagen subida correctamente");
    } else {
      toast.error(res.message || "Error al subir la imagen");
    }
  };

  const handleSave = () => {
    if (!name.trim() || !price || !categoryId) {
      toast.error("Nombre, precio y categoría son obligatorios");
      return;
    }

    startTransition(async () => {
      const res = await onSave({
        id: initialData?.id,
        categoryId,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        imageUrl,
        modifierGroups
      });

      if (res.success) {
        toast.success(res.message);
        onClose();
      } else {
        toast.error(res.message);
      }
    });
  };

  // Modifier Actions
  const addModifierGroup = () => {
    const newGroup: ModifierGroupData = {
      id: `temp-${Date.now()}`,
      name: "",
      isRequired: false,
      minSelections: 0,
      maxSelections: 1,
      options: [],
    };
    setModifierGroups([...modifierGroups, newGroup]);
  };

  const updateGroup = (groupId: string, field: keyof ModifierGroupData, value: string | boolean | number) => {
    setModifierGroups(modifierGroups.map(g => g.id === groupId ? { ...g, [field]: value } : g));
  };

  const deleteGroup = (groupId: string) => {
    setModifierGroups(modifierGroups.filter(g => g.id !== groupId));
  };

  const addOption = (groupId: string) => {
    setModifierGroups(modifierGroups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: [...g.options, { id: `temp-opt-${Date.now()}`, name: "", priceExtra: 0, isAvailable: true }]
        };
      }
      return g;
    }));
  };

  const updateOption = (groupId: string, optionId: string, field: string, value: string | number) => {
    setModifierGroups(modifierGroups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: g.options.map(o => o.id === optionId ? { ...o, [field]: value } : o)
        };
      }
      return g;
    }));
  };

  const deleteOption = (groupId: string, optionId: string) => {
    setModifierGroups(modifierGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, options: g.options.filter(o => o.id !== optionId) };
      }
      return g;
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Plato" : "Nuevo Plato"} size="lg">
      <div className={styles.container}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === "basic" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("basic")}
          >
            Información Básica
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "modifiers" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("modifiers")}
          >
            Acompañantes / Modificadores
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === "basic" && (
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Nombre del Plato *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} placeholder="Ej. Hamburguesa Sencilla" />
              </div>
              <div className={styles.field}>
                <label>Precio *</label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isPending} placeholder="0.00" />
              </div>
              <div className={styles.field}>
                <label>Categoría *</label>
                <select className={styles.select} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={isPending}>
                  <option value="" disabled>Selecciona una categoría</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                <label>Descripción</label>
                <textarea 
                  className={styles.textarea} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  disabled={isPending} 
                  placeholder="Descripción de los ingredientes..." 
                  rows={3}
                />
              </div>
              <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                <label>Imagen del Plato</label>
                <div className={styles.imageUploadWrapper}>
                  {imageUrl ? (
                    <div className={styles.imagePreview}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="Preview" />
                      <button className={styles.removeImgBtn} onClick={() => setImageUrl("")}><X size={16} /></button>
                    </div>
                  ) : (
                    <div className={styles.uploadBox} onClick={() => fileInputRef.current?.click()}>
                      {isUploading ? <Loader2 className={styles.spin} /> : <Upload color="#64748b" />}
                      <span>{isUploading ? "Subiendo..." : "Clic para subir imagen"}</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "modifiers" && (
            <div className={styles.modifiersSection}>
              <div className={styles.modHeader}>
                <p className={styles.modSubtitle}>
                  Configura opciones extra, variaciones o acompañamientos para este plato.
                </p>
                <div className={styles.helpWrapper}>
                  <button className={styles.helpBtn} onClick={() => setShowHelp(!showHelp)} type="button">
                    <HelpCircle size={18} /> ¿Cómo funciona?
                  </button>
                  {showHelp && (
                    <div className={styles.helpTooltip}>
                      <strong>Grupos de Modificadores:</strong> Te permiten agrupar opciones relacionadas. 
                      <br/>Ejemplo: Crea un grupo llamado <em>&quot;Elige tu bebida&quot;</em> y agrega como opciones <em>Coca-Cola, Sprite, Agua</em>.
                      <br/><br/>
                      Si marcas <strong>&quot;Obligatorio&quot;</strong>, el cliente deberá elegir al menos una opción para añadir el plato al carrito.
                      <br/>Usa el mínimo y máximo para controlar cuántas selecciones pueden hacer (ej. Máximo 1 para una opción única).
                    </div>
                  )}
                </div>
              </div>

              {modifierGroups.length === 0 ? (
                <div className={styles.emptyModifiers}>
                  <p>Este plato no tiene acompañantes configurados.</p>
                  <Button onClick={addModifierGroup}>Crear Primer Grupo</Button>
                </div>
              ) : (
                <div className={styles.groupsList}>
                  {modifierGroups.map((group) => (
                    <div key={group.id} className={styles.groupCard}>
                      <div className={styles.groupHeader}>
                        <div className={styles.groupHeaderRow}>
                          <Input 
                            value={group.name} 
                            onChange={(e) => updateGroup(group.id, "name", e.target.value)} 
                            placeholder="Nombre del grupo (Ej. Elige tu término)" 
                            style={{ flex: 1 }}
                          />
                          <button className={styles.iconBtnDanger} onClick={() => deleteGroup(group.id)} title="Eliminar Grupo">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className={styles.groupSettingsRow}>
                          <label className={styles.checkboxLabel}>
                            <input 
                              type="checkbox" 
                              checked={group.isRequired} 
                              onChange={(e) => updateGroup(group.id, "isRequired", e.target.checked)}
                            />
                            Es obligatorio
                          </label>
                          <label className={styles.numberLabel}>
                            Min:
                            <Input 
                              type="number" 
                              value={group.minSelections} 
                              onChange={(e) => updateGroup(group.id, "minSelections", parseInt(e.target.value) || 0)} 
                              style={{ width: "70px" }}
                            />
                          </label>
                          <label className={styles.numberLabel}>
                            Max:
                            <Input 
                              type="number" 
                              value={group.maxSelections} 
                              onChange={(e) => updateGroup(group.id, "maxSelections", parseInt(e.target.value) || 1)} 
                              style={{ width: "70px" }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className={styles.optionsList}>
                        {group.options.length === 0 ? (
                          <span className={styles.emptyOptions}>Añade opciones a este grupo</span>
                        ) : (
                          group.options.map((opt, oIdx) => (
                            <div key={opt.id} className={styles.optionRow}>
                              <Input 
                                value={opt.name} 
                                onChange={(e) => updateOption(group.id, opt.id, "name", e.target.value)} 
                                placeholder={`Opción ${oIdx + 1} (Ej. Coca Cola)`} 
                                style={{ flex: 1 }}
                              />
                              <Input 
                                type="number" 
                                value={opt.priceExtra} 
                                onChange={(e) => updateOption(group.id, opt.id, "priceExtra", parseFloat(e.target.value) || 0)} 
                                placeholder="+ $ Extra" 
                                style={{ width: "120px" }}
                              />
                              <button className={styles.iconBtnDanger} onClick={() => deleteOption(group.id, opt.id)}>
                                <X size={18} />
                              </button>
                            </div>
                          ))
                        )}
                        <Button variant="outline" onClick={() => addOption(group.id)} style={{ width: "fit-content", alignSelf: "flex-start", marginTop: "8px" }}>
                          <Plus size={16} /> Añadir Opción
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addModifierGroup} style={{ borderStyle: "dashed" }}>
                    <Plus size={16} /> Añadir Otro Grupo
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={16} className={styles.spin} />} Guardar Plato
          </Button>
        </div>
      </div>
    </Modal>
  );
}
