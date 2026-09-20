import type { Metadata } from "next";
import { GUIAS } from "@/lib/docs";
import type { Idioma } from "@/lib/i18n/idiomas";
import { rutaPublica } from "@/lib/rutas-publicas";
import { URL_SITIO } from "@/lib/sitio";

export const LOCALE_OG: Record<Idioma, string> = { es: "es_US", en: "en_US" };

/** URL absoluta de una ruta interna en un idioma (o la x-default sin idioma). */
export function urlAbsoluta(interna: string, idioma?: Idioma): string {
  const ruta = idioma ? rutaPublica(idioma, interna === "/" ? "" : interna) : interna || "/";
  return `${URL_SITIO}${ruta === "/" ? "" : ruta}`;
}

/**
 * Canónica + hreflang de una página pública. Con idioma en la dirección, la canónica
 * es la de ese idioma; sin él (x-default), la dirección sin prefijo.
 */
export function alternatesDe(
  interna: string,
  idioma: Idioma,
  enLaDireccion: boolean,
): Metadata["alternates"] {
  return {
    canonical: enLaDireccion ? urlAbsoluta(interna, idioma) : urlAbsoluta(interna),
    languages: {
      es: urlAbsoluta(interna, "es"),
      en: urlAbsoluta(interna, "en"),
      "x-default": urlAbsoluta(interna),
    },
  };
}

/** JSON-LD seguro para incrustar en un <script> (no deja cerrar la etiqueta). */
export function jsonLd(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}

/** Rutas internas de todas las páginas públicas indexables (la app y las páginas de cada cliente no). */
export const RUTAS_INDEXABLES = [
  "",
  "/docs",
  ...GUIAS.map((g) => `/docs/${g.slug}`),
  "/registro",
  "/contacto",
  "/privacidad",
  "/terminos",
];
