import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Restro — Carta Digital QR para Restaurantes",
    template: "%s | Restro",
  },
  description:
    "La plataforma SaaS #1 para restaurantes colombianos. Carta digital con QR, gestión de pedidos en tiempo real e IA para hacer crecer tu negocio.",
  keywords: ["carta digital", "restaurante", "QR", "pedidos", "Colombia", "SaaS"],
  authors: [{ name: "Adamind" }],
  creator: "Adamind",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Restro by Adamind",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        {children}
      </body>
    </html>
  );
}
