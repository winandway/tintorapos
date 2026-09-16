import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tintora POS",
    short_name: "Tintora",
    description:
      "Punto de venta para tintorerías y lavanderías · Point of sale for dry cleaners and laundries",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f6f5fb",
    theme_color: "#3524a8",
    lang: "es",
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/iconos/icono-enmascarable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
