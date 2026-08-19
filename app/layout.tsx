import type { Metadata } from "next";
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
