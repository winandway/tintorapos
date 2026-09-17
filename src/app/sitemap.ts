import type { MetadataRoute } from "next";
import { RUTAS_INDEXABLES, urlAbsoluta } from "@/lib/seo";
import { CONTENIDO_ACTUALIZADO } from "@/lib/sitio";

function prioridad(interna: string): number {
  if (interna === "") return 1;
  if (interna === "/docs") return 0.8;
  if (interna.startsWith("/docs/")) return 0.7;
  if (interna === "/registro") return 0.6;
  return 0.3;
}

/**
 * Cada página va en español (/es), en inglés (/en) y en su versión x-default, y
 * cada una declara las otras con hreflang para que Google muestre la de cada idioma.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return RUTAS_INDEXABLES.flatMap((interna) => {
    const languages = {
      es: urlAbsoluta(interna, "es"),
      en: urlAbsoluta(interna, "en"),
      "x-default": urlAbsoluta(interna),
    };
    return [languages.es, languages.en, languages["x-default"]].map((url) => ({
      url,
      lastModified: CONTENIDO_ACTUALIZADO,
      changeFrequency: interna.startsWith("/docs") ? ("monthly" as const) : ("weekly" as const),
      priority: prioridad(interna),
      alternates: { languages },
    }));
  });
}
