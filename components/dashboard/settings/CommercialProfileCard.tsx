"use client";

import React, { useState, useTransition, useRef } from "react";
import { Pencil, X, Check, Loader2, Upload, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { updateCommercialProfileAction } from "@/app/actions/settings";
import { uploadImageAction } from "@/app/actions/storage";
import { Input } from "@/components/ui/Input";
import styles from "./ProfileCard.module.css";

const PRESET_COLORS = [
  "#0066FF", "#FF6B35", "#10B981", "#8B5CF6", "#EC4899",
  "#F59E0B", "#14B8A6", "#3B82F6", "#F43F5E", "#111827"
];

interface CommercialProfileCardProps {
  tenantId: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  brandColor: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  websiteUrl: string | null;
}

// Utility function to determine text color based on background
function getContrastColor(hexColor: string) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}

export function CommercialProfileCard({
  name,
  logoUrl: initialLogoUrl,
  coverUrl: initialCoverUrl,
  brandColor: initialBrandColor,
  instagramUrl: initialInstagram,
  facebookUrl: initialFacebook,
  tiktokUrl: initialTiktok,
  websiteUrl: initialWebsite,
}: CommercialProfileCardProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState({
    logoUrl: initialLogoUrl ?? "",
    coverUrl: initialCoverUrl ?? "",
    brandColor: initialBrandColor ?? "#0066FF",
    instagramUrl: initialInstagram ?? "",
    facebookUrl: initialFacebook ?? "",
    tiktokUrl: initialTiktok ?? "",
    websiteUrl: initialWebsite ?? "",
  });

  function handleCancel() {
    setDraft({
      logoUrl: initialLogoUrl ?? "",
      coverUrl: initialCoverUrl ?? "",
      brandColor: initialBrandColor ?? "#0066FF",
      instagramUrl: initialInstagram ?? "",
      facebookUrl: initialFacebook ?? "",
      tiktokUrl: initialTiktok ?? "",
      websiteUrl: initialWebsite ?? "",
    });
    setEditing(false);
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
    setUploading(false);

    if (res.publicUrl) {
      setDraft((d) => ({ ...d, [type === "logos" ? "logoUrl" : "coverUrl"]: res.publicUrl }));
      toast.success("Imagen subida. Haz clic en Guardar Cambios para aplicar.");
    } else {
      toast.error(res.error || "No se pudo subir la imagen");
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    
    // The inputs for URLs and color have names, we only need to append images if they are not standard inputs
    fd.append("logoUrl", draft.logoUrl);
    fd.append("coverUrl", draft.coverUrl);

    startTransition(async () => {
      const result = await updateCommercialProfileAction(fd);
      if (result.success) {
        toast.success(result.message, {
          description: "Los cambios ya están visibles en tu carta digital.",
          duration: 4000,
        });
        setEditing(false);
      } else {
        toast.error(result.message, { duration: 5000 });
      }
    });
  }

  return (
    <div className={`${styles.card} ${editing ? styles.cardEditing : ""}`}>
      <div className={styles.cardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className={styles.logoAvatarBox}>
            {draft.logoUrl ? (
              <img src={draft.logoUrl} alt="Logo" className={styles.logoAvatarImg} />
            ) : (
              <div className={styles.logoAvatarPlaceholder}>
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <h2 className={styles.cardTitle}>Perfil Comercial y Diseño</h2>
            {!editing && (
              <p className={styles.cardHint}>
                Haz clic en <strong>Editar</strong> para actualizar tu logo, banner, color y redes sociales.
              </p>
            )}
          </div>
        </div>

        {!editing ? (
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => setEditing(true)}
            aria-label="Editar perfil comercial"
          >
            <Pencil size={14} strokeWidth={2.5} />
            Editar
          </button>
        ) : (
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={isPending}
            aria-label="Cancelar edición"
          >
            <X size={14} strokeWidth={2.5} />
            Cancelar
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Logo Upload Dropzone */}
          <div className={styles.logoUploadRow}>
            <label className={styles.fieldLabel}>Logo del Restaurante</label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenFileInput}
              onChange={(e) => handleImageUpload(e, "logos")}
            />
            <div className={styles.logoEditPreview}>
              {draft.logoUrl ? (
                <div className={styles.logoPreviewContent}>
                  <img src={draft.logoUrl} alt="Logo cargado" className={styles.logoPreviewThumb} />
                  <div className={styles.logoPreviewText}>
                    <strong>Logo Actualizado</strong>
                    <span>Listo para guardar</span>
                  </div>
                  <button
                    type="button"
                    className={styles.changeLogoBtn}
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div
                  className={styles.logoUploadDropzone}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {isUploadingLogo ? (
                    <span className={styles.uploadSpinText}>
                      <Loader2 size={18} className={styles.spin} /> Subiendo logo...
                    </span>
                  ) : (
                    <>
                      <Upload size={18} color="#2563EB" />
                      <span>Haz clic para seleccionar tu logo</span>
                      <small>PNG, JPG (Máx 5MB)</small>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Banner Upload Dropzone */}
          <div className={styles.logoUploadRow}>
            <label className={styles.fieldLabel}>Imagen de Portada (Banner)</label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenFileInput}
              onChange={(e) => handleImageUpload(e, "covers")}
            />
            <div className={styles.logoEditPreview}>
              {draft.coverUrl ? (
                <div className={styles.logoPreviewContent}>
                  <img src={draft.coverUrl} alt="Banner cargado" className={styles.logoPreviewThumb} />
                  <div className={styles.logoPreviewText}>
                    <strong>Banner Actualizado</strong>
                    <span>Listo para guardar</span>
                  </div>
                  <button
                    type="button"
                    className={styles.changeLogoBtn}
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div
                  className={styles.logoUploadDropzone}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {isUploadingCover ? (
                    <span className={styles.uploadSpinText}>
                      <Loader2 size={18} className={styles.spin} /> Subiendo portada...
                    </span>
                  ) : (
                    <>
                      <Upload size={18} color="#2563EB" />
                      <span>Haz clic para seleccionar tu banner</span>
                      <small>Orientación horizontal recomendada</small>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Color Picker */}
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <label className={styles.fieldLabel}>Color Principal de la Carta</label>
            
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "250px" }}>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>Colores sugeridos</p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setDraft(d => ({ ...d, brandColor: color }))}
                      style={{
                        width: "32px", height: "32px", borderRadius: "8px", backgroundColor: color,
                        border: draft.brandColor.toLowerCase() === color.toLowerCase() ? "2px solid #0f172a" : "2px solid transparent",
                        cursor: "pointer", transition: "transform 0.1s", transform: draft.brandColor.toLowerCase() === color.toLowerCase() ? "scale(1.1)" : "none"
                      }}
                      aria-label={`Seleccionar color ${color}`}
                    />
                  ))}
                  
                  <div style={{ position: "relative", width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", border: "2px solid #e2e8f0" }}>
                    <input
                      type="color"
                      name="brandColor"
                      value={draft.brandColor}
                      onChange={(e) => setDraft(d => ({ ...d, brandColor: e.target.value }))}
                      style={{ position: "absolute", width: "150%", height: "150%", top: "-25%", left: "-25%", cursor: "pointer", padding: 0, border: "none" }}
                      title="Color personalizado"
                    />
                  </div>
                </div>
              </div>
              
              <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>Vista previa del botón</p>
                <button
                  type="button"
                  style={{
                    backgroundColor: draft.brandColor,
                    color: getContrastColor(draft.brandColor),
                    padding: "8px 24px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "bold",
                    fontSize: "0.9rem"
                  }}
                  disabled
                >
                  Agregar producto
                </button>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "bold", color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>Redes Sociales</h3>
            
            <div className={styles.formRow}>
              <Input
                name="instagramUrl"
                label="Instagram URL"
                placeholder="https://instagram.com/tu-restaurante"
                value={draft.instagramUrl}
                onChange={(e) => setDraft((d) => ({ ...d, instagramUrl: e.target.value }))}
              />
              <Input
                name="facebookUrl"
                label="Facebook URL"
                placeholder="https://facebook.com/tu-restaurante"
                value={draft.facebookUrl}
                onChange={(e) => setDraft((d) => ({ ...d, facebookUrl: e.target.value }))}
              />
            </div>
            
            <div className={styles.formRow}>
              <Input
                name="tiktokUrl"
                label="TikTok URL"
                placeholder="https://tiktok.com/@tu-restaurante"
                value={draft.tiktokUrl}
                onChange={(e) => setDraft((d) => ({ ...d, tiktokUrl: e.target.value }))}
              />
              <Input
                name="websiteUrl"
                label="Sitio Web"
                placeholder="https://tu-sitio-web.com"
                value={draft.websiteUrl}
                onChange={(e) => setDraft((d) => ({ ...d, websiteUrl: e.target.value }))}
              />
            </div>
          </div>

          <div className={styles.saveBar}>
            <button
              type="button"
              className={styles.cancelBtnInline}
              onClick={handleCancel}
              disabled={isPending || isUploadingLogo || isUploadingCover}
            >
              <X size={14} strokeWidth={2.5} />
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isPending || isUploadingLogo || isUploadingCover}
            >
              {isPending ? (
                <>
                  <Loader2 size={14} strokeWidth={2.5} className={styles.spin} />
                  Guardando…
                </>
              ) : (
                <>
                  <Check size={14} strokeWidth={2.5} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.readView}>
          <div className={styles.formRow}>
            <ReadField
              label="Logo Oficial"
              value={draft.logoUrl ? "Cargado ✓" : "Sin asignar"}
              onDoubleClick={() => setEditing(true)}
            />
            <ReadField
              label="Banner de Portada"
              value={draft.coverUrl ? "Cargado ✓" : "Sin asignar"}
              onDoubleClick={() => setEditing(true)}
            />
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#475569" }}>Color Principal</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: draft.brandColor, border: "1px solid #cbd5e1" }} />
              <span style={{ fontSize: "0.9rem", color: "#0f172a", fontFamily: "monospace" }}>{draft.brandColor.toUpperCase()}</span>
            </div>
          </div>

          <div className={styles.formRow} style={{ marginTop: "8px" }}>
            <ReadField
              label="Instagram"
              value={draft.instagramUrl || "—"}
              onDoubleClick={() => setEditing(true)}
            />
            <ReadField
              label="Facebook"
              value={draft.facebookUrl || "—"}
              onDoubleClick={() => setEditing(true)}
            />
          </div>
          
          <div className={styles.formRow}>
            <ReadField
              label="TikTok"
              value={draft.tiktokUrl || "—"}
              onDoubleClick={() => setEditing(true)}
            />
            <ReadField
              label="Sitio Web"
              value={draft.websiteUrl || "—"}
              onDoubleClick={() => setEditing(true)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ReadField({
  label,
  value,
  onDoubleClick,
}: {
  label: string;
  value: string;
  onDoubleClick: () => void;
}) {
  return (
    <div
      className={styles.readField}
      onDoubleClick={onDoubleClick}
      title="Doble clic para editar"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onDoubleClick()}
    >
      <span className={styles.readLabel}>{label}</span>
      <span className={styles.readValue} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{value}</span>
      <Pencil size={12} strokeWidth={2} className={styles.fieldHintIcon} />
    </div>
  );
}
