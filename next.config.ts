import type { NextConfig } from "next";
import path from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { cabecerasSeguridad } from "./src/lib/cabeceras-seguridad";

const desarrollo = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Hay un package-lock.json suelto en la carpeta personal: fijar la raíz del proyecto.
  turbopack: { root: path.resolve(import.meta.dirname) },
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  reactStrictMode: true,
  // YaDominios Cloud no ofrece el servicio de imágenes: se sirven tal cual.
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: cabecerasSeguridad(desarrollo) }];
  },
};

export default nextConfig;

// Da a `next dev` la base (DB) y el almacén (BUCKET) locales de wrangler.jsonc.
// Las pruebas de punta a punta usan su propia carpeta para no mezclarse con la
// base de desarrollo.
if (desarrollo) {
  const carpeta = process.env.TINTORA_PERSISTENCIA;
  void initOpenNextCloudflareForDev(carpeta ? { persist: { path: carpeta } } : undefined);
}
