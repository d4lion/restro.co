import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://restro.adamind.co";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Restro — Carta Digital QR + IA para Restaurantes en Colombia",
    template: "%s | Restro",
  },
  description:
    "La plataforma SaaS para restaurantes colombianos. Carta digital con código QR, gestión de pedidos en tiempo real, KDS de cocina e inteligencia artificial analítica.",
  keywords: [
    "carta digital restaurante Colombia",
    "carta digital QR",
    "software gestión restaurante",
    "pedidos tiempo real restaurante",
    "KDS cocina restaurante",
    "inteligencia artificial restaurante",
    "SaaS restaurante",
    "digitalizar restaurante",
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
    alternateLocale: "es",
    url: BASE_URL,
    siteName: "Restro by Adamind",
    title: "Restro — Carta Digital QR + IA para Restaurantes en Colombia",
    description:
      "La plataforma SaaS para restaurantes colombianos. Carta digital con código QR, gestión de pedidos en tiempo real, KDS e IA analítica.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Restro — Carta Digital QR para Restaurantes",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@adamind_co",
    creator: "@adamind_co",
    title: "Restro — Carta Digital QR + IA para Restaurantes",
    description:
      "Digitaliza tu carta en 10 minutos y crece con IA. El SaaS para restaurantes colombianos.",
    images: ["/images/og-image.png"],
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "es-CO": BASE_URL,
      es: BASE_URL,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  category: "technology",
  classification: "SaaS, Restaurantes, Tecnología",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#2563EB",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" dir="ltr">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS-prefetch fallback */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

