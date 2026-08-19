"use client";

import React, { useState, useEffect } from "react";
import styles from "@/app/(public)/restaurant/[slug]/page.module.css";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isHighlighted: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  items: MenuItem[];
}

interface PublicMenuClientProps {
  tenantName: string;
  tenantDescription: string | null;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  brandColor: string;
  plan?: string;
  categories: Category[];
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
  tenantName,
  tenantDescription,
  logoUrl,
  phone,
  address,
  city,
  plan = "STARTER",
  categories,
}: PublicMenuClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(
    categories[0]?.id || ""
  );
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [showInfoModal, setShowInfoModal] = useState(false);

  const isFreeTier = plan === "STARTER";
  const waUrl = getWhatsAppUrl(phone, tenantName);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (showInfoModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showInfoModal]);

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

  const totalCartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const addToCart = (itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const handleCategoryTabClick = (
    catId: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    setActiveCategory(catId);

    // Scroll category tab button into view inside horizontal navbar
    e.currentTarget.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });

    // Scroll category section into view below sticky navbar
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
  };

  return (
    <div className={styles.lightWrapper}>
      {/* Top Announcement Bar */}
      <div className={styles.topAnnounceBar}>
        <span className={styles.announceText}>¡Gana puntos y recompensas!</span>
        <div className={styles.topActionsGroup}>
          <button
            type="button"
            className={styles.topCartBtn}
            onClick={() => {}}
          >
            Ver mi pedido {totalCartCount > 0 ? `(${totalCartCount})` : ""} ›
          </button>
        </div>
      </div>

      {/* Store Header Section */}
      <div className={styles.storeHeaderContainer}>
        <div className={styles.storeCard}>
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
              <span className={styles.openBadge}>
                <span className={styles.openDot} /> Abierto
              </span>
            </div>

            <div className={styles.storeButtonsRow}>
              <button
                type="button"
                className={styles.infoBtn}
                onClick={() => setShowInfoModal(true)}
              >
                <IconInfo /> Información y Horarios
              </button>

              <a
                href={waUrl}
                className={styles.whatsappCtaBtn}
              >
                <IconWhatsApp /> Escribir a WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Store Information & Horarios — Floating Modal Sheet Backdrop */}
      {showInfoModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className={styles.infoModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.infoModalHeader}>
              <h3>Información del Establecimiento</h3>
              <button
                type="button"
                className={styles.closeInfoBtn}
                onClick={() => setShowInfoModal(false)}
                aria-label="Cerrar ventana"
              >
                ✕
              </button>
            </div>

            {tenantDescription && (
              <p className={styles.infoModalDesc}>{tenantDescription}</p>
            )}

            <div className={styles.infoDetailsGrid}>
              <div className={styles.infoDetailItem}>
                <span className={styles.infoIcon}>
                  <IconClock />
                </span>
                <div>
                  <strong>Horarios de Atención</strong>
                  <p>Lunes a Domingo: 12:00 PM – 10:00 PM</p>
                  <p className={styles.subText}>Jornada continua</p>
                </div>
              </div>

              <div className={styles.infoDetailItem}>
                <span className={styles.infoIcon}>
                  <IconMapPin />
                </span>
                <div>
                  <strong>Ubicación Física</strong>
                  <p>{address || "Calle 93 # 15-40, Chapinero"}</p>
                  <p className={styles.subText}>{city || "Bogotá, Colombia"}</p>
                </div>
              </div>

              <div className={styles.infoDetailItem}>
                <span className={styles.infoIcon}>
                  <IconWhatsApp />
                </span>
                <div>
                  <strong>Atención por WhatsApp</strong>
                  <p>{phone || "+57 310 555 0000"}</p>
                  <a
                    href={waUrl}
                    className={styles.infoWaLink}
                  >
                    Abrir chat en WhatsApp →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav Controls & Category Tabs */}
      <div className={styles.controlsRow}>
        <button
          type="button"
          className={`${styles.iconControlBtn} ${
            showSearch ? styles["iconControlBtn--active"] : ""
          }`}
          onClick={() => setShowSearch(!showSearch)}
          aria-label="Buscar plato"
        >
          <IconSearch />
        </button>

        <nav className={styles.categoryNavTabs}>
          {filteredCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                className={`${styles.categoryTabBtn} ${
                  isActive ? styles["categoryTabBtn--active"] : ""
                }`}
                onClick={(e) => handleCategoryTabClick(cat.id, e)}
              >
                {cat.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search Input Bar */}
      {showSearch && (
        <div className={styles.searchBarContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar plato, ingrediente o bebida..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
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
      )}

      {/* Menu Categories & High Visibility Product Grid */}
      <div className={styles.categoriesContent}>
        {filteredCategories.length === 0 ? (
          <div className={styles.noResults}>
            <p className={styles.noResultsTitle}>No se encontraron platos</p>
            <p className={styles.noResultsSub}>Intenta con otro término de búsqueda.</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section
              key={category.id}
              id={`cat-sec-${category.id}`}
              className={styles.categorySection}
            >
              <h2 className={styles.categorySectionTitle}>{category.name}</h2>
              {category.description && (
                <p className={styles.categorySectionDesc}>{category.description}</p>
              )}

              {/* Responsive PC & Mobile Grid */}
              <div className={styles.productsGrid}>
                {category.items.map((item) => (
                  <div key={item.id} className={styles.productCard}>
                    {/* Left: Info & Price */}
                    <div className={styles.productLeftInfo}>
                      <h3 className={styles.productName}>{item.name}</h3>
                      {item.description && (
                        <p className={styles.productDesc}>{item.description}</p>
                      )}

                      <div className={styles.productPriceRow}>
                        <span className={styles.productPrice}>
                          {formatCOP(item.price)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Image with Blue Overlay Plus Button */}
                    <div className={styles.productRightImage}>
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

                      {/* Blue Plus Button Overlay on Image */}
                      <button
                        type="button"
                        className={styles.imagePlusBtn}
                        onClick={() => addToCart(item.id)}
                        aria-label={`Agregar ${item.name}`}
                        title="Agregar al pedido"
                      >
                        <IconPlus />
                        {cart[item.id] ? (
                          <span className={styles.cartCountBadge}>
                            {cart[item.id]}
                          </span>
                        ) : null}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Floating WhatsApp CTA */}
      <a
        href={waUrl}
        className={styles.floatingWaBtn}
        title="¿Dudas o pedidos especiales? Escríbenos a WhatsApp"
      >
        <IconWhatsApp />
        <span className={styles.floatingWaText}>WhatsApp</span>
      </a>

      {/* Subtle & Discrete Free Tier Footer */}
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
    </div>
  );
}
