"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Share2, Check } from "lucide-react";
import styles from "./ItemConfiguratorModal.module.css";
import { trackTelemetryEvent, TELEMETRY_EVENTS } from "@/lib/telemetry";

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

/**
 * Generates a readable URL slug for sharing a dish via ?activeProductView=...
 */
export function getProductShareSlug(item: { id: string; name: string }): string {
  const slug = item.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || item.id;
}

/**
 * Finds a menu item matching the ?activeProductView=... URL query parameter (by slug or ID).
 */
export function findProductByViewParam<T extends { id: string; name: string }>(
  items: T[],
  paramValue: string | null | undefined
): T | null {
  if (!paramValue) return null;
  const normalized = decodeURIComponent(paramValue).trim().toLowerCase();
  if (!normalized) return null;

  return (
    items.find(
      (item) =>
        item.id.toLowerCase() === normalized ||
        getProductShareSlug(item) === normalized ||
        `${getProductShareSlug(item)}-${item.id.slice(0, 4).toLowerCase()}` === normalized
    ) ?? null
  );
}

interface Props {
  tenantId?: string;
  item: ConfiguratorItem | null;
  onClose: () => void;
  onAddToCart: (
    item: ConfiguratorItem,
    quantity: number,
    selections: Record<string, string[]>
  ) => void;
  brandColor?: string;
  buttonTextColor?: string;
  isMenuOnly?: boolean;
}

