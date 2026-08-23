"use client";

import React, { useState, useEffect } from "react";
import styles from "@/app/(public)/restaurant/[slug]/page.module.css";
import { ItemConfiguratorModal, ConfiguratorItem } from "./ItemConfiguratorModal";
import { CartDrawer } from "./CartDrawer";

export interface CartItem {
  id: string;
  menuItem: ConfiguratorItem;
  quantity: number;
  selections: Record<string, string[]>;
  subtotal: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isHighlighted: boolean;
  modifierGroups?: any[];
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  items: MenuItem[];
}

interface PublicMenuClientProps {
  tenantId: string;
  tenantName: string;
  tenantDescription: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  brandColor: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  websiteUrl: string | null;
  plan?: string;
  categories: Category[];
  isOpen?: boolean;
  businessHours?: Array<{ dayOfWeek: number; openTime: string; closeTime: string }>;
  isMenuOnly?: boolean;
  allowDineIn?: boolean;
  requireTableQrForDineIn?: boolean;
  allowTakeout?: boolean;
  allowDelivery?: boolean;
  allowWhatsAppOrdering?: boolean;
  whatsappNumber?: string | null;
}

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconInfo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconWhatsApp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconMapPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconStore = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconInstagram = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const IconFacebook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.81l.19-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const IconTiktok = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
  </svg>
);

const IconGlobe = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const IconShoppingBag = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
    <path d="M3 6h18"></path>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);

/**
 * Universal WhatsApp deep link generator with Colombian country code auto-format.
 */
function getWhatsAppUrl(phoneStr: string | null, tenantNameStr: string) {
  let clean = phoneStr ? phoneStr.replace(/[^0-9]/g, "") : "";
  if (!clean) clean = "573105550000";
  if (clean.length === 10 && clean.startsWith("3")) {
    clean = "57" + clean;
  }
  const text = encodeURIComponent(
    `Hola ${tenantNameStr}, quisiera hacer una consulta sobre la carta digital.`
  );
  return `https://api.whatsapp.com/send?phone=${clean}&text=${text}`;
}

/**
 * Deterministic COP currency formatter (safe across SSR and client hydration)
 */
