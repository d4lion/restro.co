import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import styles from "./page.module.css";

/* ─── SEO METADATA ──────────────────────────────────────────────────────────
   Motor SEO completo: title, description, og, twitter, canonical, keywords
───────────────────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "Restro — Carta Digital QR + IA para Restaurantes en Colombia",
  description:
    "Digitaliza tu carta en 10 minutos, recibe comandas en cocina en tiempo real y crece con inteligencia artificial. El SaaS #1 para restaurantes colombianos.",
  keywords: [
    "carta digital QR restaurante",
    "software para restaurantes Colombia",
    "sistema pedidos restaurante",
    "KDS cocina restaurante",
    "carta digital sin papel",
    "gestión restaurante SaaS",
    "IA para restaurantes",
    "carta digital Bogotá",
    "pedidos en línea restaurante",
    "administración restaurante digital",
  ],
  authors: [{ name: "Adamind", url: "https://adamind.co" }],
  creator: "Adamind",
  publisher: "Adamind",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Restro by Adamind",
    title: "Restro — Carta Digital QR + IA para Restaurantes",
    description:
      "Digitaliza tu carta en 10 minutos, recibe comandas en cocina en tiempo real y crece con inteligencia artificial. El SaaS #1 para restaurantes colombianos.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Restro — Carta Digital QR para Restaurantes en Colombia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restro — Carta Digital QR + IA para Restaurantes",
    description:
      "Digitaliza tu carta en 10 minutos y crece con inteligencia artificial. El SaaS para restaurantes colombianos.",
    images: ["/images/og-image.png"],
    creator: "@adamind_co",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL,
    languages: {
      "es-CO": process.env.NEXT_PUBLIC_APP_URL,
      es: process.env.NEXT_PUBLIC_APP_URL,
    },
  },
  category: "technology",
};

/* ─── JSON-LD STRUCTURED DATA ───────────────────────────────────────────────
   Organization + SoftwareApplication + FAQPage para Rich Snippets en Google
───────────────────────────────────────────────────────────────────────────── */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Adamind",
  url: "https://adamind.co",
  logo: `${process.env.NEXT_PUBLIC_APP_URL}/favicon.ico`,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: "Spanish",
  },
  sameAs: [],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Restro",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  description:
    "Plataforma SaaS para restaurantes colombianos. Carta digital QR, gestión de pedidos en tiempo real, KDS de cocina e inteligencia artificial analítica.",
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "0",
      priceCurrency: "COP",
      description: "Carta digital QR gratuita para restaurantes pequeños",
    },
    {
      "@type": "Offer",
      name: "Business",
      price: "49900",
      priceCurrency: "COP",
      description: "Gestión completa de mesas, pedidos y KDS de cocina",
    },
    {
      "@type": "Offer",
      name: "Restro IA",
      price: "99900",
      priceCurrency: "COP",
      description: "Todo Business más analítica con inteligencia artificial",
    },
  ],
  creator: {
    "@type": "Organization",
    name: "Adamind",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Cuánto tiempo tarda en activarse mi carta digital?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "En menos de 10 minutos. Solo regístrate, crea tu carta con categorías y platos, y obtén tu código QR listo para imprimir o compartir.",
      },
    },
    {
      "@type": "Question",
      name: "¿Necesito instalar alguna aplicación?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Restro funciona 100% desde el navegador. Tus clientes escanean el QR y ven la carta directamente en su teléfono sin descargar nada.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo gestionar múltiples sucursales?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Con el plan Business puedes gestionar múltiples sedes desde un único panel, con cartas y configuraciones independientes por sucursal.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué es el plan Restro IA?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Restro IA incluye análisis inteligente de tu negocio: predicción de horas pico, identificación de platos más rentables, sugerencias de combos y reportes automatizados con IA.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo cambiar de plan en cualquier momento?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Puedes hacer upgrade o downgrade de tu plan en cualquier momento desde la configuración de tu cuenta, sin permanencia mínima.",
      },
    },
    {
      "@type": "Question",
      name: "¿El plan Starter realmente es gratis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí, el plan Starter es completamente gratis e incluye carta digital QR, hasta 5 mesas y soporte básico. No requiere tarjeta de crédito.",
      },
    },
  ],
};