export function ItemConfiguratorModal({
  tenantId,
  item,
  onClose,
  onAddToCart,
  brandColor,
  buttonTextColor,
  isMenuOnly = false,
}: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Telemetry state for product dwell time & interaction depth
  const openedAtRef = useRef<number>(0);
  const modifiersToggledRef = useRef<number>(0);
  const sharedDuringViewRef = useRef<boolean>(false);
  const dwellFlushedForItemIdRef = useRef<string | null>(null);
  const quantityRef = useRef<number>(1);
  quantityRef.current = quantity;

  const flushProductDwell = (
    targetItem: ConfiguratorItem,
    actionTaken: "added_to_cart" | "closed_without_adding" | "page_hidden"
  ) => {
    if (!tenantId || !openedAtRef.current) return;
    if (dwellFlushedForItemIdRef.current === targetItem.id) return;

    const dwellTimeMs = Math.max(0, Date.now() - openedAtRef.current);
    dwellFlushedForItemIdRef.current = targetItem.id;

    if (dwellTimeMs < 50) return;

    trackTelemetryEvent(tenantId, TELEMETRY_EVENTS.ITEM_DWELL, {
      itemId: targetItem.id,
      itemName: targetItem.name,
      price: targetItem.price,
      dwellTimeMs,
      dwellTimeSeconds: Math.round((dwellTimeMs / 1000) * 10) / 10,
      actionTaken,
      modifiersToggledCount: modifiersToggledRef.current,
      quantitySelected: quantityRef.current,
      sharedDuringView: sharedDuringViewRef.current,
      isMenuOnly,
    });
  };

  useEffect(() => {
    if (item) {
      // eslint-disable-next-line
      setQuantity(1);
      setSelections({});
      setCopiedShareLink(false);

      openedAtRef.current = Date.now();
      modifiersToggledRef.current = 0;
      sharedDuringViewRef.current = false;
      dwellFlushedForItemIdRef.current = null;

      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          flushProductDwell(item, "page_hidden");
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        flushProductDwell(item, "closed_without_adding");
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, tenantId]);

  if (!item) return null;

  const handleCloseModal = () => {
    flushProductDwell(item, "closed_without_adding");
    onClose();
  };

  const handleShareProduct = async () => {
    if (typeof window === "undefined") return;
    try {
      const shareSlug = getProductShareSlug(item);
      const shareUrlObj = new URL(window.location.origin + window.location.pathname);
      shareUrlObj.searchParams.set("activeProductView", shareSlug);
      const shareUrl = shareUrlObj.toString();

      const shareData: ShareData = {
        title: item.name,
        text: item.description
          ? `${item.name} — ${item.description}`
          : `Mira ${item.name} en la carta digital`,
        url: shareUrl,
      };

      const recordShareTelemetry = (method: "native_share" | "clipboard_copy") => {
        sharedDuringViewRef.current = true;
        if (tenantId) {
          trackTelemetryEvent(tenantId, TELEMETRY_EVENTS.ITEM_SHARE, {
            itemId: item.id,
            itemName: item.name,
            price: item.price,
            shareSlug,
            method,
            dwellTimeBeforeShareMs: openedAtRef.current ? Date.now() - openedAtRef.current : 0,
          });
        }
      };

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          if (!navigator.canShare || navigator.canShare(shareData)) {
            await navigator.share(shareData);
            recordShareTelemetry("native_share");
            return;
          }
        } catch (shareErr: unknown) {
          if (shareErr instanceof Error && shareErr.name === "AbortError") {
            return;
          }
        }
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedShareLink(true);
        recordShareTelemetry("clipboard_copy");
        setTimeout(() => setCopiedShareLink(false), 2200);
      }
    } catch {
      // Ignore clipboard/share errors in restricted contexts
    }
  };

  const handleOptionToggle = (groupId: string, optionId: string, maxSelections: number) => {
    if (isMenuOnly) return;

    modifiersToggledRef.current += 1;

    const group = item.modifierGroups?.find((g) => g.id === groupId);
    const option = group?.options.find((o) => o.id === optionId);
    const currentlySelected = (selections[groupId] || []).includes(optionId);

    if (tenantId) {
      trackTelemetryEvent(tenantId, TELEMETRY_EVENTS.MODIFIER_INTERACTION, {
        itemId: item.id,
        itemName: item.name,
        groupId,
        groupName: group?.name ?? null,
        optionId,
        optionName: option?.name ?? null,
        priceExtra: option?.priceExtra ?? 0,
        action: currentlySelected ? "deselect" : "select",
      });
    }

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
    <div className={styles.overlay} onClick={handleCloseModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {item.imageUrl && (
          <div className={styles.imageBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.name} className={styles.productImg} />
            <button className={styles.closeBtn} onClick={handleCloseModal} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        )}

        <div className={styles.header}>
          {!item.imageUrl && (
            <button
              className={styles.closeBtn}
              style={{ position: "absolute", top: 12, right: 12, background: "#f1f5f9", color: "#334155" }}
              onClick={handleCloseModal}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          )}
          <h2 className={styles.title}>{item.name}</h2>
          {item.description && <p className={styles.desc}>{item.description}</p>}
          <div className={styles.priceAndShareRow}>
            <span className={styles.price}>{formatCOP(item.price)}</span>
            <button
              type="button"
              data-testid="discrete-share-product-btn"
              className={`${styles.discreteShareBtn} ${
                copiedShareLink ? styles.discreteShareBtnCopied : ""
              }`}
              style={
                !copiedShareLink
                  ? {
                      backgroundColor: brandColor || "#2563eb",
                      color: buttonTextColor || "#FFFFFF",
                    }
                  : undefined
              }
              onClick={handleShareProduct}
              title="Compartir este plato"
              aria-label="Compartir plato"
            >
              {copiedShareLink ? <Check size={14} /> : <Share2 size={14} />}
              <span>{copiedShareLink ? "Enlace copiado" : "Compartir"}</span>
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {item.modifierGroups?.map((g) => {
            const selectedOptionIds = selections[g.id] || [];
            const isSingle = g.maxSelections === 1;

            return (
              <div key={g.id} className={styles.group}>
                <div className={styles.groupHeader}>
                  <div>
                    <h4 className={styles.groupTitle}>{g.name}</h4>
                    {g.maxSelections > 1 && (
                      <span className={styles.groupHint}>
                        {g.minSelections > 0
                          ? `Mínimo ${g.minSelections} · Máximo ${g.maxSelections} opciones`
                          : `Hasta ${g.maxSelections} opciones`}
                      </span>
                    )}
                  </div>
                  {g.isRequired ? (
                    <span className={styles.badgeRequired}>Obligatorio</span>
                  ) : (
                    <span className={styles.badgeOptional}>Opcional</span>
                  )}
                </div>

                <div>
                  {g.options.filter((o) => o.isAvailable).map((opt) => {
                    const isSelected = selectedOptionIds.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`${styles.optionRow} ${isMenuOnly ? styles.optionRowReadOnly : ""}`}
                        onClick={() => {
                          if (!isMenuOnly) {
                            handleOptionToggle(g.id, opt.id, g.maxSelections);
                          }
                        }}
                      >
                        <div className={styles.optionLeft}>
                          {isMenuOnly ? (
                            <span className={styles.readOnlyBullet} aria-hidden="true" />
                          ) : (
                            <input
                              type={isSingle ? "radio" : "checkbox"}
                              checked={isSelected}
                              readOnly
                              className={styles.nativeInput}
                            />
                          )}
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

        {isMenuOnly ? (
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.closeInfoBtn}
              onClick={handleCloseModal}
            >
              Cerrar
            </button>
          </div>
        ) : (
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
                flushProductDwell(item, "added_to_cart");
                onAddToCart(item, quantity, selections);
                onClose();
              }}
            >
              <span>Agregar</span>
              <span>{formatCOP(calculateTotal())}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
