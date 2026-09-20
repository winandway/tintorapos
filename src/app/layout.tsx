import type { Metadata, Viewport } from "next";
import { Archivo, Atkinson_Hyperlegible_Next } from "next/font/google";
import { ProveedorIdioma } from "@/lib/i18n/cliente";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { URL_SITIO } from "@/lib/sitio";
import { latirReloj } from "@/server/reloj/interno";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--fuente-archivo",
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  variable: "--fuente-atkinson",
  display: "swap",
});

const descripcionEs =
  "El punto de venta en la nube para tintorerías y lavanderías: etiqueta con QR por prenda, avisos por SMS, caja y reportes. Funciona sin internet. En español e inglés.";

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: {
    default: "Tintora POS — Punto de venta para tintorerías y lavanderías",
    template: "%s · Tintora POS",
  },
  description: descripcionEs,
  applicationName: "Tintora POS",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Tintora POS",
    title: "Tintora POS — Punto de venta para tintorerías y lavanderías",
    description: descripcionEs,
    url: URL_SITIO,
    locale: "es_US",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tintora POS — Punto de venta para tintorerías y lavanderías",
    description: descripcionEs,
  },
  appleWebApp: { capable: true, title: "Tintora POS", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#3524a8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // El reloj late con el tráfico del sitio: avisos, recordatorios y respaldos
  // salen sin depender de un cron de nadie. Corre DESPUÉS de responder.
  latirReloj();
  const { idioma, d } = await obtenerTextos();
  return (
    <html lang={idioma} className={`${archivo.variable} ${atkinson.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-superficie focus:px-4 focus:py-2"
        >
          {d.comun.saltarAlContenido}
        </a>
        <ProveedorIdioma idioma={idioma} d={d}>
          {children}
        </ProveedorIdioma>
      </body>
    </html>
  );
}
