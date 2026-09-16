import type { Idioma } from "@/lib/i18n";
import { GUIAS_CLIENTES, GUIAS_SEGURIDAD } from "./guias-clientes";
import { GUIAS_EMPEZAR } from "./guias-empezar";
import { GUIAS_MOSTRADOR } from "./guias-mostrador";
import { GUIAS_OPERACION } from "./guias-operacion";
import type { Bloque, Guia, Seccion } from "./tipos";

export type { Bloque, Guia, Seccion, TextoGuia, NombreFigura } from "./tipos";

export const SECCIONES: Seccion[] = [
  { clave: "empezar", icono: "cohete", es: "Empezar", en: "Get started" },
  { clave: "mostrador", icono: "mostrador", es: "Mostrador", en: "Front counter" },
  { clave: "planta", icono: "escaner", es: "Planta", en: "Production" },
  { clave: "dinero", icono: "caja", es: "Caja y reportes", en: "Register & reports" },
  { clave: "clientes", icono: "mensaje", es: "Clientes", en: "Customers" },
  { clave: "seguridad", icono: "escudo", es: "Seguridad y datos", en: "Security & data" },
];

export const GUIAS: Guia[] = [
  ...GUIAS_EMPEZAR,
  ...GUIAS_MOSTRADOR,
  ...GUIAS_OPERACION,
  ...GUIAS_CLIENTES,
  ...GUIAS_SEGURIDAD,
];

export function guiaPorSlug(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug);
}

export function guiasDeSeccion(clave: Seccion["clave"]): Guia[] {
  return GUIAS.filter((g) => g.seccion === clave);
}

/** Texto plano de una guía (para el buscador y llms.txt). */
export function textoPlano(bloques: Bloque[]): string {
  const limpiar = (s: string) => s.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return bloques
    .map((b) => {
      if (b.t === "pasos" || b.t === "lista") return b.items.map(limpiar).join(" ");
      if (b.t === "figura") return limpiar(b.pie);
      return limpiar(b.texto);
    })
    .join(" ");
}

export interface EntradaBuscador {
  slug: string;
  titulo: string;
  resumen: string;
  seccion: string;
  icono: Guia["icono"];
  texto: string;
}

export function indiceBuscador(idioma: Idioma): EntradaBuscador[] {
  return GUIAS.map((g) => ({
    slug: g.slug,
    titulo: g[idioma].titulo,
    resumen: g[idioma].resumen,
    seccion: SECCIONES.find((s) => s.clave === g.seccion)?.[idioma] ?? "",
    icono: g.icono,
    texto: textoPlano(g[idioma].bloques),
  }));
}
