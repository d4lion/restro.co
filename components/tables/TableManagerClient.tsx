"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createTableAction,
  updateTableAction,
  deleteTableAction,
  bulkDeleteTablesAction,
} from "@/app/actions/tables";
import {
  QrCode,
  Edit3,
  Download,
  ExternalLink,
  Trash2,
  Copy,
  Plus,
  Users,
  X,
  Loader2,
  CheckSquare,
  Square,
  Printer,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import styles from "./TableManagerClient.module.css";

interface TableItem {
  id: string;
  name: string;
  capacity: number | null;
  qrToken: string;
  isActive: boolean;
  activeOrderCount: number;
  totalAccumulated: number;
}

interface Props {
  tables: TableItem[];
  tenantSlug: string;
  tenantName: string;
  plan?: string;
  planLabel?: string;
  maxTables?: number | null;
}

export function TableManagerClient({
  tables,
  tenantSlug,
  tenantName,
  plan = "STARTER",
  planLabel = "Starter",
  maxTables = null,
}: Props) {
  const isCartaDigitalOnly = plan === "CARTA_DIGITAL" || plan === "STARTER";
  const hasTableLimit = typeof maxTables === "number" && maxTables > 0;
  const currentTablesCount = tables.length;
  const isAtTableLimit = hasTableLimit && currentTablesCount >= maxTables;
  const isNearTableLimit = hasTableLimit && !isAtTableLimit && currentTablesCount >= maxTables - 1;
  const remainingTables = hasTableLimit ? Math.max(0, maxTables - currentTablesCount) : null;
  const quotaPercentage = hasTableLimit ? Math.min(100, Math.round((currentTablesCount / maxTables) * 100)) : 0;

  // Modal states
  const [selectedTableForQr, setSelectedTableForQr] = useState<TableItem | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);

  // Multi-selection state
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Edit form inputs
  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState("4");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Add form inputs
  const [addName, setAddName] = useState("");
  const [addCapacity, setAddCapacity] = useState("4");
  const [isCreating, setIsCreating] = useState(false);

  // Generate QR Code data URL using table.id / table.qrToken
  useEffect(() => {
    if (selectedTableForQr) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const fullQrUrl = `${baseUrl}/restaurant/${tenantSlug}?tableId=${encodeURIComponent(selectedTableForQr.id)}`;

      QRCode.toDataURL(fullQrUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR:", err));
    } else {
      setQrDataUrl("");
    }
  }, [selectedTableForQr, tenantSlug]);

  // Toggle table selection
  const toggleSelectTable = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  };

  // Toggle Select All
  const toggleSelectAll = () => {
    if (selectedTableIds.length === tables.length) {
      setSelectedTableIds([]);
    } else {
      setSelectedTableIds(tables.map((t) => t.id));
    }
  };

  // Bulk Delete Selected Tables
  const handleBulkDelete = async () => {
    if (selectedTableIds.length === 0) return;
    if (!confirm(`¿Estás seguro de eliminar las ${selectedTableIds.length} mesas seleccionadas?`)) return;

    setIsBulkDeleting(true);
    const res = await bulkDeleteTablesAction(selectedTableIds);
    setIsBulkDeleting(false);

    if (res.success) {
      toast.success(res.message);
      setSelectedTableIds([]);
    } else {
      toast.error(res.message);
    }
  };

  // Open Edit Modal
  function handleOpenEdit(table: TableItem) {
    setEditingTable(table);
    setEditName(table.name);
    setEditCapacity(String(table.capacity || 4));
    setEditIsActive(table.isActive);
  }

  // Handle Save Edit
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTable) return;

    setIsUpdating(true);
    const res = await updateTableAction(editingTable.id, {
      name: editName,
      capacity: parseInt(editCapacity) || 4,
      isActive: editIsActive,
    });
    setIsUpdating(false);

    if (res.success) {
      toast.success(res.message);
      setEditingTable(null);
    } else {
      toast.error(res.message);
    }
  }

  // Handle Delete Single Table
  async function handleDeleteTable() {
    if (!editingTable) return;
    if (!confirm(`¿Estás seguro de eliminar la mesa "${editingTable.name}"?`)) return;

    setIsUpdating(true);
    const res = await deleteTableAction(editingTable.id);
    setIsUpdating(false);

    if (res.success) {
      toast.success(res.message);
      setEditingTable(null);
    } else {
      toast.error(res.message);
    }
  }

  // Handle Create Table
  async function handleCreateTable(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim()) return;

    setIsCreating(true);
    const res = await createTableAction({
      name: addName,
      capacity: parseInt(addCapacity) || 4,
    });
    setIsCreating(false);

    if (res.success) {
      toast.success(res.message);
      setAddName("");
      setAddCapacity("4");
    } else {
      toast.error(res.message);
    }
  }

  // Download QR Code PNG
  function handleDownloadQr() {
    if (!qrDataUrl || !selectedTableForQr) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `QR-${tenantName.replace(/\s+/g, "-")}-${selectedTableForQr.name.replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Imagen de código QR descargada");
  }

  // Print QR Code for the table
  function handlePrintQr() {
    if (!qrDataUrl || !selectedTableForQr) return;
    const printWin = window.open("", "_blank", "width=500,height=650");
    if (!printWin) {
      toast.error("Habilita las ventanas emergentes para imprimir el QR");
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR ${tenantName} - ${selectedTableForQr.name}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              margin: 0;
              text-align: center;
              color: #0F172A;
            }
            .card {
              border: 2px solid #0F172A;
              border-radius: 16px;
              padding: 32px 28px;
              max-width: 320px;
            }
            h1 { font-size: 20px; margin: 0 0 6px; }
            h2 { font-size: 26px; margin: 0 0 16px; color: #2563EB; }
            img { width: 260px; height: 260px; display: block; margin: 0 auto 16px; }
            p { font-size: 13px; color: #475569; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${tenantName}</h1>
            <h2>${selectedTableForQr.name}</h2>
            <img src="${qrDataUrl}" alt="QR ${selectedTableForQr.name}" />
            <p>Escanea el código QR con tu cámara para ver nuestra Carta Digital</p>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  }

  // Copy QR Link using tableId
  function handleCopyLink() {
    if (!selectedTableForQr) return;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const fullQrUrl = `${baseUrl}/restaurant/${tenantSlug}?tableId=${encodeURIComponent(selectedTableForQr.id)}`;
    navigator.clipboard.writeText(fullQrUrl);
    toast.success("Enlace copiado al portapapeles");
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  return (
    <div className={styles.container}>
      {/* ── Add Table Card ────────────────────────────────────────── */}
      <div className={styles.addCard}>
        <div className={styles.addHeader}>
          <div className={styles.addIconBox}>
            <Plus size={20} />
          </div>
          <div>
            <h2 className={styles.addTitle}>Agregar Nueva Mesa</h2>
            <p className={styles.addSubtitle}>Crea una mesa para tu local y genera su código QR auténtico al instante.</p>
          </div>
        </div>

        {/* Quota indicator — ONLY rendered when the current plan has a finite table limit (e.g. Starter = 5) */}
        {hasTableLimit && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              padding: "14px 16px",
              borderRadius: "10px",
              marginBottom: "16px",
              background: isAtTableLimit ? "#FEF2F2" : isNearTableLimit ? "#FFFBEB" : "#F8FAFC",
              border: `1px solid ${isAtTableLimit ? "#FECACA" : isNearTableLimit ? "#FDE68A" : "#CBD5E1"}`,
            }}
          >
            <div style={{ flex: 1, minWidth: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                  Límite de mesas del Plan {planLabel}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: isAtTableLimit ? "#FEE2E2" : "#DBEAFE",
                    color: isAtTableLimit ? "#B91C1C" : "#1D4ED8",
                  }}
                >
                  {currentTablesCount} / {maxTables} mesas
                </span>
              </div>

              <div
                style={{
                  width: "100%",
                  maxWidth: "360px",
                  height: "7px",
                  borderRadius: "999px",
                  background: "#E2E8F0",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${quotaPercentage}%`,
                    height: "100%",
                    borderRadius: "999px",
                    background: isAtTableLimit ? "#DC2626" : isNearTableLimit ? "#D97706" : "#2563EB",
                    transition: "width 0.25s ease",
                  }}
                />
              </div>

              <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", lineHeight: 1.4 }}>
                {isAtTableLimit ? (
                  <>
                    Has alcanzado el máximo de <strong>{maxTables} mesas</strong> permitidas en el plan{" "}
                    <strong>{planLabel}</strong>. Mejora al plan <strong>Carta Digital ($9.900/mes)</strong> para crear mesas y códigos QR ilimitados.
                  </>
                ) : (
                  <>
                    Tu plan <strong>{planLabel}</strong> permite hasta <strong>{maxTables} mesas</strong> con QR (te{" "}
                    {remainingTables === 1 ? "queda 1 disponible" : `quedan ${remainingTables} disponibles`}).
                  </>
                )}
              </p>
            </div>

            <Link
              href="/settings#planes"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                textDecoration: "none",
                background: "#15803D",
                color: "#FFFFFF",
                whiteSpace: "nowrap",
              }}
            >
              Mesas y QRs ilimitados ($9.900/mes) <ArrowUpRight size={14} />
            </Link>
          </div>
        )}

        <form onSubmit={handleCreateTable} className={styles.addForm}>
          <div style={{ flex: 2, minWidth: "220px" }}>
            <Input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder={
                isAtTableLimit
                  ? `Límite de ${maxTables} mesas alcanzado en el plan ${planLabel}`
                  : "Nombre (ej. Mesa 9, Terraza 3, VIP)"
              }
              disabled={isAtTableLimit}
              required
            />
          </div>
          <div style={{ flex: 1, minWidth: "140px" }}>
            <Input
              type="number"
              value={addCapacity}
              onChange={(e) => setAddCapacity(e.target.value)}
              placeholder="Capacidad"
              min="1"
              disabled={isAtTableLimit}
            />
          </div>
          <Button type="submit" variant="primary" loading={isCreating} disabled={isAtTableLimit}>
            {isAtTableLimit ? (
              <>
                <Lock size={15} /> Límite alcanzado ({currentTablesCount}/{maxTables})
              </>
            ) : (
              <>
                Crear Mesa{hasTableLimit ? ` (${currentTablesCount}/${maxTables})` : ""}
              </>
            )}
          </Button>
        </form>
      </div>

      {/* ── Section Header & Bulk Action Controls ────────────────── */}
      <div className={styles.sectionHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h2 className={styles.sectionTitle}>
          Mesas del Local{" "}
          <span className={styles.countBadge}>
            {hasTableLimit ? `${tables.length} / ${maxTables}` : tables.length}
          </span>
        </h2>

        {tables.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={toggleSelectAll}
              style={{
                background: "transparent",
                border: "1px solid #CBD5E1",
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {selectedTableIds.length === tables.length ? (
                <CheckSquare size={16} color="#2563EB" />
              ) : (
                <Square size={16} />
              )}
              {selectedTableIds.length === tables.length ? "Desmarcar Todas" : "Seleccionar Todas"}
            </button>

            {selectedTableIds.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                loading={isBulkDeleting}
                style={{ color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2" }}
              >
                <Trash2 size={16} /> Eliminar Seleccionadas ({selectedTableIds.length})
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Tables Grid with Checkboxes ───────────────────────────── */}
      <div className={styles.tablesGrid}>
        {tables.map((table) => {
          const isOccupied = !isCartaDigitalOnly && table.activeOrderCount > 0;
          const isSelected = selectedTableIds.includes(table.id);

          return (
            <div
              key={table.id}
              className={`${styles.tableCard} ${isOccupied ? styles["tableCard--active"] : ""} ${!table.isActive ? styles["tableCard--disabled"] : ""} ${isSelected ? styles.tableCardSelected : ""}`}
              style={{ border: isSelected ? "2px solid #2563EB" : undefined }}
            >
              {/* Header Badges + Multi-select Checkbox */}
              <div className={styles.tableCardHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectTable(table.id)}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                  <span
                    className={`${styles.statusBadge} ${
                      !table.isActive
                        ? styles["status--disabled"]
                        : isOccupied
                        ? styles["status--active"]
                        : styles["status--free"]
                    }`}
                  >
                    {!table.isActive
                      ? "INACTIVA"
                      : isCartaDigitalOnly
                      ? "QR ACTIVO"
                      : isOccupied
                      ? "OCUPADA"
                      : "LIBRE"}
                  </span>
                </div>

                <div className={styles.capacityBadge}>
                  <Users size={14} /> {table.capacity || 4} pers.
                </div>
              </div>

              {/* Table Name */}
              <h3 className={styles.tableName}>{table.name}</h3>

              {/* Traceability or Status Body */}
              {isCartaDigitalOnly ? (
                <div className={styles.freeHintBox}>
                  <span>Código QR de Carta Digital listo para imprimir</span>
                </div>
              ) : isOccupied ? (
                <div className={styles.traceabilityBox}>
                  <span className={styles.traceTitle}>Trazabilidad de consumo:</span>
                  <span className={styles.traceSub}>{table.activeOrderCount} pedido(s) en curso</span>
                  <span className={styles.traceTotal}>{formatCOP(table.totalAccumulated)}</span>
                </div>
              ) : (
                <div className={styles.freeHintBox}>
                  <span>Disponible para nuevos clientes</span>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className={styles.tableFooterActions}>
                {/* View / Download QR Button */}
                <button
                  type="button"
                  className={styles.qrActionBtn}
                  onClick={() => setSelectedTableForQr(table)}
                >
                  <QrCode size={16} /> Ver / Imprimir QR
                </button>

                {/* Edit Table Button */}
                <button
                  type="button"
                  className={styles.editActionBtn}
                  onClick={() => handleOpenEdit(table)}
                  title="Editar mesa"
                >
                  <Edit3 size={16} /> Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODAL: Ver y Descargar QR ─────────────────────────────── */}
      {selectedTableForQr && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTableForQr(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedTableForQr(null)}>
              <X size={20} />
            </button>

            <div className={styles.qrModalHeader}>
              <h3 className={styles.modalTitle}>Código QR de Mesa</h3>
              <p className={styles.modalSubtitle}>
                {tenantName} — <strong>{selectedTableForQr.name}</strong>
              </p>
            </div>

            <div className={styles.qrDisplayBox}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR Code ${selectedTableForQr.name}`} className={styles.qrImage} />
              ) : (
                <div className={styles.qrLoading}>
                  <Loader2 size={32} className="spin" />
                </div>
              )}
              <span className={styles.qrStandText}>Restro · Carta Digital QR</span>
            </div>

            <div className={styles.qrModalActions}>
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <Button variant="primary" size="lg" fullWidth onClick={handlePrintQr}>
                  <Printer size={18} /> Imprimir QR
                </Button>
                <Button variant="outline" size="lg" fullWidth onClick={handleDownloadQr}>
                  <Download size={18} /> Descargar PNG
                </Button>
              </div>
              
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <Button variant="outline" fullWidth onClick={handleCopyLink}>
                  <Copy size={16} /> Copiar Link
                </Button>
                <a
                  href={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/restaurant/${tenantSlug}?tableId=${encodeURIComponent(selectedTableForQr.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, textDecoration: "none" }}
                >
                  <Button variant="outline" fullWidth>
                    <ExternalLink size={16} /> Probar
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Editar Mesa ────────────────────────────────────── */}
      {editingTable && (
        <div className={styles.modalOverlay} onClick={() => setEditingTable(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setEditingTable(null)}>
              <X size={20} />
            </button>

            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Editar {editingTable.name}</h3>
              <p className={styles.modalSubtitle}>Actualiza la información o estado de la mesa.</p>
            </div>

            <form onSubmit={handleSaveEdit} className={styles.editForm}>
              <Input
                label="Nombre de la Mesa"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <Input
                label="Capacidad (Personas)"
                type="number"
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
                min="1"
                required
              />

              <div className={styles.activeCheckboxRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                  />
                  <span>Mesa activa en el sistema</span>
                </label>
              </div>

              <div className={styles.editModalActions}>
                <Button type="button" variant="ghost" onClick={handleDeleteTable} style={{ color: "#DC2626" }}>
                  <Trash2 size={16} /> Eliminar Mesa
                </Button>
                <Button type="submit" variant="primary" loading={isUpdating}>
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