/* ─── FAQ ITEMS ─────────────────────────────────────────────────────────── */
const faqs = [
  {
    q: "¿Cuánto tiempo tarda en activarse mi carta digital?",
    a: "En menos de 10 minutos. Solo regístrate, crea tu carta con categorías y platos, y obtén tu código QR listo para imprimir o compartir.",
  },
  {
    q: "¿Necesito instalar alguna aplicación?",
    a: "No. Restro funciona 100% desde el navegador. Tus clientes escanean el QR y ven la carta directamente en su teléfono sin descargar nada.",
  },
  {
    q: "¿Puedo gestionar múltiples sucursales?",
    a: "Sí. Con el plan Business puedes gestionar múltiples sedes desde un único panel, con cartas y configuraciones independientes por sucursal.",
  },
  {
    q: "¿Qué es el plan Restro IA?",
    a: "Restro IA incluye análisis inteligente de tu negocio: predicción de horas pico, identificación de platos más rentables, sugerencias de combos y reportes automatizados con IA.",
  },
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. Puedes hacer upgrade o downgrade de tu plan en cualquier momento desde la configuración de tu cuenta, sin permanencia mínima.",
  },
  {
    q: "¿El plan Starter realmente es gratis?",
    a: "Sí, el plan Starter es completamente gratis e incluye carta digital QR, hasta 5 mesas y soporte básico. No requiere tarjeta de crédito.",
  },
];

