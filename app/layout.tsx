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
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        {process.env.NODE_ENV === "development" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof window !== 'undefined') {
                  window.addEventListener('error', function(e) {
                    if (e.message && (e.message.includes('WebSocket') || e.message.includes('HMR') || e.message.includes('webpack'))) {
                      e.stopImmediatePropagation();
                    }
                  }, true);
                }
              `,
            }}
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
