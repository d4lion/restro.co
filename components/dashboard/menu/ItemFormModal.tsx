import React, { useState, useTransition, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Plus,
  Trash2,
  Upload,
  Loader2,
  X,
  Bookmark,
  Check,
  Pencil,
  ArrowLeft,
  Minus,
  Maximize2,
  GripHorizontal,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crop,
} from "lucide-react";
import { toast } from "sonner";
import styles from "./ItemFormModal.module.css";
import { ModifierGroupData } from "./MenuPageClient";

export const PRODUCT_IMAGE_ASPECT_RATIO = 4 / 3;
export const PRODUCT_IMAGE_EXPORT_WIDTH = 960;
export const PRODUCT_IMAGE_EXPORT_HEIGHT = 720;

export interface CropGeometry {
  wRel: number;
  hRel: number;
  leftPct: number;
  topPct: number;
  clampedPanX: number;
  clampedPanY: number;
  fitZoom: number;
}

/**
 * Computes normalized 4:3 crop geometry shared identically between CSS live preview and HTML5 <canvas> export.
 * - zoom = 1 means "cover" (fills the 4:3 frame completely without empty margins).
 * - zoom = fitZoom (<= 1) means "contain" (100% of the source image fits inside 4:3 without cutting any edge).
 * - panX / panY are normalized offsets relative to the 4:3 frame width/height (0 = centered).
 */
export function computeCropGeometry(
  naturalWidth: number,
  naturalHeight: number,
  zoom: number,
  panX: number,
  panY: number,
  targetAspect = PRODUCT_IMAGE_ASPECT_RATIO
): CropGeometry {
  const safeW = Math.max(1, naturalWidth);
  const safeH = Math.max(1, naturalHeight);
  const imgAspect = safeW / safeH;

  const coverRatioW = Math.max(1, imgAspect / targetAspect);
  const coverRatioH = Math.max(1, targetAspect / imgAspect);
  const fitZoom = Number((1 / Math.max(coverRatioW, coverRatioH)).toFixed(4));

  const safeZoom = Math.max(fitZoom, Math.min(3, zoom));
  const wRel = coverRatioW * safeZoom;
  const hRel = coverRatioH * safeZoom;

  const maxPanX = wRel > 1 ? (wRel - 1) / 2 : 0;
  const maxPanY = hRel > 1 ? (hRel - 1) / 2 : 0;

  const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, panY));

  const leftPct = (0.5 - wRel / 2 + clampedPanX) * 100;
  const topPct = (0.5 - hRel / 2 + clampedPanY) * 100;

  return {
    wRel,
    hRel,
    leftPct,
    topPct,
    clampedPanX,
    clampedPanY,
    fitZoom,
  };
}

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
  reusableGroups?: ModifierGroupData[];
  onSave: (data: ItemFormData) => Promise<{ success: boolean; message?: string }>;
  onSaveReusableGroup?: (group: ModifierGroupData) => Promise<{ success: boolean; message?: string }>;
  onDeleteReusableGroup?: (groupId: string) => Promise<{ success: boolean; message?: string }>;
  onUploadImage: (file: File) => Promise<{ success: boolean; url?: string; message?: string }>;
  quotaNotice?: string | null;
}

/**
 * Formats a numeric value or digit string into Colombian Peso display format (e.g. "$ 25.000").
 * Returns "" when empty or 0 so inputs never trap the user with a default "0".
 */
