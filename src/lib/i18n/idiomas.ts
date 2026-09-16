export const IDIOMAS = ["es", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_POR_DEFECTO: Idioma = "es";
export const COOKIE_IDIOMA = "tp_idioma";

export function esIdioma(v: unknown): v is Idioma {
  return typeof v === "string" && (IDIOMAS as readonly string[]).includes(v);
}

/** Elige el idioma a partir de la cabecera Accept-Language del navegador. */
export function idiomaDesdeNavegador(cabecera: string | null | undefined): Idioma {
  if (!cabecera) return IDIOMA_POR_DEFECTO;
  const preferidos = cabecera
    .split(",")
    .map((parte) => {
      const [etiqueta = "", ...params] = parte.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { base: etiqueta.toLowerCase().split("-")[0] ?? "", q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((p) => p.base && !Number.isNaN(p.q))
    .sort((a, b) => b.q - a.q);
  for (const p of preferidos) if (esIdioma(p.base)) return p.base;
  return IDIOMA_POR_DEFECTO;
}

/** Etiqueta BCP 47 para formatear números y fechas. */
export function localeDe(idioma: Idioma, region = "US"): string {
  return `${idioma}-${region}`;
}
