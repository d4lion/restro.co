"use client";

import React, { useTransition } from "react";
import { X, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import styles from "./CartDrawer.module.css";
import { CartItem } from "./PublicMenuClient";
import { createPublicOrderAction } from "@/app/actions/orders";

interface Props {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  brandColor?: string;
  buttonTextColor?: string;
  isStoreOpen?: boolean;
}

export function CartDrawer({ tenantId, isOpen, onClose, cart, setCart, brandColor, buttonTextColor, isStoreOpen = true }: Props) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

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

  const handleCheckout = () => {
    if (cart.length === 0) return;

    startTransition(async () => {
      const orderData = {
        tenantId,
        type: "DINE_IN" as const, // For now, hardcoded to DINE_IN as per plan
        customerName: "Cliente Local", // In a real app we might ask this
        notes: "",
        items: cart.map((item) => {
          // Flatten selections for the action
          const modifiers = item.menuItem.modifierGroups?.flatMap((g) => {
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
        toast.success("¡Pedido enviado a cocina!");
        setCart([]);
        onClose();
      } else {
        toast.error(res.message || "Error al enviar el pedido");
      }
    });
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
            cart.map((item) => (
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
            ))
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
                disabled={isPending}
                style={{ backgroundColor: brandColor || "#0066FF", color: buttonTextColor || "#FFFFFF" }}
              >
                {isPending ? (
                  <>
                    <Loader2 size={20} className={styles.spin} /> Procesando...
                  </>
                ) : (
                  "Confirmar Pedido"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
