"use client";

import React, { useState, useRef, useTransition } from "react";
import {
  Camera,
  Check,
  Loader2,
  Phone,
  MapPin,
  Building2,
  Clock,
  Globe,
  Sparkles,
  RotateCcw,
  Pencil,
  X,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { updateLocalDataAction, updateCommercialProfileAction } from "@/app/actions/settings";
import { uploadImageAction } from "@/app/actions/storage";
import styles from "./StoreHeaderPreviewCard.module.css";

const PRESET_COLORS = [
  "#FF6B35", "#2563EB", "#10B981", "#8B5CF6", "#EC4899",
  "#F59E0B", "#14B8A6", "#3B82F6", "#F43F5E", "#111827"
];

type SocialKey = "instagramUrl" | "facebookUrl" | "tiktokUrl" | "websiteUrl";

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
  const [isPending, startTransition] = useTransition();

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [logoSuccessRing, setLogoSuccessRing] = useState(false);
  const [coverSuccessRing, setCoverSuccessRing] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // In-place inline edit state
  const [editingField, setEditingField] = useState<"name" | "description" | "phone" | "address" | "city" | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Social link modal state
  const [activeSocialModal, setActiveSocialModal] = useState<SocialKey | null>(null);
  const [tempSocialUrl, setTempSocialUrl] = useState("");

  // Live draft state
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

  const [savedState, setSavedState] = useState({ ...draft });
  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(savedState);

  function handleResetChanges() {
    setDraft({ ...savedState });
    setEditingField(null);
    setShowColorPicker(false);
    toast.info("Cambios descartados");
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

      setDraft((prev) => ({
        ...prev,
        [type === "logos" ? "logoUrl" : "coverUrl"]: updatedUrl,
      }));

      // AUTO-SAVE image to DB immediately
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

        if (type === "logos") {
          setLogoSuccessRing(true);
          setTimeout(() => setLogoSuccessRing(false), 2500);
        } else {
          setCoverSuccessRing(true);
          setTimeout(() => setCoverSuccessRing(false), 2500);
        }

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
      toast.error(res.error || "No se pudo subir la imagen");
    }

    e.target.value = "";
  }

  function handleSaveAll(e?: React.FormEvent) {
    if (e) e.preventDefault();

    startTransition(async () => {
      // 1. Update Local Data
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

      // 2. Update Commercial Profile
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
        toast.success("¡Datos del restaurante guardados correctamente!", {
          description: "Tus clientes ya ven estos cambios en tu carta digital.",
          duration: 4000,
        });
      } else {
        toast.error(resProfile.message);
      }
    });
  }

  // Open social link modal
  function openSocialModal(key: SocialKey) {
    setActiveSocialModal(key);
    setTempSocialUrl(draft[key] || "");
  }

  function saveSocialModal() {
    if (!activeSocialModal) return;
    setDraft((prev) => ({
      ...prev,
      [activeSocialModal]: tempSocialUrl.trim(),
    }));
    setActiveSocialModal(null);
    toast.success("Enlace actualizado");
  }

  function clearSocialModal() {
    if (!activeSocialModal) return;
    setDraft((prev) => ({
      ...prev,
      [activeSocialModal]: "",
    }));
    setActiveSocialModal(null);
    toast.info("Enlace eliminado");
  }

  // Social link helpers
  const getSocialMeta = (key: SocialKey) => {
    switch (key) {
      case "instagramUrl":
        return { name: "Instagram", placeholder: "https://instagram.com/tu-restaurante" };
      case "facebookUrl":
        return { name: "Facebook", placeholder: "https://facebook.com/tu-restaurante" };
      case "tiktokUrl":
        return { name: "TikTok", placeholder: "https://tiktok.com/@tu-restaurante" };
      case "websiteUrl":
        return { name: "Sitio Web", placeholder: "https://tu-sitio-web.com" };
    }
  };

  // Calculate live today status
  const getTodayStatus = () => {
    if (!businessHours.length) return { isOpen: false, text: "Sin horarios configurados" };

    const now = new Date();
    const currentDay = now.getDay();
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
      {/* Hidden File Inputs */}
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

      {/* ── 1. Store Header Live Preview Banner ─────────────────────── */}
      <div className={styles.previewContainer}>
        <div className={styles.previewBadge}>
          <Sparkles size={13} />
          <span>Vista previa</span>
        </div>

        {/* Cover Hero Banner */}
        <div
          className={styles.coverContainer}
          style={{
            backgroundImage: draft.coverUrl
              ? `url(${draft.coverUrl})`
              : `linear-gradient(135deg, ${draft.brandColor} 0%, #0F172A 100%)`,
          }}
          onClick={() => coverInputRef.current?.click()}
          title="Haz clic para cambiar la foto de portada"
        >
          {(isUploadingCover || coverSuccessRing) && (
            <div
              className={`${styles.coverProgressBar} ${
                coverSuccessRing ? styles.coverProgressBarDone : ""
              }`}
            />
          )}

          <div className={styles.coverOverlay} />

          <div
            className={`${styles.coverHoverOverlay} ${
              isUploadingCover ? styles.coverHoverOverlayActive : ""
            }`}
          >
            {isUploadingCover ? (
              <>
                <Loader2 size={28} className={styles.spin} />
                <span>Subiendo portada...</span>
              </>
            ) : (
              <>
                <Camera size={22} />
                <span>{draft.coverUrl ? "Cambiar Portada" : "Subir Portada"}</span>
              </>
            )}
          </div>
        </div>

        {/* Store Front Header Body */}
        <div className={styles.bodyContent}>
          {/* Avatar Logo Overlapping Cover */}
          <div className={styles.avatarWrapper}>
            <div
              className={`${styles.avatarBox} ${
                isUploadingLogo ? styles.avatarBoxUploading : ""
              } ${logoSuccessRing ? styles.avatarBoxSuccess : ""}`}
              onClick={() => logoInputRef.current?.click()}
              title="Haz clic para cambiar el logo"
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

              <div
                className={`${styles.avatarHoverOverlay} ${
                  isUploadingLogo ? styles.avatarHoverOverlayActive : ""
                }`}
              >
                {isUploadingLogo ? (
                  <>
                    <Loader2 size={22} className={styles.spin} />
                    <span style={{ fontSize: "10px", marginTop: "2px" }}>Subiendo...</span>
                  </>
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
                {/* Store Name - In-Place Editable Field */}
                {editingField === "name" ? (
                  <input
                    type="text"
                    className={styles.inPlaceNameInput}
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                    autoFocus
                    placeholder="Nombre del restaurante"
                  />
                ) : (
                  <div
                    className={styles.interactiveName}
                    onClick={() => setEditingField("name")}
                    title="Haz clic para editar el nombre"
                  >
                    <h1 className={styles.storeName}>{draft.name || "Nombre de tu negocio"}</h1>
                    <Pencil size={14} className={styles.hoverPencilIcon} />
                  </div>
                )}

                {/* Color Badge & Inline Preset Popover */}
                <div style={{ position: "relative" }}>
                  <div
                    className={styles.colorBadge}
                    style={{ backgroundColor: draft.brandColor }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    title="Haz clic para cambiar el color de marca"
                  >
                    <Sparkles size={11} /> {draft.brandColor.toUpperCase()}
                    <Pencil size={10} className={styles.hoverPencilIcon} style={{ opacity: 0.9 }} />
                  </div>

                  {showColorPicker && (
                    <div className={styles.colorPopover}>
                      <span className={styles.colorPopoverTitle}>Elige el color principal:</span>
                      <div className={styles.colorPresetsGrid}>
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
                            onClick={() => {
                              setDraft({ ...draft, brandColor: color });
                              setShowColorPicker(false);
                            }}
                          />
                        ))}
                        <div className={styles.customColorPicker} title="Color personalizado">
                          <input
                            type="color"
                            value={draft.brandColor}
                            onChange={(e) => setDraft({ ...draft, brandColor: e.target.value })}
                            className={styles.customColorInput}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Store Description - In-Place Editable Field */}
              {editingField === "description" ? (
                <textarea
                  className={styles.inPlaceDescInput}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  onBlur={() => setEditingField(null)}
                  rows={2}
                  autoFocus
                  placeholder="Escribe el eslogan o descripción..."
                />
              ) : (
                <div
                  className={styles.interactiveDesc}
                  onClick={() => setEditingField("description")}
                  title="Haz clic para editar la descripción"
                >
                  <p className={styles.description}>
                    {draft.description || "Haz clic aquí para agregar la descripción o eslogan..."}
                  </p>
                  <Pencil size={12} className={styles.hoverPencilIcon} />
                </div>
              )}
            </div>
          </div>

          {/* Badges & Info Pills Row (Phone, Address & City Separated into Distinct Pills) */}
          <div className={styles.pillsRow}>
            {/* Phone Pill In-Place Edit */}
            {editingField === "phone" ? (
              <div className={`${styles.pill} ${styles.pillEditing}`}>
                <Phone size={14} className={styles.pillIcon} />
                <input
                  type="text"
                  className={styles.inPlacePillInput}
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  onBlur={() => setEditingField(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                  placeholder="Teléfono / WhatsApp"
                  autoFocus
                />
              </div>
            ) : (
              <div
                className={`${styles.pill} ${styles.interactivePill}`}
                onClick={() => setEditingField("phone")}
                title="Haz clic para editar el teléfono"
              >
                <Phone size={14} className={styles.pillIcon} />
                <span>{draft.phone ? `Tel: ${draft.phone}` : "+ Agregar teléfono"}</span>
                <Pencil size={11} className={styles.hoverPencilIcon} />
              </div>
            )}

            {/* Address Pill (Dirección Física Separada) */}
            {editingField === "address" ? (
              <div className={`${styles.pill} ${styles.pillEditingAddress}`}>
                <MapPin size={14} className={styles.pillIcon} />
                <span className={styles.fieldTagLabel}>Dirección:</span>
                <input
                  type="text"
                  className={styles.inPlacePillInputLarge}
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                  onBlur={() => setEditingField(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                  placeholder="Dirección física (ej. Cra 56B # 42 - 29)"
                  autoFocus
                />
              </div>
            ) : (
              <div
                className={`${styles.pill} ${styles.interactivePill}`}
                onClick={() => setEditingField("address")}
                title="Haz clic para editar la dirección física"
              >
                <MapPin size={14} className={styles.pillIcon} />
                <span>{draft.address ? `Dirección: ${draft.address}` : "+ Agregar dirección física"}</span>
                <Pencil size={11} className={styles.hoverPencilIcon} />
              </div>
            )}

            {/* City Pill (Ciudad Separada) */}
            {editingField === "city" ? (
              <div className={`${styles.pill} ${styles.pillEditingCity}`}>
                <Building2 size={14} className={styles.pillIcon} />
                <span className={styles.fieldTagLabel}>Ciudad:</span>
                <input
                  type="text"
                  className={styles.inPlacePillInputMedium}
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  onBlur={() => setEditingField(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                  placeholder="Ciudad (ej. Bogotá / Medellín)"
                  autoFocus
                />
              </div>
            ) : (
              <div
                className={`${styles.pill} ${styles.interactivePill}`}
                onClick={() => setEditingField("city")}
                title="Haz clic para editar la ciudad"
              >
                <Building2 size={14} className={styles.pillIcon} />
                <span>{draft.city ? `Ciudad: ${draft.city}` : "+ Agregar ciudad"}</span>
                <Pencil size={11} className={styles.hoverPencilIcon} />
              </div>
            )}

            {/* Today Open Status */}
            <div
              className={`${styles.pill} ${
                todayStatus.isOpen ? styles.statusOpen : styles.statusClosed
              }`}
            >
              <Clock size={14} />
              <span>{todayStatus.text}</span>
            </div>
          </div>

          {/* ── 4 Social Link Buttons (Click Opens Dedicated Modal) ────────── */}
          <div className={styles.socialBarHeader}>
            <span className={styles.socialBarLabel}>Redes Sociales (Haz clic para poner el enlace):</span>
          </div>

          <div className={styles.socialBar}>
            {/* Instagram */}
            <button
              type="button"
              className={`${styles.socialBtn} ${
                draft.instagramUrl ? styles.socialBtnConfigured : styles.socialBtnEmpty
              }`}
              onClick={() => openSocialModal("instagramUrl")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>{draft.instagramUrl ? "Instagram" : "+ Instagram"}</span>
              <Pencil size={11} className={styles.hoverPencilIcon} />
            </button>

            {/* Facebook */}
            <button
              type="button"
              className={`${styles.socialBtn} ${
                draft.facebookUrl ? styles.socialBtnConfigured : styles.socialBtnEmpty
              }`}
              onClick={() => openSocialModal("facebookUrl")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
              <span>{draft.facebookUrl ? "Facebook" : "+ Facebook"}</span>
              <Pencil size={11} className={styles.hoverPencilIcon} />
            </button>

            {/* TikTok */}
            <button
              type="button"
              className={`${styles.socialBtn} ${
                draft.tiktokUrl ? styles.socialBtnConfigured : styles.socialBtnEmpty
              }`}
              onClick={() => openSocialModal("tiktokUrl")}
            >
              <Globe size={14} />
              <span>{draft.tiktokUrl ? "TikTok" : "+ TikTok"}</span>
              <Pencil size={11} className={styles.hoverPencilIcon} />
            </button>

            {/* Website */}
            <button
              type="button"
              className={`${styles.socialBtn} ${
                draft.websiteUrl ? styles.socialBtnConfigured : styles.socialBtnEmpty
              }`}
              onClick={() => openSocialModal("websiteUrl")}
            >
              <Globe size={14} />
              <span>{draft.websiteUrl ? "Sitio Web" : "+ Sitio Web"}</span>
              <Pencil size={11} className={styles.hoverPencilIcon} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Save Action Bar ────────────────────────────────────────────── */}
      <div className={styles.saveActionBar}>
        <div className={styles.saveStatusInfo}>
          {hasUnsavedChanges ? (
            <span className={styles.unsavedBadge}>Tienes cambios sin guardar</span>
          ) : (
            <span className={styles.savedBadge}>Todos los cambios están guardados</span>
          )}
        </div>

        <div className={styles.saveActionButtons}>
          {hasUnsavedChanges && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleResetChanges}
              disabled={isPending}
            >
              <RotateCcw size={14} />
              Deshacer
            </button>
          )}

          <button
            type="button"
            className={styles.saveBtn}
            onClick={() => handleSaveAll()}
            disabled={isPending || !hasUnsavedChanges}
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
      </div>

      {/* ── 3. Dedicated Social Link Modal ─────────────────────────────── */}
      {activeSocialModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <LinkIcon size={18} className={styles.modalTitleIcon} />
                <h3 className={styles.modalTitle}>
                  Configurar Enlace de {getSocialMeta(activeSocialModal).name}
                </h3>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setActiveSocialModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.modalLabel}>
                URL de {getSocialMeta(activeSocialModal).name}
              </label>
              <input
                type="url"
                className={styles.modalInput}
                value={tempSocialUrl}
                onChange={(e) => setTempSocialUrl(e.target.value)}
                placeholder={getSocialMeta(activeSocialModal).placeholder}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveSocialModal()}
              />
              <p className={styles.modalHint}>
                Solo si este enlace tiene una URL válida aparecerá disponible para tus clientes en la carta digital.
              </p>
            </div>

            <div className={styles.modalFooter}>
              {draft[activeSocialModal] && (
                <button
                  type="button"
                  className={styles.modalDeleteBtn}
                  onClick={clearSocialModal}
                >
                  <Trash2 size={14} />
                  Quitar Enlace
                </button>
              )}
              <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setActiveSocialModal(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.modalSaveBtn}
                  onClick={saveSocialModal}
                >
                  <Check size={15} />
                  Guardar Enlace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