/* ─── PAGE ──────────────────────────────────────────────────────────────── */
export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/overview");

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className={styles.page}>

        {/* ── NAVBAR ──────────────────────────────────────────────────── */}
        <nav className={styles.nav} role="navigation" aria-label="Navegación principal">
          <div className={styles.navInner}>
            <Link href="/" className={styles.navLogo} aria-label="Restro — Inicio">
              <img
                src="/images/logo/logo.png"
                alt="Restro logo"
                className={styles.navLogoIcon}
                width={32}
                height={32}
              />
              <span className={styles.navLogoText}>Restro</span>
            </Link>

            <ul className={styles.navLinks} role="list">
              <li><a href="#caracteristicas" className={styles.navLink}>Características</a></li>
              <li><a href="#precios" className={styles.navLink}>Precios</a></li>
              <li><a href="#faq" className={styles.navLink}>FAQ</a></li>
              <li>
                <Link href="/don-carlos" target="_blank" rel="noopener noreferrer" className={styles.navLink}>
                  Demo
                </Link>
              </li>
            </ul>

            <div className={styles.navActions}>
              <Link href="/login" className={styles.btnGhost}>
                Iniciar sesión
              </Link>
              <Link href="/register" className={styles.btnPrimary}>
                Empezar gratis
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <header className={styles.hero} role="banner">
          <div className={styles.heroBadge} aria-label="Diseñado para restaurantes colombianos">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="6" fill="#2563EB" />
              <path d="M3 6l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Diseñado para restaurantes · Colombia
          </div>

          <h1 className={styles.heroTitle}>
            La carta digital QR + IA{" "}
            <span className={styles.heroAccent}>que hacía falta</span>{" "}
            para tu restaurante
          </h1>

          <p className={styles.heroSub}>
            Digitaliza tu carta en 10 minutos, recibe comandas en cocina en tiempo real
            y crece con inteligencia artificial diseñada para restaurantes colombianos.
          </p>

          <div className={styles.heroCTA}>
            <Link href="/register" className={styles.btnPrimaryLg} id="hero-cta-register">
              Empezar gratis ahora
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/don-carlos"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnOutlineLg}
              id="hero-cta-demo"
            >
              Ver carta de ejemplo
            </Link>
          </div>

          <div className={styles.heroSocialProof} aria-label="Restaurantes usando Restro">
            <div className={styles.heroAvatars} aria-hidden="true">
              {[
                { bg: "#2563EB", letter: "L" },
                { bg: "#0D9488", letter: "M" },
                { bg: "#7C3AED", letter: "C" },
                { bg: "#D97706", letter: "P" },
                { bg: "#DC2626", letter: "S" },
              ].map(({ bg, letter }) => (
                <div
                  key={letter}
                  className={styles.heroAvatar}
                  style={{ background: bg }}
                  aria-hidden="true"
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className={styles.heroSocialText}>
              <strong>+120 restaurantes</strong> ya digitalizaron su carta con Restro
            </p>
          </div>
        </header>

        {/* ── HERO MOCKUP ─────────────────────────────────────────────── */}
        <div className={styles.heroMockupWrap} aria-hidden="true">
          <img
            src="/images/mockup-analytics.png"
            alt="Dashboard de Restro mostrando analítica en tiempo real"
            className={styles.heroMockup}
            width={1100}
            height={620}
            loading="eager"
          />
        </div>

        {/* ── LOGO BAR ────────────────────────────────────────────────── */}
        <section className={styles.logoBar} aria-label="Restaurantes que usan Restro">
          <div className={styles.logoBarInner}>
            <p className={styles.logoBarLabel}>Usado por restaurantes en toda Colombia</p>
            <div className={styles.logoBarItems} aria-hidden="true">
              {[
                "Don Carlos",
                "La Parrilla",
                "Sabor Bogotano",
                "Tacos & Co.",
                "El Rincón",
                "Mar & Tierra",
              ].map((name) => (
                <span key={name} className={styles.logoBarItem}>{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES GRID ───────────────────────────────────────────── */}
        <section
          id="caracteristicas"
          className={styles.featuresSection}
          aria-labelledby="features-title"
        >
          <div className={styles.featuresHeader}>
            <span className={styles.sectionLabel}>Características</span>
            <h2 id="features-title" className={styles.sectionTitle}>
              Todo lo que tu restaurante necesita, en un solo lugar
            </h2>
            <p className={styles.sectionSub}>
              Desde la carta digital hasta la analítica con IA, Restro cubre cada aspecto
              operativo de tu negocio de manera simple y potente.
            </p>
          </div>

          <div className={styles.featuresGrid} role="list">
            {[
              {
                icon: "📱",
                color: "blue",
                title: "Carta Digital QR",
                desc: "Mobile-first, sin apps, personalizada con tu logo y colores. Tus clientes escanean y navegan tu carta en segundos desde cualquier teléfono.",
              },
              {
                icon: "🍳",
                color: "teal",
                title: "KDS — Pantalla de Cocina",
                desc: "Comandas en tiempo real directamente a la pantalla de tu cocina. Cero errores de transcripción, cero papel, cero demoras por comunicación.",
              },
              {
                icon: "🤖",
                color: "violet",
                title: "Analítica con IA",
                desc: "Identifica tus platos estrella, predice horas pico, detecta tendencias de consumo y toma decisiones basadas en datos reales de tu restaurante.",
              },
              {
                icon: "💬",
                color: "amber",
                title: "Canal WhatsApp",
                desc: "Recibe pedidos directamente por WhatsApp sin necesidad de terceros. Conexión rápida con código QR, sin trámites complicados con Meta API.",
              },
            ].map((f) => (
              <article key={f.title} className={styles.featureCard} role="listitem">
                <div className={`${styles.featureIconWrap} ${styles[`featureIconWrap--${f.color}`]}`} aria-hidden="true">
                  {f.icon}
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── PRODUCT DEEP-DIVE 1: Carta Digital ───────────────────────── */}
        <section
          className={styles.productSection}
          aria-labelledby="pd-menu-title"
        >
          <div className={styles.productRow}>
            <div className={styles.productText}>
              <span className={styles.sectionLabel}>Carta Digital QR</span>
              <h2 id="pd-menu-title" className={styles.sectionTitle}>
                Tu menú completo, siempre actualizado, en el teléfono de tu cliente
              </h2>
              <p className={styles.sectionSub}>
                Olvídate de las cartas de papel desactualizadas. Gestiona categorías,
                platos, precios e imágenes en tiempo real desde tu panel.
              </p>
              <ul className={styles.productFeatureList} role="list">
                {[
                  "Carga imágenes de tus platos para aumentar las ventas hasta un 30%",
                  "Actualiza precios y disponibilidad en segundos, en tiempo real",
                  "Personaliza con el logo y colores de tu marca",
                  "Sin apps — funciona con cualquier teléfono que tenga cámara",
                ].map((item) => (
                  <li key={item} className={styles.productFeatureItem} role="listitem">
                    <span className={styles.productFeatureCheck} aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div>
                <Link href="/register" className={styles.btnPrimaryLg} id="menu-cta">
                  Crear mi carta gratis
                </Link>
              </div>
            </div>
            <div className={styles.productMockupWrap}>
              <img
                src="/images/mockup-menu.png"
                alt="Panel de gestión de carta digital de Restro con categorías y platos"
                className={styles.productMockup}
                width={580}
                height={400}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* ── PRODUCT DEEP-DIVE 2: KDS ──────────────────────────────────── */}
        <section
          className={styles.productSection}
          aria-labelledby="pd-kds-title"
          style={{ background: "#F8FAFC" }}
        >
          <div className={`${styles.productRow} ${styles["productRow--reverse"]}`}>
            <div className={styles.productText}>
              <span className={styles.sectionLabel}>KDS — Cocina Digital</span>
              <h2 id="pd-kds-title" className={styles.sectionTitle}>
                Comandas en tiempo real, directo a la pantalla de tu cocina
              </h2>
              <p className={styles.sectionSub}>
                Elimina los errores de pedido y las demoras por comunicación. Cada
                comanda llega instantáneamente con todos los detalles a tu equipo de cocina.
              </p>
              <ul className={styles.productFeatureList} role="list">
                {[
                  "Vista en tiempo real de todos los pedidos activos por mesa",
                  "Estados de pedido: Nuevo → En preparación → Listo",
                  "Soporte para pedidos a domicilio, para llevar y en mesa",
                  "Sin papel, sin errores de transcripción, sin delays",
                ].map((item) => (
                  <li key={item} className={styles.productFeatureItem} role="listitem">
                    <span className={styles.productFeatureCheck} aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div>
                <Link href="/register" className={styles.btnPrimaryLg} id="kds-cta">
                  Probar KDS gratis
                </Link>
              </div>
            </div>
            <div className={styles.productMockupWrap}>
              <img
                src="/images/mockup-kds.png"
                alt="KDS de Restro mostrando pedidos activos organizados por estado"
                className={styles.productMockup}
                width={580}
                height={400}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* ── PRODUCT DEEP-DIVE 3: IA ───────────────────────────────────── */}
        <section
          className={styles.productSection}
          aria-labelledby="pd-ai-title"
        >
          <div className={styles.productRow}>
            <div className={styles.productText}>
              <span className={styles.sectionLabel}>Restro IA</span>
              <h2 id="pd-ai-title" className={styles.sectionTitle}>
                Crece con inteligencia artificial diseñada para restaurantes
              </h2>
              <p className={styles.sectionSub}>
                Deja que los datos trabajen por ti. Restro IA analiza tus ventas
                y operaciones para entregarte insights accionables cada día.
              </p>
              <ul className={styles.productFeatureList} role="list">
                {[
                  "Predicción de horas pico para optimizar tu staff",
                  "Identificación automática de platos más rentables",
                  "Sugerencias de combos para aumentar el ticket promedio",
                  "Reportes semanales automáticos con resumen de negocio",
                ].map((item) => (
                  <li key={item} className={styles.productFeatureItem} role="listitem">
                    <span className={styles.productFeatureCheck} aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div>
                <Link href="/register" className={styles.btnPrimaryLg} id="ai-cta">
                  Activar Restro IA
                </Link>
              </div>
            </div>
            <div className={styles.productMockupWrap}>
              <img
                src="/images/mockup-analytics.png"
                alt="Dashboard de analítica IA de Restro con métricas de ventas y predicciones"
                className={styles.productMockup}
                width={580}
                height={400}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* ── STATS BAR ───────────────────────────────────────────────── */}
        <section className={styles.statsSection} aria-label="Estadísticas de Restro">
          <div className={styles.statsInner} role="list">
            {[
              { number: "+120", accent: false, label: "Restaurantes activos en Colombia" },
              { number: "10", accent: true, label: "Minutos para activar tu carta digital" },
              { number: "30%", accent: false, label: "Más ventas con imágenes en la carta" },
              { number: "0", accent: false, label: "Errores de pedido con KDS integrado" },
            ].map((s) => (
              <div key={s.label} className={styles.statItem} role="listitem">
                <span className={`${styles.statNumber} ${s.accent ? styles.statAccent : ""}`}>
                  {s.number}
                </span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING ─────────────────────────────────────────────────── */}
        <section
          id="precios"
          className={styles.pricingSection}
          aria-labelledby="pricing-title"
        >
          <div className={styles.pricingHeader}>
            <span className={styles.sectionLabel}>Precios</span>
            <h2 id="pricing-title" className={styles.sectionTitle}>
              Planes transparentes en pesos colombianos
            </h2>
            <p className={styles.sectionSub}>
              Sin cargos ocultos, sin permanencia mínima. Empieza gratis y escala
              cuando tu restaurante lo necesite.
            </p>
          </div>

          <div className={styles.pricingGrid} role="list">
            {/* Starter */}
            <article className={styles.planCard} role="listitem" aria-label="Plan Starter - Gratis">
              <div>
                <h3 className={styles.planName}>Starter</h3>
                <p className={styles.planDesc}>Para restaurantes que están comenzando su digitalización</p>
              </div>
              <div className={styles.planPriceWrap}>
                <span className={styles.planPrice}>Gratis</span>
                <span className={styles.planPricePeriod}>Para siempre</span>
              </div>
              <hr className={styles.planDivider} />
              <ul className={styles.planFeatureList} role="list">
                {[
                  "Carta digital QR personalizada",
                  "Hasta 30 platos en carta",
                  "Imágenes en cada plato",
                  "Hasta 5 mesas con QR",
                  "Panel de administración",
                ].map((f) => (
                  <li key={f} className={styles.planFeatureItem} role="listitem">
                    <span className={styles.planCheck} aria-hidden="true">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`${styles.planCTA} ${styles["planCTA--secondary"]}`} id="plan-starter-cta">
                Empezar gratis
              </Link>
            </article>

            {/* Business — featured */}
            <article
              className={`${styles.planCard} ${styles["planCard--featured"]}`}
              role="listitem"
              aria-label="Plan Business - $49.900 COP por mes"
            >
              <span className={styles.planBadge} aria-label="Plan recomendado">RECOMENDADO</span>
              <div>
                <h3 className={styles.planName}>Business</h3>
                <p className={styles.planDesc}>Para restaurantes que quieren crecer con operación digital completa</p>
              </div>
              <div className={styles.planPriceWrap}>
                <span className={`${styles.planPrice} ${styles["planPrice--featured"]}`}>
                  $49.900
                </span>
                <span className={styles.planPricePeriod}>COP / mes</span>
              </div>
              <hr className={styles.planDivider} />
              <ul className={styles.planFeatureList} role="list">
                {[
                  "Todo lo de Starter incluido",
                  "Platos ilimitados en carta",
                  "Hasta 30 mesas con QR",
                  "KDS — pantalla de cocina",
                  "Gestión de pedidos en tiempo real",
                  "Reportes básicos de ventas",
                  "Soporte prioritario",
                ].map((f) => (
                  <li key={f} className={styles.planFeatureItem} role="listitem">
                    <span className={styles.planCheck} aria-hidden="true">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`${styles.planCTA} ${styles["planCTA--primary"]}`} id="plan-business-cta">
                Comenzar Business
              </Link>
            </article>

            {/* Restro IA */}
            <article className={styles.planCard} role="listitem" aria-label="Plan Restro IA - $99.900 COP por mes">
              <div>
                <h3 className={styles.planName}>Restro IA ✦</h3>
                <p className={styles.planDesc}>Para restaurantes que quieren decisiones basadas en inteligencia artificial</p>
              </div>
              <div className={styles.planPriceWrap}>
                <span className={styles.planPrice}>$99.900</span>
                <span className={styles.planPricePeriod}>COP / mes</span>
              </div>
              <hr className={styles.planDivider} />
              <ul className={styles.planFeatureList} role="list">
                {[
                  "Todo lo de Business incluido",
                  "Mesas ilimitadas",
                  "Analítica avanzada con IA",
                  "Predicción de horas pico",
                  "Sugerencias de combos rentables",
                  "Reportes automáticos semanales",
                  "Exportar datos Excel / PDF",
                  "Cuentas de staff ilimitadas",
                ].map((f) => (
                  <li key={f} className={styles.planFeatureItem} role="listitem">
                    <span className={styles.planCheck} aria-hidden="true">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`${styles.planCTA} ${styles["planCTA--secondary"]}`} id="plan-ia-cta">
                Activar Restro IA
              </Link>
            </article>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section
          id="faq"
          className={styles.faqSection}
          aria-labelledby="faq-title"
        >
          <div className={styles.faqHeader}>
            <span className={styles.sectionLabel}>FAQ</span>
            <h2 id="faq-title" className={styles.sectionTitle}>
              Preguntas frecuentes
            </h2>
          </div>

          <div className={styles.faqList} role="list">
            {faqs.map((faq, i) => (
              <details key={i} className={styles.faqItem} role="listitem">
                <summary className={styles.faqQuestion}>
                  {faq.q}
                  <svg className={styles.faqChevron} viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <p className={styles.faqAnswer}>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ───────────────────────────────────────────────── */}
        <section className={styles.ctaSection} aria-labelledby="cta-final-title">
          <div className={styles.ctaInner}>
            <h2 id="cta-final-title" className={styles.ctaTitle}>
              Digitaliza tu restaurante hoy mismo
            </h2>
            <p className={styles.ctaSub}>
              Únete a los +120 restaurantes colombianos que ya tienen su carta digital
              activa. Empieza gratis, sin tarjeta de crédito.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/register" className={styles.btnPrimaryLgWhite} id="footer-cta-register">
                Crear cuenta gratis
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/don-carlos" target="_blank" rel="noopener noreferrer" className={styles.btnOutlineLgWhite} id="footer-cta-demo">
                Ver demo
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <footer className={styles.footer} role="contentinfo">
          <div className={styles.footerInner}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo} aria-label="Restro">
                <img
                  src="/images/logo/logo.png"
                  alt="Restro logo"
                  width={28}
                  height={28}
                  style={{ borderRadius: 6, display: 'block' }}
                />
                <span className={styles.footerLogoText}>Restro</span>
              </div>
              <p className={styles.footerTagline}>
                La plataforma SaaS de carta digital, gestión de pedidos e inteligencia
                artificial para restaurantes colombianos.
              </p>
            </div>

            <nav className={styles.footerCol} aria-label="Producto">
              <span className={styles.footerColTitle}>Producto</span>
              <ul className={styles.footerLinks} role="list">
                <li><a href="#caracteristicas" className={styles.footerLink}>Características</a></li>
                <li><a href="#precios" className={styles.footerLink}>Precios</a></li>
                <li>
                  <Link href="/don-carlos" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
                    Demo
                  </Link>
                </li>
                <li><a href="#faq" className={styles.footerLink}>FAQ</a></li>
              </ul>
            </nav>

            <nav className={styles.footerCol} aria-label="Cuenta">
              <span className={styles.footerColTitle}>Cuenta</span>
              <ul className={styles.footerLinks} role="list">
                <li>
                  <Link href="/register" className={styles.footerLink}>Crear cuenta gratis</Link>
                </li>
                <li>
                  <Link href="/login" className={styles.footerLink}>Iniciar sesión</Link>
                </li>
              </ul>
            </nav>

            <nav className={styles.footerCol} aria-label="Empresa">
              <span className={styles.footerColTitle}>Empresa</span>
              <ul className={styles.footerLinks} role="list">
                <li>
                  <a href="https://adamind.co" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
                    Adamind
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.footerCopy}>
              © {new Date().getFullYear()} Restro · Un producto de{" "}
              <a href="https://adamind.co" target="_blank" rel="noopener noreferrer" style={{ color: "#64748B" }}>
                Adamind
              </a>{" "}
              · Colombia 🇨🇴
            </p>
            <ul className={styles.footerCopyLinks} role="list">
              <li><a href="/privacy" className={styles.footerCopyLink}>Privacidad</a></li>
              <li><a href="/terms" className={styles.footerCopyLink}>Términos</a></li>
            </ul>
          </div>
        </footer>

      </div>
    </>
  );
}
