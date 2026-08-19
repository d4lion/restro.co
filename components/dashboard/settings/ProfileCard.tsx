"use client";

import React, { useState, useTransition, useRef } from "react";
import { Pencil, X, Check, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { updateRestaurantAction } from "@/app/actions/settings";
import { uploadImageAction } from "@/app/actions/storage";
import { Input, Textarea } from "@/components/ui/Input";
import styles from "./ProfileCard.module.css";

interface ProfileCardProps {
  tenantId: string;
  name: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  logoUrl?: string | null;
}

export function ProfileCard({
  name,
  description,
  phone,
  address,
  city,
  logoUrl: initialLogoUrl,
}: ProfileCardProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form draft state
  const [draft, setDraft] = useState({
    name,
    description: description ?? "",
    phone: phone ?? "",
    address: address ?? "",
    city: city ?? "Bogotá",
    logoUrl: initialLogoUrl ?? "",
  });

  function handleCancel() {
    setDraft({
      name,
      description: description ?? "",
      phone: phone ?? "",
      address: address ?? "",
      city: city ?? "Bogotá",
      logoUrl: initialLogoUrl ?? "",
    });
    setEditing(false);
  }

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo no debe superar los 5MB");
      return;
    }

    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadImageAction(formData, "logos");
    setIsUploadingLogo(false);

    if (res.publicUrl) {
      setDraft((d) => ({ ...d, logoUrl: res.publicUrl }));
      toast.success("Logo subido. Haz clic en Guardar Cambios para aplicar.");
    } else {
      toast.error(res.error || "No se pudo subir la imagen");
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.append("logoUrl", draft.logoUrl);

    startTransition(async () => {
      const result = await updateRestaurantAction(fd);
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
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.cardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Logo Avatar Display */}
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
            <h2 className={styles.cardTitle}>Perfil Comercial y Logo del Local</h2>
            {!editing && (
              <p className={styles.cardHint}>
                Haz clic en <strong>Editar</strong> para actualizar datos o cargar el logo oficial.
              </p>
            )}
          </div>
        </div>

        {!editing ? (
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => setEditing(true)}
            aria-label="Editar perfil"
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

      {/* ── Content ─────────────────────────────────────────── */}
      {editing ? (
        /* ── Edit Mode ─────────────────────────────────────── */
        <form onSubmit={handleSubmit} className={styles.form}>
          <input type="hidden" name="logoUrl" value={draft.logoUrl} />

          {/* Logo Upload Dropzone */}
          <div className={styles.logoUploadRow}>
            <label className={styles.fieldLabel}>Logo del Restaurante</label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenFileInput}
              onChange={handleLogoFileChange}
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
                    Cambiar Imagen
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
                      <small>PNG, JPG, WEBP (Máx 5MB)</small>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <Input
            name="name"
            label="Nombre Comercial"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            required
          />

          <Textarea
            name="description"
            label="Descripción / Eslogan"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />

          <div className={styles.formRow}>
            <Input
              name="phone"
              label="Teléfono de contacto"
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
            />
            <Input
              name="city"
              label="Ciudad"
              value={draft.city}
              onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
            />
          </div>

          <Input
            name="address"
            label="Dirección física"
            value={draft.address}
            onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
          />

          {/* ── Save bar ─────────────────────────────────────── */}
          <div className={styles.saveBar}>
            <button
              type="button"
              className={styles.cancelBtnInline}
              onClick={handleCancel}
              disabled={isPending || isUploadingLogo}
            >
              <X size={14} strokeWidth={2.5} />
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isPending || isUploadingLogo}
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
        /* ── Read-only Mode ─────────────────────────────────── */
        <div className={styles.readView}>
          <ReadField
            label="Nombre Comercial"
            value={name}
            onDoubleClick={() => setEditing(true)}
          />
          <ReadField
            label="Logo Oficial"
            value={initialLogoUrl ? "Logo activo ✓ (haz doble clic para cambiar)" : "Sin logo (haz doble clic para cargar)"}
            onDoubleClick={() => setEditing(true)}
          />
          <ReadField
            label="Descripción / Eslogan"
            value={description || "—"}
            onDoubleClick={() => setEditing(true)}
          />
          <div className={styles.formRow}>
            <ReadField
              label="Teléfono"
              value={phone || "—"}
              onDoubleClick={() => setEditing(true)}
            />
            <ReadField
              label="Ciudad"
              value={city || "—"}
              onDoubleClick={() => setEditing(true)}
            />
          </div>
          <ReadField
            label="Dirección"
            value={address || "—"}
            onDoubleClick={() => setEditing(true)}
          />
        </div>
      )}
    </div>
  );
}

/* ── Read-only field with double-click hint ──────────────────── */
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
      <span className={styles.readValue}>{value}</span>
      <Pencil size={12} strokeWidth={2} className={styles.fieldHintIcon} />
    </div>
  );
}
