import type { NextConfig } from "next";
import path from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { cabecerasSeguridad } from "./src/lib/cabeceras-seguridad";
import { cabeceraLink } from "./src/lib/agentes/enlaces";

const desarrollo = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Hay un package-lock.json suelto en la carpeta personal: fijar la raíz del proyecto.
  turbopack: { root: path.resolve(import.meta.dirname) },
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  reactStrictMode: true,
  // YaDominios Cloud no ofrece el servicio de imágenes: se sirven tal cual.
  images: { unoptimized: true },
  async rewrites() {
    // Un agente que pide Markdown recibe Markdown; el navegador sigue viendo HTML.
    const markdown = [{ type: "header" as const, key: "accept", value: ".*text/markdown.*" }];
    return {
      beforeFiles: [
        { source: "/", has: markdown, destination: "/md" },
        { source: "/:ruta((?:es|en)(?:/.*)?)", has: markdown, destination: "/md/:ruta" },
        {
          source: "/:ruta(docs|docs/.*|privacidad|terminos|registro)",
          has: markdown,
          destination: "/md/:ruta",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      { source: "/:path*", headers: cabecerasSeguridad(desarrollo) },
      // Para agentes: dónde está el catálogo de API, la especificación, la
      // documentación, el estado y el manifiesto (RFC 8288 y RFC 9727 §3).
      {
        source: "/:ruta(|es|en|docs|es/docs|en/docs|registro|en/signup)",
        headers: [{ key: "Link", value: cabeceraLink() }],
      },
      // La dirección técnica de la plataforma no se indexa: Google solo ve tintorapos.com.
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<sub>.*)\\.sitios\\.dev" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;

// Da a `next dev` la base (DB) y el almacén (BUCKET) locales de wrangler.jsonc.
// Las pruebas de punta a punta usan su propia carpeta para no mezclarse con la
// base de desarrollo.
if (desarrollo) {
  const carpeta = process.env.TINTORA_PERSISTENCIA;
  // wrangler guarda en <carpeta>/v3 (igual que `wrangler d1 execute --persist-to`).
  void initOpenNextCloudflareForDev(carpeta ? { persist: { path: `${carpeta}/v3` } } : undefined);
}
