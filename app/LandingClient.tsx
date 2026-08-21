"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Check, ArrowRight, Sparkles, QrCode, MonitorCheck, BrainCircuit, MessageSquare } from "lucide-react";
import styles from "./page.module.css";

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
    )
    .fromTo(`.${styles.heroMockupWrap}`,
      { opacity: 0, y: 100 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" },
      "-=0.4"
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

  }, { scope: containerRef });

  return (
    <div className={styles.page} ref={containerRef}>
      
      {/* ── NAVBAR ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navLogo}>
            <img src="/images/logo/logo.png" alt="Restro logo" className={styles.navLogoIcon} />
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

      {/* ── MOCKUP HERO ── */}
      <div className={styles.heroMockupWrap}>
        <img src="/images/mockup-analytics-dark.png" alt="Dashboard" className={styles.heroMockup} />
      </div>

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

      {/* ── FEATURES GRID ── */}
      <section className={styles.featuresSection} id="caracteristicas">
        <div className="reveal-up">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Características</span>
            <h2 className={styles.sectionTitle}>Todo lo que necesitas</h2>
            <p className={styles.sectionSub}>Desde la carta digital hasta la analítica con IA, Restro cubre cada aspecto operativo de tu negocio de manera simple y potente.</p>
          </div>
        </div>

        <div className={`${styles.featuresGrid} stagger-grid`}>
          <article className={styles.featureCard}>
            <div className={`${styles.featureIconWrap} ${styles['featureIconWrap--blue']}`}><QrCode size={24} /></div>
            <h3 className={styles.featureTitle}>Carta Digital QR</h3>
            <p className={styles.featureDesc}>Mobile-first, sin apps, personalizada. Tus clientes escanean y navegan tu carta en segundos.</p>
          </article>
          <article className={styles.featureCard}>
            <div className={`${styles.featureIconWrap} ${styles['featureIconWrap--teal']}`}><MonitorCheck size={24} /></div>
            <h3 className={styles.featureTitle}>KDS — Cocina</h3>
            <p className={styles.featureDesc}>Comandas en tiempo real a la pantalla de cocina. Cero errores, cero papel, cero demoras.</p>
          </article>
          <article className={styles.featureCard}>
            <div className={`${styles.featureIconWrap} ${styles['featureIconWrap--violet']}`}><BrainCircuit size={24} /></div>
            <h3 className={styles.featureTitle}>Analítica con IA</h3>
            <p className={styles.featureDesc}>Identifica platos estrella, predice horas pico y toma decisiones basadas en datos reales.</p>
          </article>
          <article className={styles.featureCard}>
            <div className={`${styles.featureIconWrap} ${styles['featureIconWrap--amber']}`}><MessageSquare size={24} /></div>
            <h3 className={styles.featureTitle}>Canal WhatsApp</h3>
            <p className={styles.featureDesc}>Recibe pedidos directamente por WhatsApp sin intermediarios ni comisiones abusivas.</p>
          </article>
        </div>
      </section>

      {/* ── PRODUCT DEEP DIVE 1: MENU ── */}
      <section className={styles.productSection}>
        <div className={`${styles.productRow} reveal-up`}>
          <div className={styles.productText}>
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
          <div className={styles.productMockupWrap}>
            <img src="/images/mockup-menu-dark.png" alt="Carta Digital" className={styles.productMockup} />
          </div>
        </div>
      </section>

      {/* ── PRODUCT DEEP DIVE 2: KDS ── */}
      <section className={`${styles.productSection} ${styles.productSectionAlt}`}>
        <div className={`${styles.productRow} ${styles.productRowReverse} reveal-up`}>
          <div className={styles.productText}>
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
          <div className={styles.productMockupWrap}>
            <img src="/images/mockup-kds.png" alt="KDS" className={styles.productMockup} />
          </div>
        </div>
      </section>

      {/* ── PRODUCT DEEP DIVE 3: IA ── */}
      <section className={styles.productSection}>
        <div className={`${styles.productRow} reveal-up`}>
          <div className={styles.productText}>
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
          <div className={styles.productMockupWrap}>
            <img src="/images/mockup-analytics-dark.png" alt="IA Analytics" className={styles.productMockup} />
          </div>
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
              <img src="/images/logo/logo.png" alt="Restro logo" width={32} height={32} style={{ borderRadius: 8 }} />
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
