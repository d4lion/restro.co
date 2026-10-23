"use client";

import React, { useState } from "react";
import { QrCode, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import styles from "@/app/(dashboard)/settings/page.module.css";

interface SlugCardProps {
  slug: string;
}

export function SlugCard({ slug }: SlugCardProps) {
  const [copied, setCopied] = useState(false);
  const fullUrl = `https://restro.adamind.cloud/restaurant/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <div className={styles.card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <QrCode size={22} color="#2563EB" />
        <h2 className={styles.cardTitle} style={{ margin: 0 }}>
          Enlace Web de tu Carta Digital
        </h2>
      </div>

      <p className={styles.cardSub} style={{ marginBottom: 16 }}>
        Esta es la dirección pública que se abre cuando un comensal escanea los códigos QR de tus mesas o entra desde tus redes sociales.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#F8FAFC",
            border: "1.5px solid #E2E8F0",
            borderRadius: 8,
            padding: "10px 14px",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <code
            style={{
              fontFamily: "monospace",
              fontSize: "0.95rem",
              color: "#1E293B",
              fontWeight: 600,
              wordBreak: "break-all",
            }}
          >
            restro.adamind.cloud/restaurant/<strong>{slug}</strong>
          </code>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: copied ? "#DCFCE7" : "#FFFFFF",
                color: copied ? "#15803D" : "#1E293B",
                border: copied ? "1.5px solid #86EFAC" : "1.5px solid #CBD5E1",
                borderRadius: 6,
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado" : "Copiar enlace"}
            </button>

            <a
              href={`/restaurant/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#EFF6FF",
                color: "#1D4ED8",
                border: "1.5px solid #BFDBFE",
                borderRadius: 6,
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <ExternalLink size={16} />
              Abrir carta
            </a>
          </div>
        </div>

        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: "0.825rem",
            color: "#64748B",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#334155" }}>Para tus clientes:</strong> Puedes pegar este enlace en tu perfil de Instagram, enviarlo por chat de WhatsApp a tus clientes habituales o imprimirlo en tus cartas físicas.
        </div>
      </div>
    </div>
  );
}
