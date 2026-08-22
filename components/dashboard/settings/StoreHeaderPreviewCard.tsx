"use client";

import React, { useState, useRef, useTransition } from "react";
import {
  Camera,
  Pencil,
  X,
  Check,
  Loader2,
  Phone,
  MapPin,
  Clock,
  Globe,
  Upload,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { updateLocalDataAction, updateCommercialProfileAction } from "@/app/actions/settings";
import { uploadImageAction } from "@/app/actions/storage";
import { Input, Textarea } from "@/components/ui/Input";
import styles from "./StoreHeaderPreviewCard.module.css";

const PRESET_COLORS = [
  "#FF6B35", "#2563EB", "#10B981", "#8B5CF6", "#EC4899",
  "#F59E0B", "#14B8A6", "#3B82F6", "#F43F5E", "#111827"
];

interface BusinessHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

interface StoreHeaderPreviewCardProps {
  tenantId: string;
  name: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  brandColor: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  websiteUrl: string | null;
  businessHours?: BusinessHour[];
}

export function StoreHeaderPreviewCard({
  name: initialName,
  description: initialDescription,
  phone: initialPhone,
  address: initialAddress,
  city: initialCity,
  logoUrl: initialLogoUrl,
  coverUrl: initialCoverUrl,
  brandColor: initialBrandColor,
  instagramUrl: initialInstagram,
  facebookUrl: initialFacebook,
  tiktokUrl: initialTiktok,
  websiteUrl: initialWebsite,
  businessHours = [],
}: StoreHeaderPreviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Live draft state for instant real-time preview reflecting client menu
  const [draft, setDraft] = useState({
    name: initialName,
    description: initialDescription ?? "",
    phone: initialPhone ?? "",
    address: initialAddress ?? "",
    city: initialCity ?? "",
    logoUrl: initialLogoUrl ?? "",
    coverUrl: initialCoverUrl ?? "",
    brandColor: initialBrandColor ?? "#FF6B35",
    instagramUrl: initialInstagram ?? "",
    facebookUrl: initialFacebook ?? "",
    tiktokUrl: initialTiktok ?? "",
    websiteUrl: initialWebsite ?? "",
  });

  // Saved baseline state
  const [savedState, setSavedState] = useState({ ...draft });

  function handleCancelModal() {
    setDraft({ ...savedState });
    setIsEditing(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: "logos" | "covers") {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo no debe superar los 5MB");
      return;
    }

    const setUploading = type === "logos" ? setIsUploadingLogo : setIsUploadingCover;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadImageAction(formData, type);

    if (res.publicUrl) {
      const updatedUrl = res.publicUrl;
      const newLogoUrl = type === "logos" ? updatedUrl : draft.logoUrl;
      const newCoverUrl = type === "covers" ? updatedUrl : draft.coverUrl;

      // Update draft state immediately for UI
      setDraft((prev) => ({
        ...prev,
        [type === "logos" ? "logoUrl" : "coverUrl"]: updatedUrl,
      }));

      // AUTO-SAVE to DB immediately if outside modal
      if (!isEditing) {
        const fdProfile = new FormData();
        fdProfile.append("logoUrl", newLogoUrl);
        fdProfile.append("coverUrl", newCoverUrl);
        fdProfile.append("brandColor", draft.brandColor);
        fdProfile.append("instagramUrl", draft.instagramUrl);
        fdProfile.append("facebookUrl", draft.facebookUrl);
        fdProfile.append("tiktokUrl", draft.tiktokUrl);
        fdProfile.append("websiteUrl", draft.websiteUrl);

        const saveRes = await updateCommercialProfileAction(fdProfile);
        setUploading(false);

        if (saveRes.success) {
          setSavedState((prev) => ({
            ...prev,
            [type === "logos" ? "logoUrl" : "coverUrl"]: updatedUrl,
          }));
          toast.success(
            type === "logos"
              ? "¡Logo actualizado correctamente!"
              : "¡Portada actualizada correctamente!"
          );
        } else {
          toast.error(saveRes.message || "No se pudo actualizar la imagen en la base de datos");
        }
      } else {
        setUploading(false);
        toast.success(
          type === "logos"
            ? "Logo cargado. Guarda los cambios para aplicar."
            : "Portada cargada. Guarda los cambios para aplicar."
        );
      }
    } else {
      setUploading(false);
      toast.error(res.error || "No se pudo subir la imagen");
    }

    // Reset input value so re-selecting triggers onChange
    e.target.value = "";
  }

  function handleSaveAll(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      // 1. Update Local Data (Name, Description, Phone, Address, City)
      const fdLocal = new FormData();
      fdLocal.append("name", draft.name);
      fdLocal.append("description", draft.description);
      fdLocal.append("phone", draft.phone);
      fdLocal.append("address", draft.address);
      fdLocal.append("city", draft.city);

      const resLocal = await updateLocalDataAction(fdLocal);
      if (!resLocal.success) {
        toast.error(resLocal.message);
        return;
      }

      // 2. Update Commercial Profile (Logo, Cover, BrandColor, Social Links)
      const fdProfile = new FormData();
      fdProfile.append("logoUrl", draft.logoUrl);
      fdProfile.append("coverUrl", draft.coverUrl);
      fdProfile.append("brandColor", draft.brandColor);
      fdProfile.append("instagramUrl", draft.instagramUrl);
      fdProfile.append("facebookUrl", draft.facebookUrl);
      fdProfile.append("tiktokUrl", draft.tiktokUrl);
      fdProfile.append("websiteUrl", draft.websiteUrl);

      const resProfile = await updateCommercialProfileAction(fdProfile);
      if (resProfile.success) {
        setSavedState({ ...draft });
        toast.success("¡Perfil comercial y datos del local actualizados correctamente!", {
          description: "Tus clientes ya ven estos cambios en tu carta digital.",
          duration: 4000,
        });
        setIsEditing(false);
      } else {
        toast.error(resProfile.message);
      }
    });
  }

  // Calculate live today status
  const getTodayStatus = () => {
    if (!businessHours.length) return { isOpen: false, text: "Sin horarios configurados" };

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon ...
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const todayHours = businessHours.filter((h) => h.dayOfWeek === currentDay);
    if (!todayHours.length) return { isOpen: false, text: "Cerrado hoy" };

    for (const h of todayHours) {
      const [openH, openM] = h.openTime.split(":").map(Number);
      const [closeH, closeM] = h.closeTime.split(":").map(Number);
      const openMin = openH * 60 + (openM || 0);
      let closeMin = closeH * 60 + (closeM || 0);
      if (closeMin < openMin) closeMin += 1440;

      if (currentMinutes >= openMin && currentMinutes <= closeMin) {
        return {
          isOpen: true,
          text: `Abierto hoy (${h.openTime} - ${h.closeTime})`,
        };
      }
    }

    const firstShift = todayHours[0];
    return {
      isOpen: false,
      text: `Cerrado hoy (Abre ${firstShift.openTime})`,
    };
  };

  const todayStatus = getTodayStatus();

  return (
    <div className={styles.card}>
      {/* Hidden File Inputs for quick upload */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={(e) => handleImageUpload(e, "logos")}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={(e) => handleImageUpload(e, "covers")}
      />

      {/* ── 1. Facebook Style Hero Cover Banner ─────────────────────── */}
      <div
        className={styles.coverContainer}
        style={{
          backgroundImage: draft.coverUrl
            ? `url(${draft.coverUrl})`
            : `linear-gradient(135deg, ${draft.brandColor} 0%, #0F172A 100%)`,
        }}
        onClick={() => coverInputRef.current?.click()}
        title="Haz clic para cambiar la portada"
      >
        <div className={styles.coverOverlay} />

        {/* Hover Action Overlay on Cover Banner */}
        <div className={styles.coverHoverOverlay}>
          {isUploadingCover ? (
            <Loader2 size={24} className={styles.spin} />
          ) : (
            <>
              <Camera size={22} />
              <span>{draft.coverUrl ? "Cambiar Portada" : "Subir Portada"}</span>
            </>
          )}
        </div>
      </div>

      {/* ── 2. Store Front Header Body ─────────────────────────────── */}
      <div className={styles.bodyContent}>
        {/* ── Avatar Logo Overlapping Cover with Hover Upload Action ── */}
        <div className={styles.avatarWrapper}>
          <div
            className={styles.avatarBox}
            onClick={() => logoInputRef.current?.click()}
            title="Haz clic para subir un logo nuevo"
          >
            {draft.logoUrl ? (
              <img src={draft.logoUrl} alt={draft.name} className={styles.avatarImg} />
            ) : (
              <div
                className={styles.avatarPlaceholder}
                style={{ backgroundColor: draft.brandColor }}
              >
                {draft.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Hover Action Overlay */}
            <div className={styles.avatarHoverOverlay}>
              {isUploadingLogo ? (
                <Loader2 size={20} className={styles.spin} />
              ) : (
                <>
                  <Camera size={18} />
                  <span>Cambiar</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerMetaRow}>
          <div className={styles.titleArea}>
            <div className={styles.nameRow}>
              <h1 className={styles.storeName}>{draft.name}</h1>
              <span
                className={styles.colorBadge}
                style={{ backgroundColor: draft.brandColor }}
                title="Color Principal de la Carta"
              >
                <Sparkles size={11} /> {draft.brandColor.toUpperCase()}
              </span>
            </div>

            <p className={styles.description}>
              {draft.description || "Agrega una breve descripción o eslogan de tu establecimiento."}
            </p>
          </div>

          <button
            type="button"
            className={styles.editProfileBtn}
            onClick={() => setIsEditing(true)}
          >
            <Pencil size={15} />
            <span>Editar Perfil y Datos</span>
          </button>
        </div>

        {/* ── 4. Badges & Info Pills Row (Phone, Address, Hours Preview) ── */}
        <div className={styles.pillsRow}>
          {draft.phone && (
            <div className={styles.pill}>
              <Phone size={14} className={styles.pillIcon} />
              <span>{draft.phone}</span>
            </div>
          )}

          {(draft.address || draft.city) && (
            <div className={styles.pill}>
              <MapPin size={14} className={styles.pillIcon} />
              <span>
                {[draft.address, draft.city].filter(Boolean).join(", ")}
              </span>
            </div>
          )}

          <div
            className={`${styles.pill} ${
              todayStatus.isOpen ? styles.statusOpen : styles.statusClosed
            }`}
          >
            <Clock size={14} />
            <span>{todayStatus.text}</span>
          </div>
        </div>

        {/* ── 5. Social Links Bar ──────────────────────────────────── */}
        <div className={styles.socialBar}>
          {draft.instagramUrl && (
            <a
              href={draft.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>Instagram</span>
            </a>
          )}
          {draft.facebookUrl && (
            <a
              href={draft.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
              <span>Facebook</span>
            </a>
          )}
          {draft.tiktokUrl && (
            <a
              href={draft.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
            >
              <Globe size={14} />
              <span>TikTok</span>
            </a>
          )}
          {draft.websiteUrl && (
            <a
              href={draft.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
            >
              <Globe size={14} />
              <span>Sitio Web</span>
            </a>
          )}
        </div>
      </div>

      {/* ── 6. Unified Edit Modal ────────────────────────────────────── */}
      {isEditing && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Editar Perfil Comercial y Datos del Local</h3>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={handleCancelModal}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAll}>
              <div className={styles.modalBody}>
                {/* Section 1: Basic Information */}
                <div className={styles.sectionGroup}>
                  <span className={styles.sectionTitle}>Datos del Local</span>
                  <div className={styles.formGrid}>
                    <Input
                      label="Nombre Comercial"
                      name="name"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      placeholder="Ej. Papas Don Carlos"
                      required
                    />
                    <Input
                      label="Teléfono de Contacto / WhatsApp"
                      name="phone"
                      value={draft.phone}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                      placeholder="Ej. 3193035676"
                    />
                  </div>

                  <Textarea
                    label="Descripción / Eslogan"
                    name="description"
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="Ej. Las mejores papas crujientes y artesanales desde 1995"
                    rows={2}
                  />

                  <div className={styles.formGrid}>
                    <Input
                      label="Dirección"
                      name="address"
                      value={draft.address}
                      onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                      placeholder="Ej. CRA 56B #42 - 29"
                    />
                    <Input
                      label="Ciudad"
                      name="city"
                      value={draft.city}
                      onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                      placeholder="Ej. Medellín"
                    />
                  </div>
                </div>

                {/* Section 2: Visual Brand & Color */}
                <div className={styles.sectionGroup}>
                  <span className={styles.sectionTitle}>Identidad Visual & Color de Marca</span>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Color Principal de la Carta Digital</label>
                    <div className={styles.colorPresetsRow}>
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`${styles.colorSwatch} ${
                            draft.brandColor.toLowerCase() === color.toLowerCase()
                              ? styles.colorSwatchActive
                              : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setDraft({ ...draft, brandColor: color })}
                        />
                      ))}

                      <div className={styles.customColorPicker} title="Color Personalizado">
                        <input
                          type="color"
                          value={draft.brandColor}
                          onChange={(e) => setDraft({ ...draft, brandColor: e.target.value })}
                          className={styles.customColorInput}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Social Media Links */}
                <div className={styles.sectionGroup}>
                  <span className={styles.sectionTitle}>Redes Sociales</span>
                  <div className={styles.formGrid}>
                    <Input
                      label="Instagram URL"
                      name="instagramUrl"
                      value={draft.instagramUrl}
                      onChange={(e) => setDraft({ ...draft, instagramUrl: e.target.value })}
                      placeholder="https://instagram.com/tu-restaurante"
                    />
                    <Input
                      label="Facebook URL"
                      name="facebookUrl"
                      value={draft.facebookUrl}
                      onChange={(e) => setDraft({ ...draft, facebookUrl: e.target.value })}
                      placeholder="https://facebook.com/tu-restaurante"
                    />
                  </div>

                  <div className={styles.formGrid}>
                    <Input
                      label="TikTok URL"
                      name="tiktokUrl"
                      value={draft.tiktokUrl}
                      onChange={(e) => setDraft({ ...draft, tiktokUrl: e.target.value })}
                      placeholder="https://tiktok.com/@tu-restaurante"
                    />
                    <Input
                      label="Sitio Web"
                      name="websiteUrl"
                      value={draft.websiteUrl}
                      onChange={(e) => setDraft({ ...draft, websiteUrl: e.target.value })}
                      placeholder="https://tu-sitio.com"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={handleCancelModal}
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.modalSaveBtn}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className={styles.spin} />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