export function formatCOPInput(
  value: number | string | null | undefined,
  prefix = "$ "
): string {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .replace(/^0+/, "");
  if (!digits) return "";
  const numeric = parseInt(digits, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return `${prefix}${new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(numeric)}`;
}

/**
 * Extracts integer COP amount from a formatted input string.
 */
export function parseCOPInput(raw: string): number {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return 0;
  const parsed = parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ItemFormModal({
  isOpen,
  onClose,
  initialData,
  categories,
  reusableGroups = [],
  onSave,
  onSaveReusableGroup,
  onDeleteReusableGroup,
  onUploadImage,
  quotaNotice,
}: Props) {
  const [activeTab, setActiveTab] = useState<"basic" | "modifiers">("basic");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Main Dish Form State
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId || categories[0]?.id || ""
  );
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [priceValue, setPriceValue] = useState<number>(
    initialData?.price && initialData.price > 0
      ? Math.round(initialData.price)
      : 0
  );
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [modifierGroups, setModifierGroups] = useState<ModifierGroupData[]>(
    () =>
      (initialData?.modifierGroups || []).map((g) => {
        const matchedReusable = reusableGroups.find(
          (r) =>
            !r.id.startsWith("derived-") &&
            r.name.trim().toLowerCase() === g.name.trim().toLowerCase() &&
            g.name.trim().length > 0
        );
        if (matchedReusable) {
          return {
            ...g,
            name: matchedReusable.name,
            previousName: matchedReusable.name,
            isRequired: matchedReusable.isRequired,
            minSelections: matchedReusable.minSelections,
            maxSelections: matchedReusable.maxSelections,
            saveAsReusable: true,
            options: matchedReusable.options.map((o) => ({ ...o })),
          };
        }
        return g;
      })
  );

  // Interactive 4:3 Photo Framer state
  const [cropDraft, setCropDraft] = useState<{
    srcUrl: string;
    fileName: string;
    naturalWidth: number;
    naturalHeight: number;
  } | null>(null);
  const [rawSourceImage, setRawSourceImage] = useState<{
    srcUrl: string;
    fileName: string;
  } | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropPan, setCropPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const cropStageRef = useRef<HTMLDivElement>(null);
  const cropDragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  // Draft strings for min/max inputs so the user can backspace without getting stuck on "0" or "1"
  const [selectionDrafts, setSelectionDrafts] = useState<Record<string, string>>({});
  const [savingReusableId, setSavingReusableId] = useState<string | null>(null);

  // Floating Window State (for Reusable Modifier Groups)
  const [isReusableWindowOpen, setIsReusableWindowOpen] = useState(false);
  const [isWindowMinimized, setIsWindowMinimized] = useState(false);
  const [windowPos, setWindowPos] = useState<{ x: number; y: number }>({ x: 60, y: 90 });
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);

  // Editor state inside the Floating Window
  const [editingReusable, setEditingReusable] = useState<ModifierGroupData | null>(null);
  const [isSavingWindowGroup, setIsSavingWindowGroup] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowPos({
        x: Math.max(20, window.innerWidth - 460),
        y: 80,
      });
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragOffsetRef.current) return;
      const nextX = Math.max(
        10,
        Math.min(window.innerWidth - 320, e.clientX - dragOffsetRef.current.x)
      );
      const nextY = Math.max(
        10,
        Math.min(window.innerHeight - 60, e.clientY - dragOffsetRef.current.y)
      );
      setWindowPos({ x: nextX, y: nextY });
    };
    const handleMouseUp = () => {
      dragOffsetRef.current = null;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (!isOpen) return null;

  const startDraggingWindow = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    dragOffsetRef.current = {
      x: e.clientX - windowPos.x,
      y: e.clientY - windowPos.y,
    };
  };

  const openFramerWithSource = (srcUrl: string, fileName = "plato.jpg") => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setCropDraft({
        srcUrl,
        fileName,
        naturalWidth: img.naturalWidth || 800,
        naturalHeight: img.naturalHeight || 600,
      });
      setCropZoom(1);
      setCropPan({ x: 0, y: 0 });
    };
    img.onerror = () => {
      toast.error("No se pudo cargar la imagen para ajustar el encuadre.");
    };
    img.src = srcUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen válida.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setRawSourceImage({ srcUrl: objectUrl, fileName: file.name });
    openFramerWithSource(objectUrl, file.name);
  };

  const activeCropGeometry = cropDraft
    ? computeCropGeometry(
        cropDraft.naturalWidth,
        cropDraft.naturalHeight,
        cropZoom,
        cropPan.x,
        cropPan.y
      )
    : null;

  const handleCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cropDraft || !activeCropGeometry) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingCrop(true);
    cropDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startPanX: activeCropGeometry.clampedPanX,
      startPanY: activeCropGeometry.clampedPanY,
    };
  };

  const handleCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCrop || !cropDragStartRef.current || !cropStageRef.current || !cropDraft) {
      return;
    }
    const rect = cropStageRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaX = (e.clientX - cropDragStartRef.current.clientX) / rect.width;
    const deltaY = (e.clientY - cropDragStartRef.current.clientY) / rect.height;

    const nextGeo = computeCropGeometry(
      cropDraft.naturalWidth,
      cropDraft.naturalHeight,
      cropZoom,
      cropDragStartRef.current.startPanX + deltaX,
      cropDragStartRef.current.startPanY + deltaY
    );

    setCropPan({ x: nextGeo.clampedPanX, y: nextGeo.clampedPanY });
  };

  const handleCropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingCrop) {
      setIsDraggingCrop(false);
      cropDragStartRef.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  const handleCropZoomChange = (nextZoom: number) => {
    if (!cropDraft) return;
    const geo = computeCropGeometry(
      cropDraft.naturalWidth,
      cropDraft.naturalHeight,
      nextZoom,
      cropPan.x,
      cropPan.y
    );
    setCropZoom( Math.max(geo.fitZoom, Math.min(3, nextZoom)) );
    setCropPan({ x: geo.clampedPanX, y: geo.clampedPanY });
  };

  const handleConfirmCropAndUpload = async () => {
    if (!cropDraft || !activeCropGeometry) return;

    setIsUploading(true);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new window.Image();
        el.crossOrigin = "anonymous";
        el.onload = () => resolve(el);
        el.onerror = (err) => reject(err);
        el.src = cropDraft.srcUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = PRODUCT_IMAGE_EXPORT_WIDTH;
      canvas.height = PRODUCT_IMAGE_EXPORT_HEIGHT;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No se pudo inicializar el lienzo de recorte");
      }

      // Soft ambient fill if the user zoomed out below 1.0x ("Encajar completa")
      if (activeCropGeometry.wRel < 0.999 || activeCropGeometry.hRel < 0.999) {
        const coverGeo = computeCropGeometry(
          cropDraft.naturalWidth,
          cropDraft.naturalHeight,
          1,
          0,
          0
        );
        ctx.save();
        ctx.filter = "blur(22px) brightness(0.9)";
        const bgW = coverGeo.wRel * PRODUCT_IMAGE_EXPORT_WIDTH * 1.08;
        const bgH = coverGeo.hRel * PRODUCT_IMAGE_EXPORT_HEIGHT * 1.08;
        const bgX = (PRODUCT_IMAGE_EXPORT_WIDTH - bgW) / 2;
        const bgY = (PRODUCT_IMAGE_EXPORT_HEIGHT - bgH) / 2;
        ctx.drawImage(img, bgX, bgY, bgW, bgH);
        ctx.restore();
      } else {
        ctx.fillStyle = "#F8FAFC";
        ctx.fillRect(0, 0, PRODUCT_IMAGE_EXPORT_WIDTH, PRODUCT_IMAGE_EXPORT_HEIGHT);
      }

      const drawW = activeCropGeometry.wRel * PRODUCT_IMAGE_EXPORT_WIDTH;
      const drawH = activeCropGeometry.hRel * PRODUCT_IMAGE_EXPORT_HEIGHT;
      const drawX = (activeCropGeometry.leftPct / 100) * PRODUCT_IMAGE_EXPORT_WIDTH;
      const drawY = (activeCropGeometry.topPct / 100) * PRODUCT_IMAGE_EXPORT_HEIGHT;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
      );

      if (!blob) {
        throw new Error("No se pudo procesar la imagen recortada");
      }

      const baseName = cropDraft.fileName.replace(/\.[^/.]+$/, "") || "plato";
      const croppedFile = new File([blob], `${baseName}-4x3.jpg`, {
        type: "image/jpeg",
      });

      const res = await onUploadImage(croppedFile);
      setIsUploading(false);

      if (res.success && res.url) {
        setImageUrl(res.url);
        setCropDraft(null);
        toast.success("Imagen encuadrada y subida correctamente");
      } else {
        toast.error(res.message || "Error al subir la imagen");
      }
    } catch (err) {
      console.error("Error cropping image:", err);
      setIsUploading(false);
      toast.error("No se pudo procesar el encuadre de la imagen");
    }
  };

  const handleSave = () => {
    if (cropDraft) {
      toast.info(
        "Haz clic en 'Aplicar encuadre y subir' para confirmar cómo se verá tu foto antes de guardar el plato."
      );
      return;
    }

    if (!name.trim() || priceValue <= 0 || !categoryId) {
      toast.error("Nombre, precio mayor a $ 0 y categoría son obligatorios");
      return;
    }

    startTransition(async () => {
      const res = await onSave({
        id: initialData?.id,
        categoryId,
        name: name.trim(),
        description: description.trim(),
        price: priceValue,
        imageUrl,
        modifierGroups,
      });

      if (res.success) {
        toast.success(res.message);
        onClose();
      } else {
        toast.error(res.message);
      }
    });
  };

  // Dish Modifier Actions
  const addManualModifierGroup = () => {
    const newGroup: ModifierGroupData = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: "",
      isRequired: false,
      minSelections: 0,
      maxSelections: 1,
      saveAsReusable: false,
      options: [
        {
          id: `temp-opt-${Date.now()}`,
          name: "",
          priceExtra: 0,
          isAvailable: true,
        },
      ],
    };
    setModifierGroups([...modifierGroups, newGroup]);
  };

  const syncGroupIntoDishState = (template: ModifierGroupData) => {
    const cleanTemplateName = template.name.trim().toLowerCase();
    const prevTemplateName = template.previousName?.trim().toLowerCase();
    const syncedOptions = template.options.map((opt, idx) => ({
      id: `temp-opt-${Date.now()}-${idx}`,
      name: opt.name.trim(),
      priceExtra: opt.priceExtra,
      isAvailable: opt.isAvailable ?? true,
    }));

    setModifierGroups((prev) =>
      prev.map((g) => {
        const gName = g.name.trim().toLowerCase();
        const gPrev = g.previousName?.trim().toLowerCase();
        const isMatch =
          gName === cleanTemplateName ||
          (prevTemplateName &&
            (gName === prevTemplateName || gPrev === prevTemplateName)) ||
          (gPrev && gPrev === cleanTemplateName);
        if (!isMatch) return g;
        return {
          ...g,
          name: template.name.trim(),
          previousName: template.name.trim(),
          isRequired: template.isRequired,
          minSelections: template.minSelections,
          maxSelections: template.maxSelections,
          saveAsReusable: true,
          options: syncedOptions,
        };
      })
    );
  };

  const applyReusableGroup = (template: ModifierGroupData) => {
    const cleanTemplateName = template.name.trim().toLowerCase();
    const prevTemplateName = template.previousName?.trim().toLowerCase();
    const alreadyExists = modifierGroups.some((g) => {
      const gName = g.name.trim().toLowerCase();
      const gPrev = g.previousName?.trim().toLowerCase();
      return (
        gName === cleanTemplateName ||
        (prevTemplateName &&
          (gName === prevTemplateName || gPrev === prevTemplateName)) ||
        (gPrev && gPrev === cleanTemplateName)
      );
    });

    if (alreadyExists) {
      syncGroupIntoDishState(template);
      toast.success(`"${template.name.trim()}" actualizado en este plato`);
      return;
    }

    const clonedGroup: ModifierGroupData = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: template.name.trim(),
      previousName: template.name.trim(),
      isRequired: template.isRequired,
      minSelections: template.minSelections,
      maxSelections: template.maxSelections,
      saveAsReusable: true,
      options: template.options.map((opt, idx) => ({
        id: `temp-opt-${Date.now()}-${idx}`,
        name: opt.name.trim(),
        priceExtra: opt.priceExtra,
        isAvailable: opt.isAvailable ?? true,
      })),
    };

    setModifierGroups((prev) => [...prev, clonedGroup]);
    toast.success(`"${template.name.trim()}" agregado al plato`);
  };

  const handleBookmarkGroup = async (group: ModifierGroupData) => {
    if (!onSaveReusableGroup) {
      updateGroup(group.id, "saveAsReusable", !group.saveAsReusable);
      return;
    }
    if (!group.name.trim()) {
      toast.error("Escribe primero el nombre del grupo (ej. Bebidas)");
      return;
    }
    const validOpts = group.options.filter((o) => o.name.trim().length > 0);
    if (validOpts.length === 0) {
      toast.error("Agrega al menos una opción al grupo antes de guardarlo");
      return;
    }

    const cleanName = group.name.trim();
    setSavingReusableId(group.id);
    const res = await onSaveReusableGroup({
      ...group,
      name: cleanName,
      previousName: group.previousName || cleanName,
      saveAsReusable: true,
      options: validOpts,
    });
    setSavingReusableId(null);

    if (res.success) {
      setModifierGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? {
                ...g,
                name: cleanName,
                previousName: cleanName,
                saveAsReusable: true,
              }
            : g
        )
      );
      toast.success(
        res.message || `"${cleanName}" guardado y actualizado en todos los platos`
      );
    } else {
      toast.error(res.message || "Error al guardar grupo reutilizable");
    }
  };

  // Floating Window Editor Actions
  const startNewReusableInWindow = () => {
    setEditingReusable({
      id: `temp-reusable-${Date.now()}`,
      name: "",
      isRequired: false,
      minSelections: 0,
      maxSelections: 1,
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

  const handleSaveReusableFromWindow = async (alsoAddToDish: boolean) => {
    if (!editingReusable || !onSaveReusableGroup) return;
    if (!editingReusable.name.trim()) {
      toast.error("El nombre del grupo es obligatorio");
      return;
    }
    const validOpts = editingReusable.options.filter(
      (o) => o.name.trim().length > 0
    );
    if (validOpts.length === 0) {
      toast.error("Agrega al menos una opción con nombre");
      return;
    }

    const cleanName = editingReusable.name.trim();
    const cleanGroup: ModifierGroupData = {
      ...editingReusable,
      name: cleanName,
      previousName: editingReusable.previousName || cleanName,
      saveAsReusable: true,
      options: validOpts,
    };

    setIsSavingWindowGroup(true);
    const res = await onSaveReusableGroup(cleanGroup);
    setIsSavingWindowGroup(false);

    if (res.success) {
      const cleanNameLower = cleanName.toLowerCase();
      const prevNameLower = cleanGroup.previousName?.trim().toLowerCase();
      const existsInCurrentDish = modifierGroups.some((g) => {
        const gName = g.name.trim().toLowerCase();
        const gPrev = g.previousName?.trim().toLowerCase();
        return (
          gName === cleanNameLower ||
          (prevNameLower &&
            (gName === prevNameLower || gPrev === prevNameLower)) ||
          (gPrev && gPrev === cleanNameLower)
        );
      });

      if (existsInCurrentDish) {
        syncGroupIntoDishState(cleanGroup);
        toast.success(
          res.message || `"${cleanName}" actualizado en todos los platos`
        );
      } else if (alsoAddToDish) {
        applyReusableGroup(cleanGroup);
      } else {
        toast.success(
          res.message || `"${cleanName}" actualizado en todos los platos`
        );
      }
      setEditingReusable(null);
    } else {
      toast.error(res.message || "No se pudo guardar el grupo");
    }
  };

  const handleDeleteReusableTemplate = async (template: ModifierGroupData) => {
    if (!onDeleteReusableGroup) return;
    if (template.id.startsWith("derived-")) {
      toast.info("Este grupo proviene de otro plato existente en tu carta.");
      return;
    }
    const res = await onDeleteReusableGroup(template.id);
    if (res.success) {
      toast.success("Grupo eliminado de la biblioteca");
    } else {
      toast.error(res.message || "Error al eliminar");
    }
  };

  const updateGroup = (
    groupId: string,
    field: keyof ModifierGroupData,
    value: string | boolean | number
  ) => {
    setModifierGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, [field]: value } : g))
    );
  };

  const deleteGroup = (groupId: string) => {
    setModifierGroups(modifierGroups.filter((g) => g.id !== groupId));
  };

  const addOption = (groupId: string) => {
    setModifierGroups(
      modifierGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: [
              ...g.options,
              {
                id: `temp-opt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                name: "",
                priceExtra: 0,
                isAvailable: true,
              },
            ],
          };
        }
        return g;
      })
    );
  };

  const updateOption = (
    groupId: string,
    optionId: string,
    field: string,
    value: string | number
  ) => {
    setModifierGroups(
      modifierGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: g.options.map((o) =>
              o.id === optionId ? { ...o, [field]: value } : o
            ),
          };
        }
        return g;
      })
    );
  };

  const deleteOption = (groupId: string, optionId: string) => {
    setModifierGroups(
      modifierGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: g.options.filter((o) => o.id !== optionId),
          };
        }
        return g;
      })
    );
  };

  const getDraftValue = (
    groupId: string,
    field: "minSelections" | "maxSelections",
    actualValue: number
  ) => {
    const key = `${groupId}:${field}`;
    if (key in selectionDrafts) {
      return selectionDrafts[key];
    }
    return actualValue === 0 && field === "minSelections"
      ? ""
      : String(actualValue);
  };

  const handleSelectionChange = (
    groupId: string,
    field: "minSelections" | "maxSelections",
    raw: string
  ) => {
    const key = `${groupId}:${field}`;
    const digits = raw.replace(/\D/g, "");
    setSelectionDrafts((prev) => ({ ...prev, [key]: digits }));
    if (digits !== "") {
      updateGroup(groupId, field, parseInt(digits, 10));
    } else {
      updateGroup(groupId, field, field === "maxSelections" ? 1 : 0);
    }
  };

  const handleSelectionBlur = (
    groupId: string,
    field: "minSelections" | "maxSelections"
  ) => {
    const key = `${groupId}:${field}`;
    setSelectionDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={initialData ? "Editar Plato" : "Nuevo Plato"}
        size="lg"
      >
        <div className={styles.container}>
          {!initialData && quotaNotice && (
            <div
              style={{
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                color: "#1E40AF",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "12px",
              }}
            >
              {quotaNotice}
            </div>
          )}

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${
                activeTab === "basic" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("basic")}
              type="button"
            >
              Información Básica
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "modifiers" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("modifiers")}
              type="button"
            >
              Acompañantes
              {modifierGroups.length > 0 ? ` (${modifierGroups.length})` : ""}
            </button>
          </div>

          <div className={styles.content}>
            {activeTab === "basic" && (
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Nombre del Plato *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPending}
                    placeholder="Ej. Hamburguesa Artesanal"
                  />
                </div>
                <div className={styles.field}>
                  <label>Precio (COP) *</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatCOPInput(priceValue, "$ ")}
                    onChange={(e) =>
                      setPriceValue(parseCOPInput(e.target.value))
                    }
                    disabled={isPending}
                    placeholder="$ 25.000"
                  />
                </div>
                <div className={styles.field}>
                  <label>Categoría *</label>
                  <select
                    className={styles.select}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={isPending}
                  >
                    <option value="" disabled>
                      Selecciona una categoría
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
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
                    placeholder="Ingredientes o preparación..."
                    rows={3}
                  />
                </div>
                <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                  <div className={styles.imageFieldHeader}>
                    <label>Imagen del Plato (Formato 4:3 de Carta Digital)</label>
                    <span className={styles.imageFieldBadge}>Proporción 4:3</span>
                  </div>

                  {cropDraft && activeCropGeometry ? (
                    <div className={styles.cropperWorkspace}>
                      <div className={styles.cropperColumns}>
                        {/* Left Column: Interactive 4:3 Drag & Zoom Stage */}
                        <div className={styles.cropperStageCol}>
                          <div className={styles.cropperStageLabelRow}>
                            <span className={styles.cropperStageTitle}>
                              <Move size={14} /> Arrastra la foto para encuadrar el plato
                            </span>
                            <span className={styles.cropperZoomBadge}>
                              {Math.round(cropZoom * 100)}%
                            </span>
                          </div>

                          <div
                            ref={cropStageRef}
                            className={`${styles.cropStage} ${
                              isDraggingCrop ? styles.cropStageDragging : ""
                            }`}
                            onPointerDown={handleCropPointerDown}
                            onPointerMove={handleCropPointerMove}
                            onPointerUp={handleCropPointerUp}
                            onPointerCancel={handleCropPointerUp}
                          >
                            {/* Soft blurred backdrop when zoomed out below 100% */}
                            {(activeCropGeometry.wRel < 0.999 ||
                              activeCropGeometry.hRel < 0.999) && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={cropDraft.srcUrl}
                                alt=""
                                aria-hidden="true"
                                className={styles.cropAmbientBg}
                                draggable={false}
                              />
                            )}

                            {/* Positioned & scaled dish image */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cropDraft.srcUrl}
                              alt="Encuadre del plato"
                              className={styles.cropStageImg}
                              draggable={false}
                              style={{
                                width: `${activeCropGeometry.wRel * 100}%`,
                                height: `${activeCropGeometry.hRel * 100}%`,
                                left: `${activeCropGeometry.leftPct}%`,
                                top: `${activeCropGeometry.topPct}%`,
                              }}
                            />

                            {/* Rule-of-thirds visual guide grid */}
                            <div className={styles.cropGridOverlay} aria-hidden="true">
                              <div className={styles.cropGridLineV1} />
                              <div className={styles.cropGridLineV2} />
                              <div className={styles.cropGridLineH1} />
                              <div className={styles.cropGridLineH2} />
                            </div>
                          </div>

                          {/* Zoom Slider + Quick Framing Presets */}
                          <div className={styles.cropControlsBar}>
                            <div className={styles.cropZoomRow}>
                              <button
                                type="button"
                                className={styles.cropIconBtn}
                                onClick={() =>
                                  handleCropZoomChange(
                                    Math.max(activeCropGeometry.fitZoom, cropZoom - 0.1)
                                  )
                                }
                                title="Alejar"
                              >
                                <ZoomOut size={15} />
                              </button>
                              <input
                                type="range"
                                min={activeCropGeometry.fitZoom}
                                max={2.5}
                                step={0.02}
                                value={cropZoom}
                                onChange={(e) =>
                                  handleCropZoomChange(parseFloat(e.target.value))
                                }
                                className={styles.cropZoomSlider}
                                aria-label="Zoom de encuadre"
                              />
                              <button
                                type="button"
                                className={styles.cropIconBtn}
                                onClick={() =>
                                  handleCropZoomChange(Math.min(2.5, cropZoom + 0.1))
                                }
                                title="Acercar"
                              >
                                <ZoomIn size={15} />
                              </button>
                            </div>

                            <div className={styles.cropPresetsRow}>
                              <button
                                type="button"
                                className={`${styles.cropPresetBtn} ${
                                  Math.abs(cropZoom - 1) < 0.03 ? styles.cropPresetBtnActive : ""
                                }`}
                                onClick={() => {
                                  setCropZoom(1);
                                  setCropPan({ x: 0, y: 0 });
                                }}
                              >
                                Llenar 4:3
                              </button>
                              {activeCropGeometry.fitZoom < 0.98 && (
                                <button
                                  type="button"
                                  className={`${styles.cropPresetBtn} ${
                                    Math.abs(cropZoom - activeCropGeometry.fitZoom) < 0.03
                                      ? styles.cropPresetBtnActive
                                      : ""
                                  }`}
                                  onClick={() => {
                                    setCropZoom(activeCropGeometry.fitZoom);
                                    setCropPan({ x: 0, y: 0 });
                                  }}
                                >
                                  Encajar sin recortar
                                </button>
                              )}
                              <button
                                type="button"
                                className={styles.cropPresetBtn}
                                onClick={() => setCropPan({ x: 0, y: 0 })}
                              >
                                <RotateCcw size={12} /> Centrar
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Live Card Preview as seen on Public Menu */}
                        <div className={styles.cropperPreviewCol}>
                          <span className={styles.cropperStageTitle}>
                            Vista previa en la Carta Digital
                          </span>
                          <div className={styles.liveCardPreview}>
                            <div className={styles.liveCardImageBox}>
                              {(activeCropGeometry.wRel < 0.999 ||
                                activeCropGeometry.hRel < 0.999) && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={cropDraft.srcUrl}
                                  alt=""
                                  aria-hidden="true"
                                  className={styles.cropAmbientBg}
                                  draggable={false}
                                />
                              )}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={cropDraft.srcUrl}
                                alt="Vista previa en tarjeta"
                                className={styles.cropStageImg}
                                draggable={false}
                                style={{
                                  width: `${activeCropGeometry.wRel * 100}%`,
                                  height: `${activeCropGeometry.hRel * 100}%`,
                                  left: `${activeCropGeometry.leftPct}%`,
                                  top: `${activeCropGeometry.topPct}%`,
                                }}
                              />
                            </div>
                            <div className={styles.liveCardBody}>
                              <span className={styles.liveCardTitle}>
                                {name.trim() || "Nombre del plato"}
                              </span>
                              <span className={styles.liveCardDesc}>
                                {description.trim() ||
                                  "Así verán tus clientes el plato y su encuadre en la carta."}
                              </span>
                              <span className={styles.liveCardPrice}>
                                {formatCOPInput(priceValue, "$ ") || "$ 25.000"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.cropperActionsFooter}>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          <Upload size={15} /> Elegir otra foto
                        </Button>
                        <div className={styles.cropperRightBtns}>
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() => setCropDraft(null)}
                            disabled={isUploading}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={handleConfirmCropAndUpload}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 size={15} className={styles.spin} /> Subiendo...
                              </>
                            ) : (
                              <>
                                <Check size={15} /> Aplicar encuadre y subir
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : imageUrl ? (
                    <div className={styles.uploadedCardPreviewRow}>
                      <div className={styles.imagePreview}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="Vista previa 4:3" />
                      </div>
                      <div className={styles.uploadedCardActions}>
                        <span className={styles.uploadedHintText}>
                          La imagen está ajustada a la proporción <strong>4:3</strong> que ven los usuarios en las tarjetas y el detalle de tu carta digital.
                        </span>
                        <div className={styles.uploadedButtonsRow}>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => {
                              const source = rawSourceImage?.srcUrl || imageUrl;
                              const fname = rawSourceImage?.fileName || "plato.jpg";
                              openFramerWithSource(source, fname);
                            }}
                          >
                            <Crop size={15} /> Ajustar encuadre
                          </Button>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload size={15} /> Cambiar foto
                          </Button>
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() => {
                              setImageUrl("");
                              setRawSourceImage(null);
                            }}
                          >
                            <Trash2 size={15} /> Quitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={styles.uploadBox}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <Loader2 className={styles.spin} />
                      ) : (
                        <Upload color="#64748b" />
                      )}
                      <span>
                        {isUploading
                          ? "Subiendo..."
                          : "Clic para subir foto y ajustar encuadre (4:3)"}
                      </span>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            )}

            {activeTab === "modifiers" && (
              <div className={styles.modifiersSection}>
                {/* Minimalist single-line toolbar */}
                <div className={styles.modToolbar}>
                  <div className={styles.modToolbarLeft}>
                    <p className={styles.modSubtitle}>
                      Agrega grupos de opciones para este plato.
                    </p>
                  </div>
                  <div className={styles.modToolbarActions}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsReusableWindowOpen(true);
                        setIsWindowMinimized(false);
                      }}
                      className={`${styles.reusableWindowTrigger} ${
                        isReusableWindowOpen
                          ? styles.reusableWindowTriggerActive
                          : ""
                      }`}
                    >
                      <Bookmark size={14} /> Grupos Reutilizables (
                      {reusableGroups.length})
                    </button>
                    <Button
                      variant="outline"
                      onClick={addManualModifierGroup}
                      type="button"
                    >
                      <Plus size={15} /> Grupo Manual
                    </Button>
                  </div>
                </div>

                {modifierGroups.length === 0 ? (
                  <div className={styles.emptyModifiers}>
                    <p>Sin acompañantes en este plato.</p>
                    <div className={styles.addGroupButtonsRow}>
                      <Button
                        onClick={() => {
                          setIsReusableWindowOpen(true);
                          setIsWindowMinimized(false);
                        }}
                        type="button"
                      >
                        <Bookmark size={15} /> Usar / Crear Reutilizable
                      </Button>
                      <Button
                        variant="outline"
                        onClick={addManualModifierGroup}
                        type="button"
                      >
                        <Plus size={15} /> Agregar Manual
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.groupsList}>
                    {modifierGroups.map((group) => {
                      const matchedReusable = reusableGroups.find(
                        (r) =>
                          r.name.trim().toLowerCase() ===
                            group.name.trim().toLowerCase() &&
                          group.name.trim().length > 0
                      );
                      const isSavedReusable = Boolean(group.saveAsReusable);

                      if (isSavedReusable) {
                        return (
                          <div
                            key={group.id}
                            className={`${styles.groupCard} ${styles.reusableReadOnlyCard}`}
                          >
                            <div className={styles.reusableCardTopRow}>
                              <div className={styles.reusableCardTitleBlock}>
                                <div className={styles.reusableCardTitleLine}>
                                  <span className={styles.reusableCardTitle}>
                                    {group.name}
                                  </span>
                                  <span className={styles.reusableBadge}>
                                    <Bookmark size={11} /> Grupo Reutilizable
                                  </span>
                                </div>
                                <span className={styles.reusableCardMeta}>
                                  {group.isRequired ? "Obligatorio" : "Opcional"}{" "}
                                  · Mín: {group.minSelections} · Máx:{" "}
                                  {group.maxSelections} · {group.options.length}{" "}
                                  {group.options.length === 1
                                    ? "opción"
                                    : "opciones"}
                                </span>
                              </div>

                              <div className={styles.reusableListActions}>
                                <button
                                  type="button"
                                  className={styles.reusableEditLinkBtn}
                                  onClick={() => {
                                    const target = matchedReusable || group;
                                    setIsReusableWindowOpen(true);
                                    setIsWindowMinimized(false);
                                    setEditingReusable({
                                      ...target,
                                      previousName: target.name,
                                      options: target.options.map((o) => ({
                                        ...o,
                                      })),
                                    });
                                  }}
                                  title="Editar en el apartado de Acompañantes Reutilizables"
                                >
                                  <Pencil size={13} /> Editar en Acompañantes
                                </button>
                                <button
                                  className={styles.iconBtnDanger}
                                  onClick={() => deleteGroup(group.id)}
                                  title="Quitar acompañante de este plato"
                                  type="button"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div className={styles.reusableOptionsGrid}>
                              {group.options.map((opt) => (
                                <div
                                  key={opt.id}
                                  className={styles.reusableOptionPill}
                                >
                                  <span
                                    className={styles.reusableOptionPillName}
                                  >
                                    {opt.name}
                                  </span>
                                  <span
                                    className={styles.reusableOptionPillPrice}
                                  >
                                    {opt.priceExtra > 0
                                      ? formatCOPInput(opt.priceExtra, "+ $ ")
                                      : "Gratis"}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <p className={styles.reusableLockedNotice}>
                              Los grupos reutilizables solo se modifican desde el
                              apartado de Acompañantes para actualizar todos los
                              platos por igual.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div key={group.id} className={styles.groupCard}>
                          <div className={styles.groupHeader}>
                            <div className={styles.groupHeaderRow}>
                              <Input
                                value={group.name}
                                onChange={(e) =>
                                  updateGroup(group.id, "name", e.target.value)
                                }
                                placeholder="Nombre del grupo manual (Ej. Término de la carne)"
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={() => handleBookmarkGroup(group)}
                                disabled={savingReusableId === group.id}
                                title="Guardar como acompañante reutilizable"
                              >
                                {savingReusableId === group.id ? (
                                  <Loader2 size={16} className={styles.spin} />
                                ) : (
                                  <Bookmark size={16} />
                                )}
                              </button>
                              <button
                                className={styles.iconBtnDanger}
                                onClick={() => deleteGroup(group.id)}
                                title="Quitar grupo del plato"
                                type="button"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className={styles.groupSettingsRow}>
                              <label className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={group.isRequired}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    updateGroup(
                                      group.id,
                                      "isRequired",
                                      checked
                                    );
                                    if (checked && group.minSelections === 0) {
                                      updateGroup(
                                        group.id,
                                        "minSelections",
                                        1
                                      );
                                    }
                                  }}
                                />
                                Obligatorio
                              </label>
                              <label className={styles.numberLabel}>
                                Mín
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="0"
                                  value={getDraftValue(
                                    group.id,
                                    "minSelections",
                                    group.minSelections
                                  )}
                                  onFocus={(e) => e.currentTarget.select()}
                                  onChange={(e) =>
                                    handleSelectionChange(
                                      group.id,
                                      "minSelections",
                                      e.target.value
                                    )
                                  }
                                  onBlur={() =>
                                    handleSelectionBlur(
                                      group.id,
                                      "minSelections"
                                    )
                                  }
                                  style={{ width: "58px" }}
                                />
                              </label>
                              <label className={styles.numberLabel}>
                                Máx
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="1"
                                  value={getDraftValue(
                                    group.id,
                                    "maxSelections",
                                    group.maxSelections
                                  )}
                                  onFocus={(e) => e.currentTarget.select()}
                                  onChange={(e) =>
                                    handleSelectionChange(
                                      group.id,
                                      "maxSelections",
                                      e.target.value
                                    )
                                  }
                                  onBlur={() =>
                                    handleSelectionBlur(
                                      group.id,
                                      "maxSelections"
                                    )
                                  }
                                  style={{ width: "58px" }}
                                />
                              </label>
                            </div>
                          </div>

                          <div className={styles.optionsList}>
                            {group.options.map((opt, oIdx) => (
                              <div key={opt.id} className={styles.optionRow}>
                                <Input
                                  value={opt.name}
                                  onChange={(e) =>
                                    updateOption(
                                      group.id,
                                      opt.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Opción ${oIdx + 1} (Ej. Término 3/4)`}
                                  style={{ flex: 1 }}
                                />
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatCOPInput(opt.priceExtra, "+ $ ")}
                                  onChange={(e) =>
                                    updateOption(
                                      group.id,
                                      opt.id,
                                      "priceExtra",
                                      parseCOPInput(e.target.value)
                                    )
                                  }
                                  placeholder="+ $ 0 (Gratis)"
                                  style={{ width: "140px" }}
                                />
                                <button
                                  className={styles.iconBtnDanger}
                                  onClick={() => deleteOption(group.id, opt.id)}
                                  type="button"
                                  title="Eliminar opción"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              className={styles.addOptionLink}
                              onClick={() => addOption(group.id)}
                            >
                              <Plus size={14} /> Añadir opción
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              type="button"
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isPending} type="button">
              {isPending && <Loader2 size={16} className={styles.spin} />}{" "}
              Guardar Plato
            </Button>
          </div>
        </div>
      </Modal>

      {/* Secondary Draggable Window for Reusable Modifier Groups */}
      {isReusableWindowOpen && (
        <div
          className={styles.floatingWindow}
          style={{
            left: `${windowPos.x}px`,
            top: `${windowPos.y}px`,
          }}
        >
          <div
            className={styles.floatingWindowHeader}
            onMouseDown={startDraggingWindow}
          >
            <div className={styles.floatingWindowTitleGroup}>
              {editingReusable ? (
                <button
                  type="button"
                  className={styles.floatingWindowControlBtn}
                  onClick={() => setEditingReusable(null)}
                  title="Volver a la lista"
                >
                  <ArrowLeft size={14} />
                </button>
              ) : (
                <GripHorizontal size={15} color="#94a3b8" />
              )}
              <span>
                {editingReusable
                  ? editingReusable.name
                    ? `Editar: ${editingReusable.name}`
                    : "Nuevo Grupo Reutilizable"
                  : "Grupos Reutilizables"}
              </span>
            </div>
            <div className={styles.floatingWindowControls}>
              <button
                type="button"
                className={styles.floatingWindowControlBtn}
                onClick={() => setIsWindowMinimized(!isWindowMinimized)}
                title={isWindowMinimized ? "Expandir" : "Minimizar"}
              >
                {isWindowMinimized ? (
                  <Maximize2 size={13} />
                ) : (
                  <Minus size={14} />
                )}
              </button>
              <button
                type="button"
                className={styles.floatingWindowControlBtn}
                onClick={() => {
                  setIsReusableWindowOpen(false);
                  setEditingReusable(null);
                }}
                title="Cerrar ventana"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!isWindowMinimized && (
            <>
              <div className={styles.floatingWindowBody}>
                {!editingReusable ? (
                  reusableGroups.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "24px 12px",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      Aún no tienes grupos reutilizables (ej. Bebidas).
                    </div>
                  ) : (
                    reusableGroups.map((tpl) => {
                      const isAdded = modifierGroups.some(
                        (g) =>
                          g.name.trim().toLowerCase() ===
                          tpl.name.trim().toLowerCase()
                      );
                      return (
                        <div key={tpl.id} className={styles.reusableListRow}>
                          <div className={styles.reusableListInfo}>
                            <span className={styles.reusableListName}>
                              {tpl.name}
                            </span>
                            <span className={styles.reusableListSub}>
                              {tpl.options.length}{" "}
                              {tpl.options.length === 1 ? "opción" : "opciones"}{" "}
                              · {tpl.isRequired ? "Obligatorio" : "Opcional"}
                            </span>
                          </div>
                          <div className={styles.reusableListActions}>
                            <button
                              type="button"
                              disabled={isAdded}
                              onClick={() => applyReusableGroup(tpl)}
                              className={`${styles.useGroupBtn} ${
                                isAdded ? styles.useGroupBtnAdded : ""
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check size={12} /> En plato
                                </>
                              ) : (
                                <>
                                  <Plus size={12} /> Usar
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              onClick={() =>
                                setEditingReusable({
                                  ...tpl,
                                  previousName: tpl.name,
                                  options: tpl.options.map((o) => ({ ...o })),
                                })
                              }
                              title="Editar grupo"
                            >
                              <Pencil size={14} />
                            </button>
                            {!tpl.id.startsWith("derived-") &&
                              onDeleteReusableGroup && (
                                <button
                                  type="button"
                                  className={styles.iconBtnDanger}
                                  onClick={() =>
                                    handleDeleteReusableTemplate(tpl)
                                  }
                                  title="Eliminar de la biblioteca"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  /* Minimalist Form inside Floating Window */
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <Input
                      value={editingReusable.name}
                      onChange={(e) =>
                        setEditingReusable({
                          ...editingReusable,
                          name: e.target.value,
                        })
                      }
                      placeholder="Nombre (Ej. Bebidas)"
                    />
                    <div className={styles.groupSettingsRow}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={editingReusable.isRequired}
                          onChange={(e) =>
                            setEditingReusable({
                              ...editingReusable,
                              isRequired: e.target.checked,
                              minSelections:
                                e.target.checked &&
                                editingReusable.minSelections === 0
                                  ? 1
                                  : editingReusable.minSelections,
                            })
                          }
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
                            editingReusable.minSelections === 0
                              ? ""
                              : String(editingReusable.minSelections)
                          }
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => {
                            const d = e.target.value.replace(/\D/g, "");
                            setEditingReusable({
                              ...editingReusable,
                              minSelections: d ? parseInt(d, 10) : 0,
                            });
                          }}
                          style={{ width: "54px" }}
                        />
                      </label>
                      <label className={styles.numberLabel}>
                        Máx
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="1"
                          value={String(editingReusable.maxSelections)}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => {
                            const d = e.target.value.replace(/\D/g, "");
                            setEditingReusable({
                              ...editingReusable,
                              maxSelections: d ? parseInt(d, 10) : 1,
                            });
                          }}
                          style={{ width: "54px" }}
                        />
                      </label>
                    </div>

                    <div className={styles.optionsList}>
                      {editingReusable.options.map((opt, idx) => (
                        <div key={opt.id} className={styles.optionRow}>
                          <Input
                            value={opt.name}
                            onChange={(e) =>
                              setEditingReusable({
                                ...editingReusable,
                                options: editingReusable.options.map((o) =>
                                  o.id === opt.id
                                    ? { ...o, name: e.target.value }
                                    : o
                                ),
                              })
                            }
                            placeholder={`Opción ${idx + 1} (Ej. Coca-Cola)`}
                            style={{ flex: 1 }}
                          />
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={formatCOPInput(opt.priceExtra, "+ $ ")}
                            onChange={(e) =>
                              setEditingReusable({
                                ...editingReusable,
                                options: editingReusable.options.map((o) =>
                                  o.id === opt.id
                                    ? {
                                        ...o,
                                        priceExtra: parseCOPInput(
                                          e.target.value
                                        ),
                                      }
                                    : o
                                ),
                              })
                            }
                            placeholder="+ $ 0 (Gratis)"
                            style={{ width: "125px" }}
                          />
                          <button
                            type="button"
                            className={styles.iconBtnDanger}
                            onClick={() =>
                              setEditingReusable({
                                ...editingReusable,
                                options: editingReusable.options.filter(
                                  (o) => o.id !== opt.id
                                ),
                              })
                            }
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className={styles.addOptionLink}
                        onClick={() =>
                          setEditingReusable({
                            ...editingReusable,
                            options: [
                              ...editingReusable.options,
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
                      >
                        <Plus size={14} /> Añadir opción
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.floatingWindowFooter}>
                {!editingReusable ? (
                  <Button
                    onClick={startNewReusableInWindow}
                    type="button"
                    style={{ width: "100%" }}
                  >
                    <Plus size={15} /> Nuevo Grupo Reutilizable
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleSaveReusableFromWindow(false)}
                      disabled={isSavingWindowGroup}
                      type="button"
                    >
                      Guardar
                    </Button>
                    <Button
                      onClick={() => handleSaveReusableFromWindow(true)}
                      disabled={isSavingWindowGroup}
                      type="button"
                    >
                      {isSavingWindowGroup && (
                        <Loader2 size={14} className={styles.spin} />
                      )}{" "}
                      Guardar y usar en plato
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}


