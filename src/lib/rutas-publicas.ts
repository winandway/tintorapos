/**
 * Direcciones públicas por idioma (SEO). Cada página pública existe en tres formas:
 *   /es/…  → español, fija   (canónica en español)
 *   /en/…  → inglés, fija    (canónica en inglés, con direcciones en inglés)
 *   /…     → x-default: elige idioma por cookie o navegador
 * El proxy (src/proxy.ts) traduce /es y /en a la ruta interna y fija el idioma.
 */
import { SLUG_EN } from "@/lib/docs/slugs";
import { esIdioma, type Idioma } from "@/lib/i18n/idiomas";

export const PAGINAS = {
  inicio: { interna: "", es: "", en: "" },
  docs: { interna: "/docs", es: "/docs", en: "/docs" },
  privacidad: { interna: "/privacidad", es: "/privacidad", en: "/privacy" },
  terminos: { interna: "/terminos", es: "/terminos", en: "/terms" },
  registro: { interna: "/registro", es: "/registro", en: "/signup" },
} as const;

export type Pagina = keyof typeof PAGINAS;

const SLUG_ES = Object.fromEntries(Object.entries(SLUG_EN).map(([es, en]) => [en, es]));

/** Ruta interna (sin prefijo, en español) → ruta pública en ese idioma, con prefijo. */
export function rutaPublica(idioma: Idioma, interna: string): string {
  const guia = /^\/docs\/([a-z0-9-]+)$/.exec(interna);
  if (guia) {
    const slug = guia[1]!;
    return `/${idioma}/docs/${idioma === "en" ? (SLUG_EN[slug] ?? slug) : slug}`;
  }
  const pagina = Object.values(PAGINAS).find((p) => p.interna === interna);
  if (pagina) return `/${idioma}${pagina[idioma]}`;
  return `/${idioma}${interna}`;
}

export function rutaPagina(idioma: Idioma, pagina: Pagina): string {
  return `/${idioma}${PAGINAS[pagina][idioma]}`;
}

export function rutaGuia(idioma: Idioma, slugEs: string): string {
  return rutaPublica(idioma, `/docs/${slugEs}`);
}

export interface RutaResuelta {
  idioma: Idioma;
  /** Ruta de la app que atiende la petición. */
  interna: string;
  /** Dirección pública correcta para ese idioma (para redirigir si llegó otra). */
  canonica: string;
}

/**
 * /en/privacy → { en, /privacidad, /en/privacy }. Si alguien entra con el slug del
 * otro idioma (/en/docs/primeros-pasos) la canónica sale distinta y el proxy redirige.
 * Devuelve null si la ruta no empieza por /es o /en.
 */
export function resolverRutaConIdioma(pathname: string): RutaResuelta | null {
  const idioma = pathname.slice(1, 3);
  const siguiente = pathname.charAt(3);
  if (!esIdioma(idioma) || (siguiente !== "" && siguiente !== "/")) return null;
  let resto = pathname.slice(3);
  while (resto.endsWith("/")) resto = resto.slice(0, -1);
  const guia = /^\/docs\/([a-z0-9-]+)$/.exec(resto);
  if (guia) {
    const slug = guia[1]!;
    const slugEs = SLUG_EN[slug] ? slug : (SLUG_ES[slug] ?? slug);
    const interna = `/docs/${slugEs}`;
    return { idioma, interna, canonica: rutaPublica(idioma, interna) };
  }
  const pagina = Object.values(PAGINAS).find((p) => p.es === resto || p.en === resto);
  if (pagina) return { idioma, interna: pagina.interna || "/", canonica: `/${idioma}${pagina[idioma]}` };
  return { idioma, interna: resto || "/", canonica: `/${idioma}${resto}` };
}

/** Dirección equivalente en el otro idioma (para el selector de banderas). null si la página no tiene prefijo. */
export function rutaEquivalente(pathname: string, nuevo: Idioma): string | null {
  const r = resolverRutaConIdioma(pathname);
  if (!r) return null;
  return rutaPublica(nuevo, r.interna === "/" ? "" : r.interna);
}
