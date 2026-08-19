import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restro — Carta Digital QR + Gestión de Restaurantes con IA",
  description: "El SaaS de carta digital, KDS e IA analítica para restaurantes colombianos. Producto del portafolio de Adamind.",
};

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect("/overview");
  }

  return (
    <div className={styles.page}>
      {/* Background glow */}
      <div className={styles.bgGlow} aria-hidden="true" />

      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="#E11D48" />
                <path d="M10 28L20 12L30 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 22H25" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <span className={styles.logoText}>Restro</span>
          </div>

          <div className={styles.navActions}>
            <Link href="/don-carlos" target="_blank" className={styles.demoLink}>
              Ver Demo Carta
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">Crear Cuenta Gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <span className="badge badge--blue" style={{ marginBottom: "16px" }}>
          DISEÑADO PARA RESTAURANTES EN COLOMBIA · ADAMIND
        </span>
        <h1 className={styles.heroTitle}>
          Carta Digital QR + <br />
          <span className={styles.heroGradient}>Gestión e IA para Restaurantes</span>
        </h1>
        <p className={styles.heroSub}>
          Elimina la carta de papel, acelera los pedidos a cocina en tiempo real y aumenta tus ventas asistido por Inteligencia Artificial.
        </p>

        <div className={styles.heroCTA}>
          <Link href="/register">
            <Button variant="orange" size="lg">
              Empezar Gratis Ahora
            </Button>
          </Link>
          <Link href="/don-carlos" target="_blank">
            <Button variant="outline" size="lg">
              Probar Carta de Ejemplo (Demo)
            </Button>
          </Link>
        </div>
      </header>

      {/* Feature Grid */}
      <section className={styles.features}>
        <div className={styles.featureCard}>
          <h3>Carta Digital QR</h3>
          <p>Rápida, interactiva, mobile-first y 100% personalizada con los colores y logo de tu marca.</p>
        </div>

        <div className={styles.featureCard}>
          <h3>KDS / Pantalla de Cocina</h3>
          <p>Recibe comandas en tiempo real por mesa, para llevar o domicilio sin cometer errores de toma de pedido.</p>
        </div>

        <div className={styles.featureCard}>
          <h3>Capa de IA (Restro IA)</h3>
          <p>Recomendaciones automáticas de combos, sugerencias de precios y predicción de horas pico.</p>
        </div>

        <div className={styles.featureCard}>
          <h3>Canal WhatsApp</h3>
          <p>En desarrollo: conexión rápida por código QR sin trámites lentos con Meta API.</p>
        </div>
      </section>

      {/* Pricing Table */}
      <section className={styles.pricing}>
        <h2 className={styles.pricingTitle}>Planes Transparentes en COP</h2>
        <div className={styles.pricingGrid}>
          <div className={styles.priceCard}>
            <h3>Starter</h3>
            <p className={styles.priceNum}>Gratis</p>
            <p className={styles.priceSub}>Ideal para comenzar</p>
            <ul>
              <li>✓ Carta QR digital</li>
              <li>✓ Imágenes en platos</li>
              <li>✓ Hasta 5 mesas</li>
            </ul>
            <Link href="/register" style={{ marginTop: "auto" }}>
              <Button variant="secondary" size="md" fullWidth>Registrarme Gratis</Button>
            </Link>
          </div>

          <div className={`${styles.priceCard} ${styles["priceCard--featured"]}`}>
            <span className={styles.badgePopular}>RECOMENDADO</span>
            <h3>Restro IA</h3>
            <p className={styles.priceNum}>$49.900 <small>/mes</small></p>
            <p className={styles.priceSub}>El diferenciador real</p>
            <ul>
              <li>✓ Todo lo de Starter</li>
              <li>✓ <strong>IA recomendadora de platos</strong></li>
              <li>✓ <strong>IA analítica de horas pico</strong></li>
              <li>✓ Hasta 30 mesas</li>
            </ul>
            <Link href="/register" style={{ marginTop: "auto" }}>
              <Button variant="orange" size="md" fullWidth>Probar Restro IA</Button>
            </Link>
          </div>

          <div className={styles.priceCard}>
            <h3>Business</h3>
            <p className={styles.priceNum}>$99.900 <small>/mes</small></p>
            <p className={styles.priceSub}>Para restaurantes grandes</p>
            <ul>
              <li>✓ Mesas ilimitadas</li>
              <li>✓ Exportar reportes Excel/PDF</li>
              <li>✓ Cuentas staff ilimitadas</li>
            </ul>
            <Link href="/register" style={{ marginTop: "auto" }}>
              <Button variant="secondary" size="md" fullWidth>Comenzar Business</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 Restro · Un producto del portafolio de <strong>Adamind</strong> (Colombia)</p>
      </footer>
    </div>
  );
}
