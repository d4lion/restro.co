import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  QrCode,
  MonitorCheck,
  BrainCircuit,
  MessageSquare,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import LandingClient from "./LandingClient";

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
      <LandingClient />
    </>
  );
}

