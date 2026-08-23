"use client";

import React, { useState, useEffect, useTransition } from "react";
import { X, ShoppingBag, Loader2, Utensils, Bike, MessageSquare, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import styles from "./CartDrawer.module.css";
import { CartItem } from "./PublicMenuClient";
import { createPublicOrderAction, validateTableAction } from "@/app/actions/orders";

interface Props {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  brandColor?: string;
  buttonTextColor?: string;
  isStoreOpen?: boolean;
  allowDineIn?: boolean;
  requireTableQrForDineIn?: boolean;
  allowTakeout?: boolean;
  allowDelivery?: boolean;
  allowWhatsAppOrdering?: boolean;
  whatsappNumber?: string | null;
}

// Client-side in-memory cache map to make table validation instant (0ms)
const tableCacheMap = new Map<string, { valid: boolean; table: { id: string; name: string } | null }>();

export function CartDrawer({
  tenantId,
  isOpen,
  onClose,
  cart,
  setCart,
  brandColor,
  buttonTextColor,
  isStoreOpen = true,
  allowDineIn = true,
  requireTableQrForDineIn = true,
  allowTakeout = false,
  allowDelivery = false,
  allowWhatsAppOrdering = false,
  whatsappNumber = null,
}: Props) {
  // Available types
  const availableTypes: Array<"DINE_IN" | "TAKEOUT" | "DELIVERY"> = [];
  if (allowDineIn) availableTypes.push("DINE_IN");
  if (allowTakeout) availableTypes.push("TAKEOUT");
  if (allowDelivery) availableTypes.push("DELIVERY");

  // Verified Table State (Confirmed via DB query to prevent enumeration attacks)
  const [urlTableParam, setUrlTableParam] = useState<string | null>(null);
  const [verifiedTable, setVerifiedTable] = useState<{ id: string; name: string } | null>(null);
  const [isValidatingTable, setIsValidatingTable] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const tableParam =
        searchParams.get("table") ||
        searchParams.get("tableId") ||
        searchParams.get("mesa") ||
        searchParams.get("qr") ||
        searchParams.get("t");

      setUrlTableParam(tableParam);

      if (tableParam && tenantId) {
        const cacheKey = `restro_tbl_${tenantId}_${tableParam}`;

        // 1. Check in-memory map cache for instant 0ms retrieval
        if (tableCacheMap.has(cacheKey)) {
          const cached = tableCacheMap.get(cacheKey)!;
          setVerifiedTable(cached.table);
          return;
        }

        // 2. Check sessionStorage cache
        try {
          const stored = sessionStorage.getItem(cacheKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            tableCacheMap.set(cacheKey, parsed);
            setVerifiedTable(parsed.table);
            return;
          }
        } catch (_) {}

        // 3. Fallback to server action if not cached yet
        setIsValidatingTable(true);
        validateTableAction(tenantId, tableParam)
          .then((res) => {
            const cachePayload = { valid: res.valid, table: res.table };
            tableCacheMap.set(cacheKey, cachePayload);
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(cachePayload));
            } catch (_) {}

            if (res.valid && res.table) {
              setVerifiedTable(res.table);
            } else {
              setVerifiedTable(null);
            }
          })
          .catch(() => setVerifiedTable(null))
          .finally(() => setIsValidatingTable(false));
      } else {
        setVerifiedTable(null);
      }
    }
  }, [tenantId, isOpen]);

  // Compute smart initial orderType
  const getSmartInitialType = (): "DINE_IN" | "TAKEOUT" | "DELIVERY" => {
    if (urlTableParam && allowDineIn) return "DINE_IN";
    if (allowDelivery) return "DELIVERY";
    if (allowTakeout) return "TAKEOUT";
    if (allowDineIn) return "DINE_IN";
    return "DINE_IN";
  };

  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEOUT" | "DELIVERY">(getSmartInitialType());

  useEffect(() => {
    if (urlTableParam && allowDineIn) {
      setOrderType("DINE_IN");
    }
  }, [urlTableParam, allowDineIn]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  // Strict Table QR block applies ONLY when orderType === "DINE_IN"
  const isDineInBlocked =
    orderType === "DINE_IN" && requireTableQrForDineIn && !verifiedTable;

  const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            subtotal: (item.subtotal / item.quantity) * newQty,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const getModifiersText = (item: CartItem) => {
    const parts: string[] = [];
    if (item.menuItem.modifierGroups) {
      item.menuItem.modifierGroups.forEach((g) => {
        const selected = item.selections[g.id] || [];
        if (selected.length > 0) {
          const optNames = selected
            .map((optId) => g.options.find((o) => o.id === optId)?.name)
            .filter(Boolean);
          if (optNames.length > 0) {
            parts.push(`${g.name}: ${optNames.join(", ")}`);
          }
        }
      });
    }
    return parts.join(" | ");
  };

  const validateCheckoutData = (): boolean => {
    if (orderType === "TAKEOUT") {
      if (!customerName.trim()) {
        toast.error("Ingresa tu nombre para identificar tu pedido al recoger");
        return false;
      }
      if (!customerPhone.trim()) {
        toast.error("Ingresa tu número de teléfono de contacto");
        return false;
      }
    }

    if (orderType === "DELIVERY") {
      if (!customerName.trim()) {
        toast.error("Ingresa tu nombre completo para la entrega");
        return false;
      }
      if (!customerPhone.trim()) {
        toast.error("Ingresa tu teléfono móvil de contacto");
        return false;
      }
      if (!deliveryAddress.trim()) {
        toast.error("Ingresa la dirección exacta de entrega a domicilio");
        return false;
      }
    }

    return true;
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (!validateCheckoutData()) return;

    startTransition(async () => {
      const orderData = {
        tenantId,
        type: orderType,
        tableId: orderType === "DINE_IN" ? verifiedTable?.id || undefined : undefined,
        customerName: customerName.trim() || (orderType === "DINE_IN" ? (verifiedTable ? verifiedTable.name : "Cliente Local") : "Cliente"),
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        notes: [
          customerPhone ? `Tel: ${customerPhone.trim()}` : "",
          deliveryAddress ? `Dir: ${deliveryAddress.trim()}` : "",
          orderNotes ? `Nota: ${orderNotes.trim()}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
        items: cart.map((item) => {
          const modifiers =
            item.menuItem.modifierGroups?.flatMap((g) => {
              const selectedIds = item.selections[g.id] || [];
              return selectedIds.map((optId) => {
                const opt = g.options.find((o) => o.id === optId);
                return {
                  groupId: g.id,
                  groupName: g.name,
                  optionId: optId,
                  name: opt?.name || "Desconocido",
                  priceExtra: opt?.priceExtra || 0,
                };
              });
            }) || [];

          return {
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            notes: "",
            modifiers,
          };
        }),
      };

      const res = await createPublicOrderAction(orderData);

      if (res.success) {
        if (allowWhatsAppOrdering) {
          let cleanPhone = (whatsappNumber || "").replace(/[^0-9]/g, "");
          if (!cleanPhone) cleanPhone = "573105550000";
          if (cleanPhone.length === 10 && cleanPhone.startsWith("3")) {
            cleanPhone = "57" + cleanPhone;
          }

          let summaryText = `🛒 *NUEVO PEDIDO (${orderType === "DINE_IN" ? "EN MESA" : orderType === "TAKEOUT" ? "PARA RECOGER" : "DOMICILIO"})*\n`;
          if (verifiedTable) summaryText += `📍 Mesa: ${verifiedTable.name}\n`;
          if (customerName) summaryText += `👤 Nombre: ${customerName}\n`;
          if (deliveryAddress) summaryText += `🏠 Dirección: ${deliveryAddress}\n`;
          if (customerPhone) summaryText += `📞 Teléfono: ${customerPhone}\n`;
          summaryText += `\n*PRODUCTOS:*\n`;

          cart.forEach((item) => {
            summaryText += `• ${item.quantity}x ${item.menuItem.name} — ${formatCOP(item.subtotal)}\n`;
            const mods = getModifiersText(item);
            if (mods) summaryText += `   _${mods}_\n`;
          });

          summaryText += `\n💰 *TOTAL: ${formatCOP(totalAmount)}*`;

          const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(summaryText)}`;
          window.open(waUrl, "_blank");
        }

        toast.success(
          orderType === "TAKEOUT"
            ? "¡Pedido para recoger registrado! Te esperamos en el local."
            : orderType === "DELIVERY"
            ? "¡Pedido a domicilio enviado! Pronto saldrá en camino."
            : `¡Pedido en ${verifiedTable?.name || "mesa"} enviado a cocina!`
        );

        setCart([]);
        onClose();
      } else {
        toast.error(res.message || "Error al enviar el pedido");
      }
    });
  };

  const getCheckoutButtonLabel = () => {
    if (allowWhatsAppOrdering) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <MessageSquare size={18} /> Enviar Pedido a WhatsApp
        </div>
      );
    }
    switch (orderType) {
      case "DINE_IN":
        return `Confirmar Pedido en ${verifiedTable?.name || "Mesa"}`;
      case "TAKEOUT":
        return "Confirmar Pedido para Recoger";
      case "DELIVERY":
        return "Confirmar Pedido a Domicilio";
      default:
        return "Confirmar Pedido";
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Tu Pedido</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {cart.length === 0 ? (
            <div className={styles.emptyState}>
              <ShoppingBag size={48} color="#cbd5e1" />
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              {/* Order Type Selector Tabs */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                  ¿CÓMO DESEAS RECIBIR TU PEDIDO?
                </label>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {allowDineIn && (
                    <button
                      type="button"
                      onClick={() => setOrderType("DINE_IN")}
                      style={{
                        flex: 1,
                        padding: "9px 6px",
                        fontSize: "0.825rem",
                        fontWeight: 700,
                        borderRadius: 8,
                        border: orderType === "DINE_IN" ? `2px solid ${brandColor || "#0066FF"}` : "1px solid #CBD5E1",
                        background: orderType === "DINE_IN" ? "#EFF6FF" : "#FFFFFF",
                        color: orderType === "DINE_IN" ? brandColor || "#0066FF" : "#475569",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Utensils size={15} /> En Mesa
                    </button>
                  )}
                  {allowTakeout && (
                    <button
                      type="button"
                      onClick={() => setOrderType("TAKEOUT")}
                      style={{
                        flex: 1,
                        padding: "9px 6px",
                        fontSize: "0.825rem",
                        fontWeight: 700,
                        borderRadius: 8,
                        border: orderType === "TAKEOUT" ? `2px solid ${brandColor || "#0066FF"}` : "1px solid #CBD5E1",
                        background: orderType === "TAKEOUT" ? "#EFF6FF" : "#FFFFFF",
                        color: orderType === "TAKEOUT" ? brandColor || "#0066FF" : "#475569",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <ShoppingBag size={15} /> Para Recoger
                    </button>
                  )}
                  {allowDelivery && (
                    <button
                      type="button"
                      onClick={() => setOrderType("DELIVERY")}
                      style={{
                        flex: 1,
                        padding: "9px 6px",
                        fontSize: "0.825rem",
                        fontWeight: 700,
                        borderRadius: 8,
                        border: orderType === "DELIVERY" ? `2px solid ${brandColor || "#0066FF"}` : "1px solid #CBD5E1",
                        background: orderType === "DELIVERY" ? "#EFF6FF" : "#FFFFFF",
                        color: orderType === "DELIVERY" ? brandColor || "#0066FF" : "#475569",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Bike size={15} /> Domicilio
                    </button>
                  )}
                </div>
              </div>

              {/* Verified Table Badge vs Invalid/Missing QR Warning */}
              {orderType === "DINE_IN" && (
                isValidatingTable ? (
                  <div style={{ background: "#F1F5F9", color: "#475569", padding: "8px 12px", borderRadius: 8, fontSize: "0.8rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                    <Loader2 size={16} className={styles.spin} /> Verificando autenticidad de la mesa...
                  </div>
                ) : verifiedTable ? (
                  <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", padding: "10px 12px", borderRadius: 8, fontSize: "0.825rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                    <CheckCircle2 size={18} style={{ color: "#16A34A" }} />
                    <span>Actualmente estas en: {verifiedTable.name}</span>
                  </div>
                ) : requireTableQrForDineIn ? (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", padding: "12px", borderRadius: 8, fontSize: "0.8rem", marginBottom: 16, display: "flex", gap: 10 }}>
                    <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: 2, color: "#DC2626" }} />
                    <div>
                      <strong style={{ fontSize: "0.85rem" }}>Mesa no verificada o inválida:</strong>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.775rem", lineHeight: 1.4 }}>
                        El código de mesa indicado no existe o no es auténtico. Escanea el código QR físico de tu mesa, o selecciona &quot;Para Recoger&quot; / &quot;Domicilio&quot; arriba.
                      </p>
                    </div>
                  </div>
                ) : null
              )}

              {/* Customer Inputs for Takeout & Delivery */}
              {(orderType === "TAKEOUT" || orderType === "DELIVERY") && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, background: "#F8FAFC", padding: 14, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <div>
                    <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "#334155" }}>Nombre completo *</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", fontSize: "0.85rem", borderRadius: 6, border: "1px solid #CBD5E1", marginTop: 3, boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "#334155" }}>Teléfono móvil de contacto *</label>
                    <input
                      type="text"
                      placeholder="Ej. 3001234567"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", fontSize: "0.85rem", borderRadius: 6, border: "1px solid #CBD5E1", marginTop: 3, boxSizing: "border-box" }}
                    />
                  </div>

                  {orderType === "DELIVERY" && (
                    <div>
                      <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "#334155" }}>Dirección exacta de entrega *</label>
                      <input
                        type="text"
                        placeholder="Ej. Calle 10 # 4-20 Apt 301, Edificio Solar"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", fontSize: "0.85rem", borderRadius: 6, border: "1px solid #CBD5E1", marginTop: 3, boxSizing: "border-box" }}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Notas para el pedido (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Sin salsa, dejar en portería"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      style={{ width: "100%", padding: "6px 10px", fontSize: "0.8rem", borderRadius: 6, border: "1px solid #E2E8F0", marginTop: 2, boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              )}

              {/* Items List */}
              {cart.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemHeader}>
                    <h4 className={styles.itemName}>{item.menuItem.name}</h4>
                    <span className={styles.itemPrice}>{formatCOP(item.subtotal)}</span>
                  </div>
                  
                  {getModifiersText(item) && (
                    <p className={styles.modifiersList}>{getModifiersText(item)}</p>
                  )}

                  <div className={styles.itemFooter}>
                    <div className={styles.qtyControls}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        −
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Total a pagar</span>
              <span>{formatCOP(totalAmount)}</span>
            </div>
            {!isStoreOpen ? (
              <div style={{ padding: "12px", backgroundColor: "#FEE2E2", color: "#991B1B", borderRadius: "8px", textAlign: "center", fontSize: "14px", fontWeight: 500, marginTop: "8px" }}>
                El restaurante está cerrado en este momento.
              </div>
            ) : (
              <button
                className={styles.checkoutBtn}
                onClick={handleCheckout}
                disabled={isPending || isDineInBlocked || isValidatingTable}
                style={{
                  backgroundColor: isDineInBlocked ? "#94A3B8" : brandColor || "#0066FF",
                  color: buttonTextColor || "#FFFFFF",
                  cursor: isDineInBlocked ? "not-allowed" : "pointer",
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 size={20} className={styles.spin} /> Procesando...
                  </>
                ) : (
                  getCheckoutButtonLabel()
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
