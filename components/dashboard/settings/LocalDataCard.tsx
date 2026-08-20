"use client";

import React, { useState, useTransition } from "react";
import { Pencil, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateLocalDataAction } from "@/app/actions/settings";
import { Input, Textarea } from "@/components/ui/Input";
import styles from "./ProfileCard.module.css";

interface LocalDataCardProps {
  tenantId: string;
  name: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
}

export function LocalDataCard({
  name,
  description,
  phone,
  address,
  city,
}: LocalDataCardProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [draft, setDraft] = useState({
    name,
    description: description ?? "",
    phone: phone ?? "",
    address: address ?? "",
    city: city ?? "Bogotá",
  });

  function handleCancel() {
    setDraft({
      name,
      description: description ?? "",
      phone: phone ?? "",
      address: address ?? "",
      city: city ?? "Bogotá",
    });
    setEditing(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      const result = await updateLocalDataAction(fd);
      if (result.success) {
        toast.success(result.message, {
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
        <div>
          <h2 className={styles.cardTitle}>Datos del Local</h2>
          {!editing && (
            <p className={styles.cardHint}>
              Haz clic en <strong>Editar</strong> para actualizar la información básica de tu restaurante.
            </p>
          )}
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

      {editing ? (
        <form onSubmit={handleSubmit} className={styles.form}>
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

          <div className={styles.saveBar}>
            <button
              type="button"
              className={styles.cancelBtnInline}
              onClick={handleCancel}
              disabled={isPending}
            >
              <X size={14} strokeWidth={2.5} />
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isPending}
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
          <ReadField
            label="Nombre Comercial"
            value={name}
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
