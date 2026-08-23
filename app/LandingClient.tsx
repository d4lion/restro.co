"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Check, ArrowRight, Sparkles, QrCode, MonitorCheck, BrainCircuit, MessageSquare, TrendingUp } from "lucide-react";
import styles from "./page.module.css";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

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

export default function LandingClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    // 1. Hero Animations
    const tl = gsap.timeline();
    
    tl.fromTo(".hero-title-line", 
      { y: 80, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power4.out" }
    )
    .fromTo(`.${styles.heroSub}`, 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 
      "-=0.6"
    )
    .fromTo(`.${styles.heroCTA}`, 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 
      "-=0.6"
    );

    // 2. Navbar blur on scroll
    ScrollTrigger.create({
      start: "top -80",
      end: 99999,
      toggleClass: { className: styles.navScrolled, targets: `.${styles.nav}` }
    });

    // 3. Scroll Reveal for Sections
    const revealElements = gsap.utils.toArray(".reveal-up");
    revealElements.forEach((el: any) => {
      gsap.fromTo(el, 
        { y: 60, opacity: 0 },
        { 
          y: 0, opacity: 1, 
          duration: 0.8, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          }
        }
      );
    });

    // 4. Staggered Grid reveals
    const grids = gsap.utils.toArray(".stagger-grid");
    grids.forEach((grid: any) => {
      const children = grid.children;
      gsap.fromTo(children, 
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: grid,
            start: "top 85%"
          }
        }
      );
    });

    // 5. Lulo Bank Style 3D Floating Scroll Showcase Animation (Section 2)
    const mm = gsap.matchMedia();

    mm.add("(min-width: 993px)", () => {
      const luloTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#hero-mockup-section",
          start: "top 80%",
          end: "top 30%", // Concluye temprano en el scroll para que el texto y las tarjetas queden 100% fijas y legibles!
          scrub: 0.8,
        }
      });

      luloTl
        // Text enters from left to right and locks in place
        .fromTo("#hero-mockup-text",
          { x: -120, opacity: 0 },
          { x: 0, opacity: 1, ease: "power2.out" }
        )
        // Move container with subtle front-facing 3D perspective
        .fromTo("#lulo-stack-container",
          { 
            rotateY: 0, 
            rotateX: 0, 
            rotateZ: 0, 
            scale: 1,
          },
          { 
            rotateY: -5,  // Casi de frente para máxima legibilidad y presencia
            rotateX: 5,   // Elevación 3D muy suave
            rotateZ: -1.5,
            scale: 0.92,
            ease: "power1.out" 
          },
          "<"
        )
        // Fan out cards 1, 2, 3 facing forward towards the user
        .fromTo("#lulo-card-1",
          { y: 0, z: 0, rotateZ: 0 },
          { y: -75, z: 40, rotateZ: -1, ease: "power1.out" },
          "<"
        )
        .fromTo("#lulo-card-2",
          { y: 0, z: 0, rotateZ: 0, opacity: 0.9 },
          { y: 30, z: 0, x: 15, rotateZ: 1, opacity: 1, ease: "power1.out" },
          "<"
        )
        .fromTo("#lulo-card-3",
          { y: 0, z: 0, rotateZ: 0, opacity: 0.8 },
          { y: 135, z: -40, x: 30, rotateZ: 2, opacity: 1, ease: "power1.out" },
          "<"
        );

      // 2. Product deep dive traveling cards (Cards travel down from the top stack into their respective section slots!)
      const card1 = document.getElementById("lulo-card-1");
      const slotMenu = document.getElementById("mockup-slot-menu");

      const card2 = document.getElementById("lulo-card-2");
      const slotKds = document.getElementById("mockup-slot-kds");

      const card3 = document.getElementById("lulo-card-3");
      const slotIa = document.getElementById("mockup-slot-ia");

      // Card 1 (Carta Digital QR) travels down to "Tu menú siempre actualizado"
      if (card1 && slotMenu) {
        gsap.to(card1, {
          y: () => {
            const cardRect = card1.getBoundingClientRect();
            const slotRect = slotMenu.getBoundingClientRect();
            const currentY = parseFloat(gsap.getProperty(card1, "y") as string || "0");
            const cardDocTop = cardRect.top + window.scrollY - currentY;
            const slotDocTop = slotRect.top + window.scrollY;
            return slotDocTop - cardDocTop;
          },
          x: () => {
            const cardRect = card1.getBoundingClientRect();
            const slotRect = slotMenu.getBoundingClientRect();
            const currentX = parseFloat(gsap.getProperty(card1, "x") as string || "0");
            const cardDocLeft = cardRect.left + window.scrollX - currentX;
            const slotDocLeft = slotRect.left + window.scrollX;
            return slotDocLeft - cardDocLeft;
          },
          rotateY: 0,
          rotateX: 0,
          rotateZ: 0,
          scale: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: "#product-menu-section",
            start: "top 85%",
            end: "top 30%",
            scrub: 0.8,
            invalidateOnRefresh: true,
          }
        });
      }

      // Card 2 (KDS Cocina) travels down to "Comandas directo a cocina"
      if (card2 && slotKds) {
        gsap.to(card2, {
          y: () => {
            const cardRect = card2.getBoundingClientRect();
            const slotRect = slotKds.getBoundingClientRect();
            const currentY = parseFloat(gsap.getProperty(card2, "y") as string || "0");
            const cardDocTop = cardRect.top + window.scrollY - currentY;
            const slotDocTop = slotRect.top + window.scrollY;
            return slotDocTop - cardDocTop;
          },
          x: () => {
            const cardRect = card2.getBoundingClientRect();
            const slotRect = slotKds.getBoundingClientRect();
            const currentX = parseFloat(gsap.getProperty(card2, "x") as string || "0");
            const cardDocLeft = cardRect.left + window.scrollX - currentX;
            const slotDocLeft = slotRect.left + window.scrollX;
            return slotDocLeft - cardDocLeft;
          },
          rotateY: 0,
          rotateX: 0,
          rotateZ: 0,
          scale: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: "#product-kds-section",
            start: "top 85%",
            end: "top 30%",
            scrub: 0.8,
            invalidateOnRefresh: true,
          }
        });
      }

      // Card 3 (Restro IA) travels down to "Crece con Inteligencia"
      if (card3 && slotIa) {
        gsap.to(card3, {
          y: () => {
            const cardRect = card3.getBoundingClientRect();
            const slotRect = slotIa.getBoundingClientRect();
            const currentY = parseFloat(gsap.getProperty(card3, "y") as string || "0");
            const cardDocTop = cardRect.top + window.scrollY - currentY;
            const slotDocTop = slotRect.top + window.scrollY;
            return slotDocTop - cardDocTop;
          },
          x: () => {
            const cardRect = card3.getBoundingClientRect();
            const slotRect = slotIa.getBoundingClientRect();
            const currentX = parseFloat(gsap.getProperty(card3, "x") as string || "0");
            const cardDocLeft = cardRect.left + window.scrollX - currentX;
            const slotDocLeft = slotRect.left + window.scrollX;
            return slotDocLeft - cardDocLeft;
          },
          rotateY: 0,
          rotateX: 0,
          rotateZ: 0,
          scale: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: "#product-ia-section",
            start: "top 85%",
            end: "top 30%",
            scrub: 0.8,
            invalidateOnRefresh: true,
          }
        });
      }
      // 3. Dynamic text animations coming from center/sides as traveling cards arrive
      gsap.fromTo("#text-menu",
        { x: -80, opacity: 0, scale: 0.96 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#product-menu-section",
            start: "top 85%",
            end: "top 35%",
            scrub: 1,
          }
        }
      );

      gsap.fromTo("#text-kds",
        { x: 80, opacity: 0, scale: 0.96 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#product-kds-section",
            start: "top 85%",
            end: "top 35%",
            scrub: 1,
          }
        }
      );

      gsap.fromTo("#text-ia",
        { x: -80, opacity: 0, scale: 0.96 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#product-ia-section",
            start: "top 85%",
            end: "top 35%",
            scrub: 1,
          }
        }
      );
    });

    mm.add("(max-width: 992px)", () => {
      const luloTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#hero-mockup-section",
          start: "top 85%",
          end: "top 40%",
          scrub: 0.8,
        }
      });

      luloTl
        .fromTo("#hero-mockup-text",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, ease: "none" }
        )
        .fromTo("#lulo-card-1",
          { y: 30, opacity: 0.8 },
          { y: 0, opacity: 1, ease: "none" },
          "<"
        );
    });

  }, { scope: containerRef });

  return (
    <div className={styles.page} ref={containerRef}>
      
      {/* ── NAVBAR ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navLogo}>
            <Image width={32} height={32} src="/images/logo/logo.png" alt="Restro logo" className={styles.navLogoIcon} />
            <span className={styles.navLogoText}>Restro</span>
          </Link>
          <ul className={styles.navLinks}>
            <li><a href="#caracteristicas" className={styles.navLink}>Características</a></li>
            <li><a href="#precios" className={styles.navLink}>Precios</a></li>
            <li><a href="#faq" className={styles.navLink}>FAQ</a></li>
            <li><Link href="/don-carlos" className={styles.navLink}>Demo</Link></li>
          </ul>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.btnGhost}>Iniciar sesión</Link>
            <Link href="/register" className={styles.btnPrimary}>Empezar gratis</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="6" fill="#2563EB" /><path d="M3 6l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Diseñado para restaurantes · Colombia
          </div>
          
          <h1 className={styles.heroTitle}>
            <span className="hero-title-line">No adivines como va tu</span>
            <span className="hero-title-line"><span className={styles.heroTitleAccent}>negocio</span></span>
          </h1>
          
          <p className={styles.heroSub}>
            Centraliza tus pedidos, ventas y datos en un solo lugar. Mira tus métricas, descubre oportunidades y toma mejores decisiones con ayuda de inteligencia artificial.
          </p>
          
          <div className={styles.heroCTA}>
            <Link href="/register" className={styles.btnPrimaryLg}>
              Empezar gratis <ArrowRight size={18} />
            </Link>
            <a href="#caracteristicas" className={styles.btnOutlineLg}>
              Conocer Restro
            </a>
          </div>

          <div className={styles.heroSocialProof}>
            <div className={styles.heroAvatars}>
              {[{bg: "#2563EB", l: "L"}, {bg: "#0D9488", l: "M"}, {bg: "#7C3AED", l: "C"}, {bg: "#D97706", l: "P"}, {bg: "#DC2626", l: "S"}].map((a, i) => (
                <div key={i} className={styles.heroAvatar} style={{ background: a.bg }}>{a.l}</div>
              ))}
            </div>
            <p className={styles.heroSocialText}>
              <strong>+120 restaurantes</strong> ya digitalizaron su carta con Restro
            </p>
          </div>
        </div>
      </header>

      {/* ── MOCKUP HERO SHOWCASE (LULO BANK STYLE 3D FLOATING SCROLL SECTION) ── */}
      <section className={styles.heroMockupSection} id="hero-mockup-section">
        <div className={styles.heroMockupContainer}>
          
          {/* Left Text Content (slides in from left to right) */}
          <div className={styles.heroMockupTextSide} id="hero-mockup-text">
            <div className={styles.showcaseTag}>
              <Sparkles size={14} /> La Revolución de tu Restaurante
            </div>
            <h2 className={styles.showcaseTitle}>
              Una plataforma integral que hace crecer tu negocio
            </h2>
            <p className={styles.showcaseDesc}>
              Olvídate del desorden y las comandas en papel. Centraliza tu carta digital, la cocina y tus métricas con inteligencia artificial en un ecosistema flotante en tiempo real.
            </p>

            <ul className={styles.luloFeatureList}>
              <li>
                <span className={styles.luloCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                <div><strong>Carta Digital QR mobile-first</strong> que tus clientes escanean al instante sin descargar nada.</div>
              </li>
              <li>
                <span className={styles.luloCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                <div><strong>Pantalla KDS en cocina</strong> para despacho sin errores ni demoras.</div>
              </li>
              <li>
                <span className={styles.luloCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                <div><strong>Restro IA analítico</strong> que predice tus horas pico y platos más rentables.</div>
              </li>
              <li>
                <span className={styles.luloCheckIcon}><Check size={14} strokeWidth={3.5} /></span>
                <div><strong>Cero comisiones abusivas</strong> por pedido en mesa o para llevar.</div>
              </li>
            </ul>

            <div className={styles.showcaseCTA}>
              <Link href="/register" className={styles.btnPrimaryLg}>
                Probar Restro gratis <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Right Side 3D Floating Card Stack (Lulo Bank style) */}
          <div className={styles.luloStackWrapper}>
            <div className={styles.luloStackContainer} id="lulo-stack-container">
              
              {/* Card 1 (Top/Front): Main Analytics Dashboard */}
              <div className={`${styles.luloCard} ${styles.luloCard1}`} id="lulo-card-1">
                <Image src="/images/backgrounds/landing/mockup-analytics-dark.png" alt="Dashboard Restro" width={800} height={500} className={styles.luloCardImg} priority />
                <div className={`${styles.floatingBadge} ${styles.badgeTopLeft}`}>
                  <span className={styles.badgeIcon}><TrendingUp size={18} color="#2563EB" /></span>
                  <div>
                    <strong>+35% en Ventas</strong>
                    <small>Optimización con IA</small>
                  </div>
                </div>
              </div>

              {/* Card 2 (Middle): KDS Kitchen Screen */}
              <div className={`${styles.luloCard} ${styles.luloCard2}`} id="lulo-card-2">
                <Image src="/images/backgrounds/landing/mockup-kds.png" alt="KDS Cocina" width={800} height={500} className={styles.luloCardImg} priority />
                <div className={`${styles.floatingBadge} ${styles.badgeBottomRight}`}>
                  <span className={styles.badgeIcon}><MonitorCheck size={18} color="#0D9488" /></span>
                  <div>
                    <strong>KDS Cocina</strong>
                    <small>0 demoras en comandas</small>
                  </div>
                </div>
              </div>

              {/* Card 3 (Back/Bottom): Menu Digital QR */}
              <div className={`${styles.luloCard} ${styles.luloCard3}`} id="lulo-card-3">
                <Image src="/images/backgrounds/landing/mockup-menu-dark.png" alt="Carta Digital QR" width={800} height={500} className={styles.luloCardImg} priority />
                <div className={`${styles.floatingBadge} ${styles.badgeTopRight}`}>
                  <span className={styles.badgeIcon}><Sparkles size={18} color="#7C3AED" /></span>
                  <div>
                    <strong>Restro IA Activo</strong>
                    <small>Patrones en tiempo real</small>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── LOGO BAR ── */}
      <section className={styles.logoBar}>
        <div className={styles.logoBarInner}>
          <p className={styles.logoBarLabel}>Usado por restaurantes en toda Colombia</p>
          <div className={styles.logoBarItems}>
            {["Don Carlos", "La Parrilla", "Sabor Bogotano", "Tacos & Co.", "El Rincón", "Mar & Tierra"].map((name) => (
              <span key={name} className={styles.logoBarItem}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT DEEP DIVE 1: MENU ── */}
      <section className={styles.productSection} id="product-menu-section">
        <div className={`${styles.productRow} reveal-up`}>
          <div className={styles.productText} id="text-menu">
            <span className={styles.sectionLabel}>Carta Digital QR</span>
            <h2 className={styles.sectionTitle}>Tu menú siempre actualizado</h2>
            <p className={styles.sectionSub}>Olvídate de las cartas de papel. Gestiona categorías, platos, precios e imágenes en tiempo real desde tu panel.</p>
            <ul className={styles.productFeatureList}>
              <li className={styles.productFeatureItem}><span className={styles.productFeatureCheck}><Check size={14} strokeWidth={3}/></span> Carga imágenes para aumentar ventas hasta un 30%</li>
              <li className={styles.productFeatureItem}><span className={styles.productFeatureCheck}><Check size={14} strokeWidth={3}/></span> Actualiza precios y disponibilidad en segundos</li>
              <li className={styles.productFeatureItem}><span className={styles.productFeatureCheck}><Check size={14} strokeWidth={3}/></span> Personaliza con el logo y colores de tu marca</li>
            </ul>
            <div><Link href="/register" className={styles.btnPrimaryLg}>Crear mi carta gratis</Link></div>
          </div>
          <div className={styles.productMockupWrap} id="mockup-slot-menu">
            <Image src="/images/mockup-menu-dark.png" alt="Carta Digital" width={800} height={500} className={styles.productMockupMobileOnly} />
          </div>
        </div>
      </section>

      {/* ── PRODUCT DEEP DIVE 2: KDS ── */}
      <section className={`${styles.productSection} ${styles.productSectionAlt}`} id="product-kds-section">
        <div className={`${styles.productRow} ${styles.productRowReverse} reveal-up`}>
          <div className={styles.productText} id="text-kds">
            <span className={styles.sectionLabel}>KDS — Cocina Digital</span>
            <h2 className={styles.sectionTitle}>Comandas directo a cocina</h2>
            <p className={styles.sectionSub}>Elimina errores y demoras. Cada comanda llega instantáneamente con detalles a tu equipo de cocina.</p>
            <ul className={styles.productFeatureList}>
              <li className={styles.productFeatureItem}><span className={styles.productFeatureCheck}><Check size={14} strokeWidth={3}/></span> Vista en tiempo real de todos los pedidos activos</li>
              <li className={styles.productFeatureItem}><span className={styles.productFeatureCheck}><Check size={14} strokeWidth={3}/></span> Estados: Nuevo → En preparación → Listo</li>
              <li className={styles.productFeatureItem}><span className={styles.productFeatureCheck}><Check size={14} strokeWidth={3}/></span> Soporte para domicilio, llevar y en mesa</li>
            </ul>
            <div><Link href="/register" className={styles.btnPrimaryLg}>Probar KDS gratis</Link></div>
          </div>
          <div className={styles.productMockupWrap} id="mockup-slot-kds">
            <Image src="/images/mockup-kds.png" alt="KDS" width={800} height={500} className={styles.productMockupMobileOnly} />
          </div>
        </div>
      </section>

      {/* ── PRODUCT DEEP DIVE 3: IA ── */}
      <section className={styles.productSection} id="product-ia-section">
        <div className={`${styles.productRow} reveal-up`}>
          <div className={styles.productText} id="text-ia">
            <span className={styles.sectionLabel}>Restro IA</span>
            <h2 className={styles.sectionTitle}>Crece con Inteligencia</h2>
            <p className={styles.sectionSub}>Deja que los datos trabajen por ti. Restro IA analiza tus ventas y operaciones para entregarte insights accionables.</p>
            <ul className={styles.productFeatureList}>
              <li className={styles.productFeatureItem}><span className={styles.productFeatureCheck}><Check size={14} strokeWidth={3}/></span> Predicción de horas pico para optimizar tu staff</li>
              <li className={styles.productFeatureItem}><span className={styles.productFeatureCheck}><Check size={14} strokeWidth={3}/></span> Identificación automática de platos más rentables</li>
              <li className={styles.productFeatureItem}><span className={styles.productFeatureCheck}><Check size={14} strokeWidth={3}/></span> Sugerencias de combos para aumentar el ticket</li>
            </ul>
            <div><Link href="/register" className={styles.btnPrimaryLg}>Activar Restro IA</Link></div>
          </div>
          <div className={styles.productMockupWrap} id="mockup-slot-ia">
            <Image src="/images/mockup-analytics-dark.png" alt="IA Analytics" width={800} height={500} className={styles.productMockupMobileOnly} />
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID (CARACTERÍSTICAS AL FINAL DE LOS PRODUCTOS) ── */}
      <section className={styles.featuresSection} id="caracteristicas">
        <div className="reveal-up">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Características</span>
            <h2 className={styles.sectionTitle}>Todo lo que necesitas</h2>
            <p className={styles.sectionSub}>Desde la carta digital hasta la analítica con IA, Restro cubre cada aspecto operativo de tu negocio de manera simple y potente.</p>
          </div>
        </div>

        <div className={`${styles.featuresGridInline} stagger-grid`}>
          <article className={styles.featureCardPro}>
            <div className={`${styles.featureIconWrapPro} ${styles['featureIconWrap--blue']}`}>
              <QrCode size={32} strokeWidth={2.2} />
            </div>
            <h3 className={styles.featureTitlePro}>Carta Digital QR</h3>
            <p className={styles.featureDescPro}>Mobile-first, sin apps, personalizada. Tus clientes escanean y navegan tu carta en segundos.</p>
          </article>

          <article className={styles.featureCardPro}>
            <div className={`${styles.featureIconWrapPro} ${styles['featureIconWrap--teal']}`}>
              <MonitorCheck size={32} strokeWidth={2.2} />
            </div>
            <h3 className={styles.featureTitlePro}>KDS — Cocina</h3>
            <p className={styles.featureDescPro}>Comandas en tiempo real a la pantalla de cocina. Cero errores, cero papel, cero demoras.</p>
          </article>

          <article className={styles.featureCardPro}>
            <div className={`${styles.featureIconWrapPro} ${styles['featureIconWrap--violet']}`}>
              <BrainCircuit size={32} strokeWidth={2.2} />
            </div>
            <h3 className={styles.featureTitlePro}>Analítica con IA</h3>
            <p className={styles.featureDescPro}>Identifica platos estrella, predice horas pico y toma decisiones basadas en datos reales.</p>
          </article>

          <article className={styles.featureCardPro}>
            <div className={`${styles.featureIconWrapPro} ${styles['featureIconWrap--amber']}`}>
              <MessageSquare size={32} strokeWidth={2.2} />
            </div>
            <h3 className={styles.featureTitlePro}>Canal WhatsApp</h3>
            <p className={styles.featureDescPro}>Recibe pedidos directamente por WhatsApp sin intermediarios ni comisiones abusivas.</p>
          </article>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className={styles.statsSection}>
        <div className={`${styles.statsInner} stagger-grid`}>
          <div className={styles.statItem}><span className={styles.statNumber}>+120</span><span className={styles.statLabel}>Restaurantes activos</span></div>
          <div className={styles.statItem}><span className={`${styles.statNumber} ${styles.statAccent}`}>10</span><span className={styles.statLabel}>Minutos para activar</span></div>
          <div className={styles.statItem}><span className={styles.statNumber}>30%</span><span className={styles.statLabel}>Más ventas con fotos</span></div>
          <div className={styles.statItem}><span className={styles.statNumber}>0</span><span className={styles.statLabel}>Errores de pedido</span></div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className={styles.pricingSection} id="precios">
        <div className="reveal-up">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Precios</span>
            <h2 className={styles.sectionTitle}>Planes transparentes</h2>
            <p className={styles.sectionSub}>Sin cargos ocultos, sin permanencia mínima. Empieza gratis y escala cuando tu restaurante lo necesite.</p>
          </div>
        </div>
        
        <div className={`${styles.pricingGrid} stagger-grid`}>
          <article className={styles.planCard}>
            <h3 className={styles.planName}>Starter</h3>
            <p className={styles.planDesc}>Para restaurantes que están comenzando su digitalización</p>
            <div className={styles.planPriceWrap}>
              <span className={styles.planPrice}>Gratis</span><br/>
              <span className={styles.planPricePeriod}>Para siempre</span>
            </div>
            <hr className={styles.planDivider}/>
            <ul className={styles.planFeatureList}>
              <li className={styles.planFeatureItem}><span className={styles.planCheck}><Check size={16} strokeWidth={3}/></span> Carta digital QR personalizada</li>
              <li className={styles.planFeatureItem}><span className={styles.planCheck}><Check size={16} strokeWidth={3}/></span> Hasta 30 platos en carta</li>
              <li className={styles.planFeatureItem}><span className={styles.planCheck}><Check size={16} strokeWidth={3}/></span> Hasta 5 mesas con QR</li>
            </ul>
            <Link href="/register" className={`${styles.planCTA} ${styles.planCTASecondary}`}>Empezar gratis</Link>
          </article>

          <article className={`${styles.planCard} ${styles.planCardFeatured}`}>
            <span className={styles.planBadge}>RECOMENDADO</span>
            <h3 className={styles.planName}>Business</h3>
            <p className={styles.planDesc}>Para restaurantes que quieren crecer con operación digital completa</p>
            <div className={styles.planPriceWrap}>
              <span className={`${styles.planPrice} ${styles.planPriceFeatured}`}>$49.900</span><br/>
              <span className={styles.planPricePeriod}>COP / mes</span>
            </div>
            <hr className={styles.planDivider}/>
            <ul className={styles.planFeatureList}>
              <li className={styles.planFeatureItem}><span className={styles.planCheck}><Check size={16} strokeWidth={3}/></span> Platos ilimitados</li>
              <li className={styles.planFeatureItem}><span className={styles.planCheck}><Check size={16} strokeWidth={3}/></span> Hasta 30 mesas con QR</li>
              <li className={styles.planFeatureItem}><span className={styles.planCheck}><Check size={16} strokeWidth={3}/></span> KDS — pantalla de cocina</li>
            </ul>
            <Link href="/register" className={`${styles.planCTA} ${styles.planCTAPrimary}`}>Comenzar Business</Link>
          </article>

          <article className={styles.planCard}>
            <h3 className={styles.planName} style={{display:'flex', alignItems:'center', gap:'8px'}}>Restro IA <Sparkles size={18} color="#7C3AED"/></h3>
            <p className={styles.planDesc}>Para restaurantes que quieren decisiones basadas en IA</p>
            <div className={styles.planPriceWrap}>
              <span className={styles.planPrice}>$99.900</span><br/>
              <span className={styles.planPricePeriod}>COP / mes</span>
            </div>
            <hr className={styles.planDivider}/>
            <ul className={styles.planFeatureList}>
              <li className={styles.planFeatureItem}><span className={styles.planCheck}><Check size={16} strokeWidth={3}/></span> Todo lo de Business</li>
              <li className={styles.planFeatureItem}><span className={styles.planCheck}><Check size={16} strokeWidth={3}/></span> Mesas ilimitadas</li>
              <li className={styles.planFeatureItem}><span className={styles.planCheck}><Check size={16} strokeWidth={3}/></span> Analítica avanzada con IA</li>
            </ul>
            <Link href="/register" className={`${styles.planCTA} ${styles.planCTASecondary}`}>Activar Restro IA</Link>
          </article>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.faqSection} id="faq">
        <div className="reveal-up">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>FAQ</span>
            <h2 className={styles.sectionTitle}>Preguntas frecuentes</h2>
          </div>
        </div>
        <div className={`${styles.faqList} stagger-grid`}>
          {faqs.map((faq, i) => (
            <details key={i} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>
                {faq.q}
                <svg className={styles.faqChevron} viewBox="0 0 20 20" fill="none" width="20" height="20">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <p className={styles.faqAnswer}>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className={styles.ctaSection}>
        <div className={`${styles.ctaInner} reveal-up`}>
          <h2 className={styles.ctaTitle}>Digitaliza tu restaurante hoy mismo</h2>
          <p className={styles.ctaSub}>Únete a los +120 restaurantes colombianos que ya tienen su carta digital activa. Empieza gratis, sin tarjeta de crédito.</p>
          <div className={styles.heroCTA}>
            <Link href="/register" className={styles.btnPrimaryLgWhite}>Crear cuenta gratis <ArrowRight size={18}/></Link>
            <Link href="/don-carlos" className={styles.btnOutlineLgWhite}>Ver demo</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER FULL ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <Image src="/images/logo/logo.png" alt="Restro logo" width={32} height={32} style={{ borderRadius: 8 }} />
              <span className={styles.footerLogoText}>Restro</span>
            </div>
            <p className={styles.footerTagline}>
              La plataforma SaaS de carta digital, gestión de pedidos e inteligencia artificial para restaurantes colombianos.
            </p>
          </div>
          
          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Producto</span>
            <ul className={styles.footerLinks}>
              <li><a href="#caracteristicas" className={styles.footerLink}>Características</a></li>
              <li><a href="#precios" className={styles.footerLink}>Precios</a></li>
              <li><Link href="/don-carlos" className={styles.footerLink}>Demo</Link></li>
              <li><a href="#faq" className={styles.footerLink}>FAQ</a></li>
            </ul>
          </div>
          
          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Cuenta</span>
            <ul className={styles.footerLinks}>
              <li><Link href="/register" className={styles.footerLink}>Crear cuenta gratis</Link></li>
              <li><Link href="/login" className={styles.footerLink}>Iniciar sesión</Link></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Empresa</span>
            <ul className={styles.footerLinks}>
              <li><a href="https://adamind.co" target="_blank" className={styles.footerLink}>Adamind</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} Restro · Un producto de <a href="https://adamind.co" style={{color:'#94A3B8'}}>Adamind</a> · Colombia 🇨🇴
          </p>
          <ul className={styles.footerCopyLinks}>
            <li><a href="/privacy" className={styles.footerCopyLink}>Privacidad</a></li>
            <li><a href="/terms" className={styles.footerCopyLink}>Términos</a></li>
          </ul>
        </div>
      </footer>

    </div>
  );
}
