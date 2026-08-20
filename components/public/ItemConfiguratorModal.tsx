"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import styles from "./ItemConfiguratorModal.module.css";

interface ModifierOption {
  id: string;
  name: string;
  priceExtra: number;
  isAvailable: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
}

export interface ConfiguratorItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  modifierGroups?: ModifierGroup[];
}

interface Props {
  item: ConfiguratorItem | null;
  onClose: () => void;
  onAddToCart: (
    item: ConfiguratorItem,
    quantity: number,
    selections: Record<string, string[]>
  ) => void;
  brandColor?: string;
  buttonTextColor?: string;
}

export function ItemConfiguratorModal({ item, onClose, onAddToCart, brandColor, buttonTextColor }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (item) {
      // eslint-disable-next-line
      setQuantity(1);
      setSelections({});
    }
  }, [item]);

  if (!item) return null;

  const handleOptionToggle = (groupId: string, optionId: string, maxSelections: number) => {
    setSelections((prev) => {
      const groupSelections = prev[groupId] || [];
      const isSelected = groupSelections.includes(optionId);

      if (isSelected) {
        // Deselect
        return {
          ...prev,
          [groupId]: groupSelections.filter((id) => id !== optionId),
        };
      } else {
        // Select
        if (maxSelections === 1) {
          // Replace single selection (Radio behavior)
          return { ...prev, [groupId]: [optionId] };
        } else {
          // Check limits (Checkbox behavior)
          if (groupSelections.length >= maxSelections) {
            return prev; // Limit reached
          }
          return { ...prev, [groupId]: [...groupSelections, optionId] };
        }
      }
    });
  };

  const calculateTotal = () => {
    let total = item.price;
    if (item.modifierGroups) {
      item.modifierGroups.forEach((g) => {
        const selectedOptionIds = selections[g.id] || [];
        g.options.forEach((opt) => {
          if (selectedOptionIds.includes(opt.id)) {
            total += opt.priceExtra;
          }
        });
      });
    }
    return total * quantity;
  };

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  // Validation
  const isValid = () => {
    if (!item.modifierGroups) return true;
    for (const g of item.modifierGroups) {
      const selectedCount = (selections[g.id] || []).length;
      if (selectedCount < g.minSelections) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {item.imageUrl && (
          <div className={styles.imageBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.name} className={styles.productImg} />
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        )}

        <div className={styles.header}>
          {!item.imageUrl && (
            <button
              className={styles.closeBtn}
              style={{ position: "absolute", top: 12, right: 12, background: "#f1f5f9", color: "#334155" }}
              onClick={onClose}
            >
              <X size={18} />
            </button>
          )}
          <h2 className={styles.title}>{item.name}</h2>
          {item.description && <p className={styles.desc}>{item.description}</p>}
          <span className={styles.price}>{formatCOP(item.price)}</span>
        </div>

        <div className={styles.content}>
          {item.modifierGroups?.map((g) => {
            const selectedOptionIds = selections[g.id] || [];
            const isSingle = g.maxSelections === 1;

            return (
              <div key={g.id} className={styles.group}>
                <div className={styles.groupHeader}>
                  <h4 className={styles.groupTitle}>{g.name}</h4>
                  {g.isRequired ? (
                    <span className={styles.badgeRequired}>Obligatorio</span>
                  ) : (
                    <span className={styles.badgeOptional}>Opcional</span>
                  )}
                </div>

                <div>
                  {g.options.filter(o => o.isAvailable).map((opt) => {
                    const isSelected = selectedOptionIds.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={styles.optionRow}
                        onClick={() => handleOptionToggle(g.id, opt.id, g.maxSelections)}
                      >
                        <div className={styles.optionLeft}>
                          <input
                            type={isSingle ? "radio" : "checkbox"}
                            checked={isSelected}
                            readOnly
                            className={styles.nativeInput}
                          />
                          <span className={styles.optionName}>{opt.name}</span>
                        </div>
                        <div className={styles.optionRight}>
                          <span className={styles.optionPrice}>
                            {opt.priceExtra > 0 ? `+${formatCOP(opt.priceExtra)}` : "Gratis"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.qtyBox}>
            <button
              className={styles.qtyBtn}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className={styles.qtyValue}>{quantity}</span>
            <button className={styles.qtyBtn} onClick={() => setQuantity((q) => q + 1)}>
              +
            </button>
          </div>
          <button
            className={styles.addBtn}
            disabled={!isValid()}
            style={{ backgroundColor: brandColor || "#0066FF", color: buttonTextColor || "#FFFFFF" }}
            onClick={() => {
              onAddToCart(item, quantity, selections);
              onClose();
            }}
          >
            <span>Agregar</span>
            <span>{formatCOP(calculateTotal())}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
