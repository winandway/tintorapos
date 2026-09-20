import { CATEGORIAS_GASTO } from "@/server/contabilidad/categorias";
import type { Idioma } from "@/lib/i18n";

/**
 * Los nombres de las categorías en pantalla. El catálogo es una lista de datos
 * sin nada del servidor adentro, así que el navegador lo puede traer tal cual.
 */
export const CATEGORIAS = CATEGORIAS_GASTO;

export function nombreCategoria(clave: string, idioma: Idioma): string {
  return CATEGORIAS_GASTO.find((c) => c.clave === clave)?.[idioma] ?? clave;
}