function formatCOP(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$ ${formatted}`;
}

export function PublicMenuClient({
  tenantId,
  tenantName,
  tenantDescription,
  logoUrl,
  coverUrl,
  phone,
  address,
  city,
  brandColor,
  instagramUrl,
  facebookUrl,
  tiktokUrl,
  websiteUrl,
  plan = "STARTER",
  categories,
  isOpen = true,
  businessHours = [],
  isMenuOnly = false,
  allowDineIn = true,
  requireTableQrForDineIn = true,
  allowTakeout = false,
  allowDelivery = false,
  allowWhatsAppOrdering = false,
  whatsappNumber = null,
}: PublicMenuClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ConfiguratorItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const isFreeTier = plan === "STARTER";
  const waUrl = getWhatsAppUrl(phone, tenantName);

  // Helper to determine text color over buttons
  const getContrastColor = (hexColor: string) => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#FFFFFF";
  };
  const buttonTextColor = getContrastColor(brandColor);


  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  const displayedCategories = activeCategory === "ALL" 
    ? filteredCategories 
    : filteredCategories.filter(cat => cat.id === activeCategory);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleAddToCart = (
    item: ConfiguratorItem,
    quantity: number,
    selections: Record<string, string[]>
  ) => {
    if (isMenuOnly) return;

    let unitPrice = item.price;
    if (item.modifierGroups) {
      item.modifierGroups.forEach((g) => {
        const selectedIds = selections[g.id] || [];
        g.options.forEach((opt) => {
          if (selectedIds.includes(opt.id)) {
            unitPrice += opt.priceExtra;
          }
        });
      });
    }

    const newItem: CartItem = {
      id: crypto.randomUUID(),
      menuItem: item,
      quantity,
      selections,
      subtotal: unitPrice * quantity,
    };

    setCart((prev) => [...prev, newItem]);
  };

  const handleCategoryTabClick = (
    catId: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    setActiveCategory(catId);

    e.currentTarget.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });

    if (catId === "ALL") return;

    setTimeout(() => {
      const sectionEl = document.getElementById(`cat-sec-${catId}`);
      if (sectionEl) {
        const headerOffset = 80;
        const elementPosition = sectionEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  return (
    <div className={styles.lightWrapper}>
      {/* Top Announcement Bar */}
      <div className={styles.topAnnounceBar} style={{ backgroundColor: brandColor, color: buttonTextColor }}>
        <span className={styles.announceText}>
          {isMenuOnly ? "Carta Digital Informativa — Consulta nuestros productos" : "¡Gana puntos y recompensas!"}
        </span>
        {!isMenuOnly && (
          <div className={styles.topActionsGroup}>
            <button
              type="button"
              className={styles.topCartBtn}
              onClick={() => setIsCartOpen(true)}
              style={{ backgroundColor: buttonTextColor, color: brandColor }}
            >
              Ver mi pedido {totalCartCount > 0 ? `(${totalCartCount})` : ""} ›
            </button>
          </div>
        )}
      </div>

      {/* Banner Section */}
      <div className={styles.bannerContainer}>
        {coverUrl ? (
          <img src={coverUrl} alt="Banner" className={styles.bannerImage} />
        ) : (
          <div className={styles.bannerPlaceholder} />
        )}
      </div>

      {/* Store Header Section - Overlapping Banner */}
      <div className={styles.storeHeaderContainer}>
        <div className={styles.storeCard}>
          <div className={styles.storeCardMain}>
            <div className={styles.storeAvatarBox}>
              {logoUrl ? (
                <img src={logoUrl} alt={tenantName} className={styles.storeAvatarImg} />
              ) : (
                <div className={styles.storeAvatarFallback}>
                  <IconStore />
                </div>
              )}
            </div>

            <div className={styles.storeMetaInfo}>
              <div className={styles.storeTitleRow}>
                <h1 className={styles.storeName}>{tenantName}</h1>
                {isOpen ? (
                  <span className={styles.openBadge}>
                    <span className={styles.openDot} /> Abierto
                  </span>
                ) : (
                  <span className={styles.openBadge} style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>
                    <span className={styles.openDot} style={{ backgroundColor: "#DC2626" }} /> Cerrado
                  </span>
                )}
              </div>
              
              <div className={styles.storeTagsRow}>
                {tenantDescription && <span className={styles.storeDesc}>{tenantDescription}</span>}
                <span className={styles.storeAddress}><IconMapPin /> {address || "Sin dirección"}, {city || "Colombia"}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.storeAccordions}>
            <details className={styles.infoAccordion}>
              <summary>
                <div className={styles.summaryContent}>
                  <IconMapPin /> <span>Contacto y redes</span>
                </div>
                <span className={styles.chevron}>▾</span>
              </summary>
              <div className={styles.accordionContent}>
                <p><strong>Ubicación:</strong> {address || "Sin dirección"}, {city || "Colombia"}</p>
                <p><strong>WhatsApp:</strong> {phone || "+57 310 555 0000"}</p>
                <a href={waUrl} className={styles.whatsappLink}><IconWhatsApp /> Escribir al WhatsApp</a>
                
                {(instagramUrl || facebookUrl || tiktokUrl || websiteUrl) && (
                  <div style={{ display: "flex", gap: "12px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                    {instagramUrl && (
                      <a href={instagramUrl} target="_blank" rel="noreferrer" style={{ color: brandColor, padding: "10px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                        <IconInstagram />
                      </a>
                    )}
                    {facebookUrl && (
                      <a href={facebookUrl} target="_blank" rel="noreferrer" style={{ color: brandColor, padding: "10px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                        <IconFacebook />
                      </a>
                    )}
                    {tiktokUrl && (
                      <a href={tiktokUrl} target="_blank" rel="noreferrer" style={{ color: brandColor, padding: "10px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                        <IconTiktok />
                      </a>
                    )}
                    {websiteUrl && (
                      <a href={websiteUrl} target="_blank" rel="noreferrer" style={{ color: brandColor, padding: "10px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                        <IconGlobe />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </details>
            
            <details className={styles.infoAccordion}>
              <summary>
                <div className={styles.summaryContent}>
                  <IconClock /> <span>Horarios de atención</span>
                </div>
                <span className={styles.chevron}>▾</span>
              </summary>
              <div className={styles.accordionContent}>
                {businessHours && businessHours.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[1, 2, 3, 4, 5, 6, 0].map((dayValue) => {
                      const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                      const blocks = businessHours.filter(h => h.dayOfWeek === dayValue);
                      
                      const formatT = (t: string) => {
                        const [h, m] = t.split(":");
                        let hi = parseInt(h, 10);
                        const am = hi >= 12 ? "PM" : "AM";
                        hi = hi % 12 || 12;
                        return `${hi}:${m} ${am}`;
                      };

                      if (blocks.length === 0) return null;
                      return (
                        <div key={dayValue} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                          <span style={{ fontWeight: 500 }}>{dayNames[dayValue]}</span>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                            {blocks.map((b, i) => (
                              <span key={i}>{formatT(b.openTime)} - {formatT(b.closeTime)}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "#64748B", fontStyle: "italic", fontSize: "14px" }}>Horario no configurado</p>
                )}
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className={styles.searchBarContainer}>
        <div className={styles.searchBox}>
          <IconSearch />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar en el menú..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Nav Controls & Category Tabs */}
      <div className={styles.controlsRow}>
        <nav className={styles.categoryNavTabs}>
          <button
            type="button"
            className={`${styles.categoryTabBtn} ${
              activeCategory === "ALL" ? styles["categoryTabBtn--active"] : ""
            }`}
            style={activeCategory === "ALL" ? { backgroundColor: brandColor, color: buttonTextColor, borderColor: brandColor } : {}}
            onClick={(e) => handleCategoryTabClick("ALL", e)}
          >
            Todos ({categories.reduce((acc, cat) => acc + cat.items.length, 0)})
          </button>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                className={`${styles.categoryTabBtn} ${
                  isActive ? styles["categoryTabBtn--active"] : ""
                }`}
                style={isActive ? { backgroundColor: brandColor, color: buttonTextColor, borderColor: brandColor } : {}}
                onClick={(e) => handleCategoryTabClick(cat.id, e)}
              >
                {cat.name.toUpperCase()} <span className={styles.catItemCount}>({cat.items.length})</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Menu Categories & Product Grid */}
      <div className={styles.categoriesContent}>
        {displayedCategories.length === 0 ? (
          <div className={styles.noResults}>
            <p className={styles.noResultsTitle}>No se encontraron platos</p>
            <p className={styles.noResultsSub}>Intenta con otro término de búsqueda o selecciona otra categoría.</p>
          </div>
        ) : (
          displayedCategories.map((category) => (
            <section
              key={category.id}
              id={`cat-sec-${category.id}`}
              className={styles.categorySection}
            >
              <h2 className={styles.categorySectionTitle}>{category.name.toUpperCase()}</h2>
              {category.description && (
                <p className={styles.categorySectionDesc}>{category.description}</p>
              )}

              <div className={styles.productsGrid}>
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className={styles.productCard}
                    onClick={() => !isMenuOnly && setSelectedProduct(item as ConfiguratorItem)}
                    style={{ cursor: isMenuOnly ? "default" : "pointer" }}
                  >
                    <div className={styles.productTopImage}>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className={styles.productImg}
                        />
                      ) : (
                        <div className={styles.productImgFallback}>
                          <span>{item.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.productBottomInfo}>
                      <h3 className={styles.productName}>{item.name}</h3>
                      {item.description && (
                        <p className={styles.productDesc}>{item.description}</p>
                      )}
                      
                      <div className={styles.productFooter}>
                        <span className={styles.productPrice} style={{ color: "#000000" }}>
                          {formatCOP(item.price)}
                        </span>
                        
                        {!isMenuOnly && (
                          <button
                            type="button"
                            className={styles.productAddBtn}
                            aria-label={`Agregar ${item.name}`}
                            title="Agregar al pedido"
                            style={{ backgroundColor: brandColor, color: buttonTextColor }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={buttonTextColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            {cart.filter((c) => c.menuItem.id === item.id).reduce((a, b) => a + b.quantity, 0) > 0 ? (
                              <span className={styles.cartCountBadge} style={{ backgroundColor: buttonTextColor, color: brandColor }}>
                                {cart.filter((c) => c.menuItem.id === item.id).reduce((a, b) => a + b.quantity, 0)}
                              </span>
                            ) : null}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Free Tier Footer */}
      {isFreeTier ? (
        <footer className={styles.freeTierFooterDiscrete}>
          <div className={styles.freeTierDiscreteRow}>
            <span className={styles.freeTierDiscreteText}>
              Lanza tu idea ahora con <strong>Restro</strong> · Carta digital gratis
            </span>
            <a
              href="/register"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.freeTierDiscreteBtn}
            >
              Crear gratis →
            </a>
          </div>

          <div className={styles.adamindBrandingRow}>
            <span>
              Powered with{" "}
              <a
                href="https://restro.adamind.cloud"
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong style={{ color: "#2D6CD9" }}>Restro</strong>
              </a>{" "}
              by ·{" "}
            </span>
            <a
              href="https://adamind.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.adamindLink}
            >
              <strong>Adamind Technologies</strong>
            </a>
          </div>
        </footer>
      ) : (
        <footer className={styles.paidFooter}>
          <span>
            Powered with Restro by <strong>Adamind Technologies</strong> ·{" "}
          </span>
          <a
            href="https://adamind.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.adamindLink}
          >
            adamind.cloud
          </a>
        </footer>
      )}

      {/* Item Configurator Modal */}
      {!isMenuOnly && (
        <ItemConfiguratorModal
          item={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          brandColor={brandColor}
          buttonTextColor={buttonTextColor}
        />
      )}

      {/* Cart Drawer */}
      {!isMenuOnly && (
        <CartDrawer
          tenantId={tenantId}
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          setCart={setCart}
          brandColor={brandColor}
          buttonTextColor={buttonTextColor}
          isStoreOpen={isOpen}
          allowDineIn={allowDineIn}
          requireTableQrForDineIn={requireTableQrForDineIn}
          allowTakeout={allowTakeout}
          allowDelivery={allowDelivery}
          allowWhatsAppOrdering={allowWhatsAppOrdering}
          whatsappNumber={whatsappNumber}
        />
      )}

      {/* Floating Sticky Cart Banner */}
      {!isMenuOnly && totalCartCount > 0 && (
        <div 
          className={styles.stickyCartBanner} 
          style={{ backgroundColor: brandColor, color: buttonTextColor }}
          onClick={() => setIsCartOpen(true)}
        >
          <div className={styles.stickyCartInfo}>
            <span className={styles.stickyCartCount} style={{ backgroundColor: buttonTextColor, color: brandColor }}>
              {totalCartCount}
            </span>
            <span className={styles.stickyCartTotal}>
              {formatCOP(cart.reduce((acc, item) => acc + item.subtotal, 0))}
            </span>
          </div>
          <div className={styles.stickyCartAction}>
            <span>Ver carrito</span>
            <IconShoppingBag />
          </div>
        </div>
      )}
    </div>
  );
}
