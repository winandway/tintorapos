import type { MetadataRoute } from "next";
import { GUIAS } from "@/lib/docs";
import { URL_SITIO } from "@/lib/sitio";

export default function sitemap(): MetadataRoute.Sitemap {
  const fijas = ["/", "/docs", "/registro", "/privacidad", "/terminos"];
  return [
    ...fijas.map((ruta) => ({
      url: `${URL_SITIO}${ruta === "/" ? "" : ruta}`,
      changeFrequency: "weekly" as const,
      priority: ruta === "/" ? 1 : 0.7,
    })),
    ...GUIAS.map((g) => ({
      url: `${URL_SITIO}/docs/${g.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
